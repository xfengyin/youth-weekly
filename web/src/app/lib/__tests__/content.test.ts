/**
 * content.ts 单元测试
 *
 * 覆盖以下关键场景:
 * 1. getIssueBySlug 路径遍历防护(白名单正则 ^\d+$)
 * 2. 空 slug、无效 slug、特殊字符 slug
 * 3. 正常 slug 返回 frontmatter 与 content
 * 4. published 过滤(只返回 published: true)
 * 5. getAllIssues 排序(按期号倒序)
 * 6. renderMarkdown XSS 清洗
 * 7. getSearchIndex excerpt 生成
 * 8. categories 常量结构
 */

import path from 'path'
import type { Issue } from '../content'

// 构造内存中的"文件系统"快照,key 为相对 docs 的路径
type FsSnapshot = Record<string, string>

const ORIGINAL_CWD = process.cwd()
const DOCS_ISSUES_DIR = path.join(ORIGINAL_CWD, '..', 'docs', 'issues')

// 通过 jest.mock 在每个用例中替换 fs 实现
jest.mock('fs', () => {
  // 实际快照由 __setFs() 在 beforeEach 注入
  let snapshot: FsSnapshot = {}
  const existsSync = (p: string): boolean => {
    const normalized = normalize(p)
    return Object.prototype.hasOwnProperty.call(snapshot, normalized)
  }
  const readFileSync = (p: string, _enc: string): string => {
    const normalized = normalize(p)
    if (!Object.prototype.hasOwnProperty.call(snapshot, normalized)) {
      const err: NodeJS.ErrnoException = new Error(
        `ENOENT: no such file '${normalized}'`
      )
      err.code = 'ENOENT'
      throw err
    }
    return snapshot[normalized]
  }
  const readdirSync = (p: string): string[] => {
    const normalized = normalize(p)
    const prefix = normalized.endsWith('/') ? normalized : `${normalized}/`
    const dirs = new Set<string>()
    for (const key of Object.keys(snapshot)) {
      if (!key.startsWith(prefix)) continue
      const rest = key.slice(prefix.length)
      const head = rest.split('/')[0]
      if (head) dirs.add(head)
    }
    return Array.from(dirs)
  }

  // 去掉可能的盘符并将 \ 转为 /
  function normalize(p: string): string {
    return p.replace(/\\/g, '/').replace(/\/+$/g, '')
  }

  return {
    __esModule: false,
    existsSync,
    readFileSync,
    readdirSync,
    __setFs: (next: FsSnapshot) => {
      snapshot = next
    },
    __getDocsIssuesDir: () => DOCS_ISSUES_DIR,
  }
})

// 从 mock 中取出注入器
const fsMock = jest.requireMock('fs') as {
  __setFs: (snapshot: FsSnapshot) => void
}

const issuePath = (slug: string) =>
  path.join(DOCS_ISSUES_DIR, slug, 'README.md')

const buildIssue = (
  slug: string,
  frontmatter: Record<string, unknown>,
  body = '# body'
): string => {
  const yaml = Object.entries(frontmatter)
    .map(([k, v]) => {
      if (typeof v === 'string') return `${k}: "${v.replace(/"/g, '\\"')}"`
      return `${k}: ${v}`
    })
    .join('\n')
  return `---\n${yaml}\n---\n\n${body}\n`
}

const snapshotFrom = (entries: Array<[string, string]>): FsSnapshot => {
  // 每个 entry 既可以是 "001/README.md" 也可以是带 docs 前缀的绝对路径
  const map: FsSnapshot = {}
  for (const [rel, content] of entries) {
    const normalized = rel.replace(/\\/g, '/').replace(/^\/+/, '')
    map[normalized] = content
  }
  return map
}

