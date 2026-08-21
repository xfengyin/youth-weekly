/**
 * content.ts 单元测试
 *
 * 覆盖以下关键场景:
 * 1. getIssueBySlug 路径遍历防护(白名单正则 ^\d+$)
 * 2. 空 slug、无效 slug、特殊字符 slug
 * 3. 正常 slug 从 issue-<slug>.json 返回完整 Issue
 * 4. getAllIssues 从 issue_index.json 读取(已发布列表,按期号倒序)
 * 5. getCategories 从 site-data.json 读取分类
 * 6. getSearchIndex 从 search-data.json 读取搜索索引
 * 7. 缺少产物时抛出可操作错误
 */

import path from 'path'
import type { Issue } from '../content'

// 构造内存中的"文件系统"快照:key 为 <cwd>/public/<file> 归一化路径
type FsSnapshot = Record<string, string>

const PUBLIC_DIR = path.join(process.cwd(), 'public')

const norm = (p: string): string => p.replace(/\\/g, '/').replace(/\/+$/g, '')

// 通过 jest.mock 替换 fs,__setFs 注入快照
jest.mock('fs', () => {
  let snapshot: FsSnapshot = {}
  const existsSync = (p: string): boolean => {
    const k = norm(p)
    // public 目录本身视为存在（只要快照里注入过任何文件）
    if (k === norm(PUBLIC_DIR)) return Object.keys(snapshot).length > 0
    return Object.prototype.hasOwnProperty.call(snapshot, k)
  }
  const readFileSync = (p: string, _enc?: string): string => {
    const k = norm(p)
    if (!Object.prototype.hasOwnProperty.call(snapshot, k)) {
      const err: NodeJS.ErrnoException = new Error(`ENOENT: no such file '${k}'`)
      err.code = 'ENOENT'
      throw err
    }
    return snapshot[k]
  }
  return {
    __esModule: false,
    existsSync,
    readFileSync,
    __setFs: (next: FsSnapshot) => {
      snapshot = next
    },
  }
})

let fsMock: { __setFs: (snapshot: FsSnapshot) => void }

const json = (obj: unknown): string => JSON.stringify(obj)

const publicFile = (rel: string): string => norm(path.join(PUBLIC_DIR, rel))

const setPublicFiles = (files: Record<string, unknown>): void => {
  const snapshot: FsSnapshot = {}
  for (const [rel, data] of Object.entries(files)) {
    snapshot[publicFile(rel)] = typeof data === 'string' ? data : json(data)
  }
  fsMock.__setFs(snapshot)
}

