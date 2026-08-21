/**
 * issues/[slug]/page.tsx 单元测试
 *
 * 覆盖以下场景:
 * 1. generateStaticParams:基于 issue_index.json 返回 slug 列表
 * 2. generateMetadata:title(模板拼接)、description、openGraph、canonical
 * 3. generateMetadata:找不到 issue 时返回降级 title
 * 4. Page:正常 slug 渲染标题、日期、期号、正文内容
 * 5. Page:非法 slug 调用 notFound()
 * 6. Page:合法但产物缺失的 slug 调用 notFound()
 *
 * 策略:
 * - mock fs:注入 <cwd>/public/issue_index.json 与 issue-<slug>.json
 * - mock next/navigation 的 notFound,使其成为可观察的 jest.fn()
 */

import path from 'path'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

type FsSnapshot = Record<string, string>

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const norm = (p: string): string => p.replace(/\\/g, '/').replace(/\/+$/g, '')

jest.mock('fs', () => {
  let snapshot: FsSnapshot = {}
  const existsSync = (p: string): boolean => {
    const k = norm(p)
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

// react-markdown v9 为纯 ESM，ts-jest(commonjs) 无法直接 require；
// 此处以轻量桩替代：页面测试关注数据/渲染逻辑，不测试 markdown 解析本身。
jest.mock('react-markdown', () => {
  const React = require('react')
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'markdown' }, children),
  }
})

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => () => {},
}))

const notFoundMock = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

const json = (obj: unknown): string => JSON.stringify(obj)

const publicFile = (rel: string): string => norm(path.join(PUBLIC_DIR, rel))

/** 构造一期完整 issue-<slug>.json 数据 */
const buildIssue = (
  slug: string,
  data: Record<string, unknown>,
): Record<string, unknown> => ({
  issue: Number(slug),
  title: `第${Number(slug)}期`,
  date: '2026-04-08',
  published: true,
  description: undefined,
  content: '# 正文\n',
  slug,
  ...data,
})

const setPublicFiles = (files: Record<string, unknown>): void => {
  const snapshot: FsSnapshot = {}
  for (const [rel, data] of Object.entries(files)) {
    snapshot[publicFile(rel)] = typeof data === 'string' ? data : json(data)
  }
  fsMock.__setFs(snapshot)
}