describe('content.ts', () => {
  beforeEach(() => {
    // 重要:清除 require 缓存,让 content 模块在每个 case 重新加载
    // 这样它内部对 process.cwd 的引用与最新 fs mock 保持一致
    jest.resetModules()
  })

  describe('getIssueBySlug - 路径遍历防护', () => {
    it('空 slug 应该返回 null', () => {
      // Arrange
      fsMock.__setFs(snapshotFrom([]))
      const { getIssueBySlug } = require('../content')

      // Act
      const result = getIssueBySlug('')

      // Assert
      expect(result).toBeNull()
    })

    it('非数字 slug 应该返回 null(防路径遍历)', () => {
      fsMock.__setFs(snapshotFrom([]))
      const { getIssueBySlug } = require('../content')

      expect(getIssueBySlug('../etc/passwd')).toBeNull()
      expect(getIssueBySlug('../../secret')).toBeNull()
      expect(getIssueBySlug('1/../2')).toBeNull()
    })

    it('带特殊字符的 slug 应该返回 null', () => {
      fsMock.__setFs(snapshotFrom([]))
      const { getIssueBySlug } = require('../content')

      expect(getIssueBySlug('001;rm -rf')).toBeNull()
      expect(getIssueBySlug('001|whoami')).toBeNull()
      expect(getIssueBySlug('001 and 1=1')).toBeNull()
      expect(getIssueBySlug('README')).toBeNull()
    })

    it('负数 slug 应该返回 null', () => {
      fsMock.__setFs(snapshotFrom([]))
      const { getIssueBySlug } = require('../content')

      expect(getIssueBySlug('-1')).toBeNull()
    })

    it('浮点数 slug 应该返回 null', () => {
      fsMock.__setFs(snapshotFrom([]))
      const { getIssueBySlug } = require('../content')

      expect(getIssueBySlug('1.5')).toBeNull()
    })
  })

  describe('getIssueBySlug - 正常与边界场景', () => {
    it('合法数字 slug 且存在文件时返回完整 Issue', () => {
      const slug = '001'
      const rel = `${slug}/README.md`
      const file = buildIssue(
        slug,
        {
          issue: 1,
          title: '青年周刊 · 创刊号',
          date: '2026-04-08',
          published: true,
          cover: './assets/cover.png',
          description: '创刊号',
        },
        '# 创刊号内容'
      )
      fsMock.__setFs(snapshotFrom([[rel, file]]))
      const { getIssueBySlug } = require('../content')

      const issue: Issue | null = getIssueBySlug(slug)

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

    it('合法 slug 但文件不存在时返回 null', () => {
      fsMock.__setFs(snapshotFrom([]))
      const { getIssueBySlug } = require('../content')

      expect(getIssueBySlug('999')).toBeNull()
    })

    it('未发布 (published=false) 的 issue 仍然可以通过 getIssueBySlug 拿到原始数据', () => {
      const slug = '008'
      const rel = `${slug}/README.md`
      const file = buildIssue(
        slug,
        {
          issue: 8,
          title: '第 8 期',
          date: '2026-07-13',
          published: false,
        },
        '草稿内容'
      )
      fsMock.__setFs(snapshotFrom([[rel, file]]))
      const { getIssueBySlug } = require('../content')

      const issue = getIssueBySlug(slug)

      expect(issue).not.toBeNull()
      expect(issue?.published).toBe(false)
      expect(issue?.content).toBe('草稿内容\n')
    })

    it('缺少 frontmatter 字段时使用默认值', () => {
      const slug = '010'
      const rel = `${slug}/README.md`
      // 只提供 issue 字段,缺 title/date/cover/description
      const file = `---\nissue: 10\n---\n\n# 第 10 期\n`
      fsMock.__setFs(snapshotFrom([[rel, file]]))
      const { getIssueBySlug } = require('../content')

      const issue = getIssueBySlug(slug)

      expect(issue).not.toBeNull()
      expect(issue?.title).toBe('第10期')
      expect(issue?.date).toBe('')
      expect(issue?.cover).toBeUndefined()
      expect(issue?.description).toBeUndefined()
      expect(issue?.published).toBe(false)
    })
  })

  describe('getAllIssues - 排序与过滤', () => {
    it('按期号倒序返回', () => {
      // Arrange:在 issues 目录下提供 001/002/003 三个目录,只发布 001/003
      const e1 = buildIssue('001', { issue: 1, title: '第1期', date: '2026-04-08', published: true })
      const e3 = buildIssue('003', { issue: 3, title: '第3期', date: '2026-04-22', published: true })
      const e2 = buildIssue('002', { issue: 2, title: '第2期', date: '2026-04-15', published: true })
      fsMock.__setFs(
        snapshotFrom([
          ['001/README.md', e1],
          ['002/README.md', e2],
          ['003/README.md', e3],
        ])
      )
      const { getAllIssues } = require('../content')

      // Act
      const issues = getAllIssues()

      // Assert
      expect(issues.map((i) => i.issue)).toEqual([3, 2, 1])
    })

    it('只返回 published: true 的 issue', () => {
      const published = buildIssue('001', {
        issue: 1,
        title: '已发布',
        date: '2026-04-08',
        published: true,
      })
      const draft = buildIssue('002', {
        issue: 2,
        title: '草稿',
        date: '2026-04-15',
        published: false,
      })
      fsMock.__setFs(
        snapshotFrom([
          ['001/README.md', published],
          ['002/README.md', draft],
        ])
      )
      const { getAllIssues } = require('../content')

      const issues = getAllIssues()

      expect(issues).toHaveLength(1)
      expect(issues[0].title).toBe('已发布')
    })

    it('忽略非数字目录(如 assets、tools 等)', () => {
      const e1 = buildIssue('001', {
        issue: 1,
        title: 'A',
        date: '2026-04-08',
        published: true,
      })
      fsMock.__setFs(
        snapshotFrom([
          ['001/README.md', e1],
          // 非数字目录应被正则过滤
          ['assets/logo.png', 'binary'],
          ['tools/script.sh', '#!/bin/sh'],
        ])
      )
      const { getAllIssues } = require('../content')

      const issues = getAllIssues()

      expect(issues).toHaveLength(1)
      expect(issues[0].issue).toBe(1)
    })

    it('当 issues 目录不存在时返回空数组', () => {
      fsMock.__setFs(snapshotFrom([]))
      const { getAllIssues } = require('../content')

      expect(getAllIssues()).toEqual([])
    })

    it('当某期目录缺少 README.md 时跳过该期', () => {
      const e1 = buildIssue('001', {
        issue: 1,
        title: 'A',
        date: '2026-04-08',
        published: true,
      })
      const e3 = buildIssue('003', {
        issue: 3,
        title: 'C',
        date: '2026-04-22',
        published: true,
      })
      fsMock.__setFs(
        snapshotFrom([
          ['001/README.md', e1],
          // 002 没有 README.md
          ['003/README.md', e3],
        ])
      )
      const { getAllIssues } = require('../content')

      const issues = getAllIssues()
      expect(issues.map((i) => i.issue)).toEqual([3, 1])
    })
  })

  describe('renderMarkdown - XSS 防护', () => {
    it('过滤 script 标签', async () => {
      const { renderMarkdown } = require('../content')

      const html = await renderMarkdown('Hello <script>alert(1)</script> world')

      expect(html).not.toMatch(/<script/i)
      expect(html).toContain('Hello')
      expect(html).toContain('world')
    })

    it('保留基础 markdown 元素', async () => {
      const { renderMarkdown } = require('../content')

      const html = await renderMarkdown('# Title\n\n- a\n- b\n')

      expect(html).toContain('<h1>Title</h1>')
      expect(html).toContain('<li>a</li>')
      expect(html).toContain('<li>b</li>')
    })

    it('支持 GFM 表格', async () => {
      const { renderMarkdown } = require('../content')

      const md = '| a | b |\n|---|---|\n| 1 | 2 |\n'
      const html = await renderMarkdown(md)

      expect(html).toContain('<table>')
      expect(html).toContain('<th>a</th>')
      expect(html).toContain('<td>1</td>')
    })
  })

  describe('getSearchIndex', () => {
    it('从已发布 issue 中提取 excerpt(去除 markdown 标记)', () => {
      const e1 = buildIssue(
        '001',
        {
          issue: 1,
          title: '创刊号',
          date: '2026-04-08',
          published: true,
        },
        '## 标题\n\n这是[链接](http://example.com)的内容,用于测试摘要生成。'
      )
      fsMock.__setFs(snapshotFrom([['001/README.md', e1]]))
      const { getSearchIndex } = require('../content')

      const index = getSearchIndex()

      expect(index).toHaveLength(1)
      expect(index[0].title).toBe('创刊号')
      expect(index[0].slug).toBe('001')
      expect(index[0].excerpt).toContain('这是链接的内容')
      expect(index[0].excerpt.endsWith('...')).toBe(true)
    })
  })

  describe('categories 常量', () => {
    it('包含 9 个分类且 id 唯一', () => {
      const { categories } = require('../content')

      expect(categories).toHaveLength(9)
      const ids = categories.map((c: { id: string }) => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('每个分类都有 id、name、icon 字段', () => {
      const { categories } = require('../content')

      for (const c of categories) {
        expect(c).toHaveProperty('id')
        expect(c).toHaveProperty('name')
        expect(c).toHaveProperty('icon')
      }
    })
  })
})