describe('content.ts（JSON 数据源）', () => {
  beforeEach(() => {
    // 清除 require 缓存,让 content 模块在每个 case 重新加载；
    // resetModules 后必须重新获取 fs mock（工厂会重新执行，旧实例已失效）
    jest.resetModules()
    fsMock = jest.requireMock('fs') as { __setFs: (snapshot: FsSnapshot) => void }
  })

  describe('getIssueBySlug - 路径遍历防护', () => {
    it('空 slug 应该返回 null', () => {
      setPublicFiles({})
      const { getIssueBySlug } = require('../content')
      expect(getIssueBySlug('')).toBeNull()
    })

    it('非数字 slug 应该返回 null(防路径遍历)', () => {
      setPublicFiles({})
      const { getIssueBySlug } = require('../content')
      expect(getIssueBySlug('../etc/passwd')).toBeNull()
      expect(getIssueBySlug('../../secret')).toBeNull()
      expect(getIssueBySlug('1/../2')).toBeNull()
      expect(getIssueBySlug('001;rm -rf')).toBeNull()
      expect(getIssueBySlug('README')).toBeNull()
      expect(getIssueBySlug('-1')).toBeNull()
      expect(getIssueBySlug('1.5')).toBeNull()
    })
  })

  describe('getIssueBySlug - 正常与边界场景', () => {
    it('合法数字 slug 且存在 issue-<slug>.json 时返回完整 Issue', () => {
      setPublicFiles({
        'issue-001.json': {
          issue: 1,
          title: '青年周刊 · 创刊号',
          date: '2026-04-08',
          published: true,
          description: '创刊号',
          content: '# 创刊号内容\n',
          cover: './assets/cover.png',
          slug: '001',
        },
      })
      const { getIssueBySlug } = require('../content')
      const issue: Issue | null = getIssueBySlug('001')

      expect(issue).not.toBeNull()
      expect(issue).toMatchObject({
        issue: 1,
        title: '青年周刊 · 创刊号',
        date: '2026-04-08',
        published: true,
        cover: './assets/cover.png',
        description: '创刊号',
        content: '# 创刊号内容\n',
        slug: '001',
      })
    })

    it('合法 slug 但缺少 issue-<slug>.json 时返回 null', () => {
      setPublicFiles({})
      const { getIssueBySlug } = require('../content')
      expect(getIssueBySlug('999')).toBeNull()
    })

    it('JSON 缺少字段时使用默认值', () => {
      setPublicFiles({
        'issue-010.json': { issue: 10, title: '第10期', date: '2026-05-01' },
      })
      const { getIssueBySlug } = require('../content')
      const issue = getIssueBySlug('010')
      expect(issue).not.toBeNull()
      expect(issue?.title).toBe('第10期')
      expect(issue?.description).toBeUndefined()
      expect(issue?.content).toBeUndefined()
    })
  })

  describe('getAllIssues - 从 issue_index.json 读取', () => {
    it('按期号顺序返回列表条目(生成器已倒序、只含已发布)', () => {
      setPublicFiles({
        'issue_index.json': [
          { issue: 3, title: '第3期', date: '2026-04-22', description: 'd3', slug: '003' },
          { issue: 1, title: '第1期', date: '2026-04-08', description: 'd1', slug: '001' },
        ],
      })
      const { getAllIssues } = require('../content')
      const issues = getAllIssues()

      expect(issues).toHaveLength(2)
      expect(issues[0].slug).toBe('003')
      expect(issues[1].slug).toBe('001')
      // 列表条目不含正文
      expect(issues[0].content).toBeUndefined()
      expect(issues[0].published).toBe(true)
    })

    it('产物缺失时抛出可操作错误(而非静默空数据)', () => {
      setPublicFiles({ 'robots.txt': 'User-agent: *' })
      const { getAllIssues } = require('../content')
      expect(() => getAllIssues()).toThrow(/issue_index\.json/)
      expect(() => getAllIssues()).toThrow(/youth-weekly generate/)
    })

    it('issue_index.json 非数组时返回空数组', () => {
      setPublicFiles({ 'issue_index.json': { not: 'array' } })
      const { getAllIssues } = require('../content')
      expect(getAllIssues()).toEqual([])
    })
  })

  describe('getCategories - 从 site-data.json 读取', () => {
    it('返回配置中的分类列表', () => {
      setPublicFiles({
        'site-data.json': {
          site: { name: '青年周刊' },
          categories: [
            { id: 'tech', name: '科技新势力', icon: '🚀', tagline: 'AI 工具' },
            { id: 'jobs', name: '谁在招人', icon: '💼' },
          ],
        },
      })
      const { getCategories } = require('../content')
      const categories = getCategories()

      expect(categories).toHaveLength(2)
      expect(categories[0]).toMatchObject({ id: 'tech', name: '科技新势力' })
      expect(categories[1].tagline).toBeUndefined()
    })

    it('产物缺失时抛出可操作错误', () => {
      setPublicFiles({ 'robots.txt': 'User-agent: *' })
      const { getCategories } = require('../content')
      expect(() => getCategories()).toThrow(/site-data\.json/)
    })
  })

  describe('getSearchIndex - 从 search-data.json 读取', () => {
    it('返回搜索索引条目', () => {
      setPublicFiles({
        'search-data.json': [
          { issue: 1, title: '创刊号', date: '2026-04-08', slug: '001', excerpt: '这是摘要...' },
        ],
      })
      const { getSearchIndex } = require('../content')
      const index = getSearchIndex()

      expect(index).toHaveLength(1)
      expect(index[0]).toMatchObject({ issue: 1, slug: '001', excerpt: '这是摘要...' })
    })
  })

  describe('getSiteData - 站点元数据', () => {
    it('返回 site-data.json 完整结构', () => {
      setPublicFiles({
        'site-data.json': {
          site: { name: '青年周刊', url: 'https://xfengyin.github.io/youth-weekly' },
          author: { name: '编辑部' },
          categories: [],
          build: { node_version: '20' },
        },
      })
      const { getSiteData } = require('../content')
      const siteData = getSiteData()
      expect(siteData.site.name).toBe('青年周刊')
      expect(siteData.categories).toEqual([])
    })
  })
})