describe('issues/[slug]/page.tsx', () => {
  beforeEach(() => {
    notFoundMock.mockClear()
    jest.resetModules()
    // resetModules 后重新获取 fs mock
    fsMock = jest.requireMock('fs') as { __setFs: (snapshot: FsSnapshot) => void }
  })

  describe('generateStaticParams', () => {
    it('基于 issue_index.json 返回 slug 列表', async () => {
      setPublicFiles({
        'issue_index.json': [
          { issue: 1, title: '创刊号', date: '2026-04-08', slug: '001' },
          { issue: 3, title: '第3期', date: '2026-04-22', slug: '003' },
        ],
      })

      const { generateStaticParams } = await import('../page')
      const params = await generateStaticParams()

      const slugs = params.map((p: { slug: string }) => p.slug).sort()
      expect(slugs).toEqual(['001', '003'])
    })

    it('没有 issue 时返回空数组', async () => {
      setPublicFiles({ 'issue_index.json': [] })
      const { generateStaticParams } = await import('../page')
      const params = await generateStaticParams()
      expect(params).toEqual([])
    })
  })

  describe('generateMetadata', () => {
    it('找到 issue 时返回 title + description + openGraph + canonical', async () => {
      setPublicFiles({
        'issue-001.json': buildIssue('001', {
          title: '青年周刊 · 创刊号',
          date: '2026-04-08',
          description: '创刊号描述',
          content: '# 创刊号\n',
        }),
      })

      const { generateMetadata } = await import('../page')
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: '001' }),
      })

      // title 由 layout 模板（%s - 青年周刊）统一追加后缀
      expect(meta.title).toBe('青年周刊 · 创刊号')
      expect((meta as { description?: string }).description).toBe('创刊号描述')
      const alt = (meta as { alternates?: { canonical?: string } }).alternates
      expect(alt?.canonical).toBe('issues/001/')
      const og = (meta as { openGraph?: Record<string, unknown> }).openGraph
      expect(og).toMatchObject({
        title: '青年周刊 · 创刊号',
        description: '创刊号描述',
        type: 'article',
        publishedTime: '2026-04-08',
      })
    })

    it('找不到 issue 时返回降级 title', async () => {
      setPublicFiles({})
      const { generateMetadata } = await import('../page')
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: '999' }),
      })
      expect(meta.title).toBe('周刊未找到')
    })

    it('非法 slug 返回降级 title', async () => {
      setPublicFiles({})
      const { generateMetadata } = await import('../page')
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: '../etc/passwd' }),
      })
      expect(meta.title).toBe('周刊未找到')
    })
  })

  describe('Page 组件', () => {
    it('渲染标题、日期、期号徽章、frontmatter 字段', async () => {
      setPublicFiles({
        'issue-001.json': buildIssue('001', {
          title: '青年周刊 · 创刊号',
          date: '2026-04-08',
          description: '欢迎来到青年周刊',
          content: '# 创刊号\n\n这是正文。',
        }),
      })

      const IssuePage = (await import('../page')).default
      const element = await IssuePage({
        params: Promise.resolve({ slug: '001' }),
      })
      render(element as React.ReactElement)

      await waitFor(() => {
        expect(screen.getByText('青年周刊 · 创刊号')).toBeInTheDocument()
      })
      expect(screen.getByText('2026-04-08')).toBeInTheDocument()
      expect(screen.getByText('第1期')).toBeInTheDocument()
      expect(screen.getByText('欢迎来到青年周刊')).toBeInTheDocument()
    })

    it('frontmatter 缺 description 时不渲染描述段落', async () => {
      setPublicFiles({
        'issue-002.json': buildIssue('002', { title: '第2期', date: '2026-04-15' }),
      })

      const IssuePage = (await import('../page')).default
      const element = await IssuePage({
        params: Promise.resolve({ slug: '002' }),
      })
      render(element as React.ReactElement)

      await waitFor(() => {
        // '第2期' 同时出现在期号徽章与 h1 标题中
        expect(screen.getAllByText('第2期').length).toBeGreaterThan(0)
      })
      expect(screen.queryByText('欢迎来到青年周刊')).not.toBeInTheDocument()
    })

    it('非法 slug 调用 notFound()', async () => {
      setPublicFiles({})
      const IssuePage = (await import('../page')).default

      // 真实 notFound() 会抛出特殊错误终止渲染；mock 保持相同语义
      await expect(
        IssuePage({ params: Promise.resolve({ slug: '../etc/passwd' }) })
      ).rejects.toThrow()
      expect(notFoundMock).toHaveBeenCalled()
    })

    it('合法但产物缺失的 slug 调用 notFound()', async () => {
      setPublicFiles({})
      const IssuePage = (await import('../page')).default

      await expect(
        IssuePage({ params: Promise.resolve({ slug: '999' }) })
      ).rejects.toThrow()
      expect(notFoundMock).toHaveBeenCalled()
    })

    it('渲染返回周刊列表与订阅的导航链接', async () => {
      setPublicFiles({
        'issue-001.json': buildIssue('001', { title: '创刊号' }),
      })

      const IssuePage = (await import('../page')).default
      const element = await IssuePage({
        params: Promise.resolve({ slug: '001' }),
      })
      render(element as React.ReactElement)

      await waitFor(() => {
        expect(screen.getByText('返回周刊列表')).toBeInTheDocument()
      })
      expect(screen.getByText(/查看所有周刊/)).toBeInTheDocument()
      expect(screen.getByText(/订阅周刊/)).toBeInTheDocument()
    })
  })
})
