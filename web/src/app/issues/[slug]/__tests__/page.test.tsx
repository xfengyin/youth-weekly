/**
 * issues/[slug]/page.tsx 单元测试
 *
 * 覆盖以下场景:
 * 1. generateStaticParams:基于已发布 issue 返回 slug 列表
 * 2. generateMetadata:title 拼接、description、openGraph
 * 3. generateMetadata:找不到 issue 时返回降级 title
 * 4. Page:正常 slug 渲染标题、日期、期号、frontmatter 字段
 * 5. Page:非法 slug 调用 notFound()
 * 6. Page:frontmatter 解析(空 description 时不渲染描述段落)
 *
 * 策略:
 * - mock ../lib/content,以可控的 issue 列表驱动被测页面
 * - mock next/navigation 的 notFound,使其成为可观察的 jest.fn()
 */

import path from 'path'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

// 注入 fs mock(在测试文件顶部,与 content.test.ts 类似)
type FsSnapshot = Record<string, string>

const ORIGINAL_CWD = process.cwd()
const DOCS_ISSUES_DIR = path.join(ORIGINAL_CWD, '..', 'docs', 'issues')

jest.mock('fs', () => {
  let snapshot: FsSnapshot = {}
  const existsSync = (p: string): boolean => {
    const normalized = p.replace(/\\/g, '/').replace(/\/+$/g, '')
    return Object.prototype.hasOwnProperty.call(snapshot, normalized)
  }
  const readFileSync = (p: string, _enc: string): string => {
    const normalized = p.replace(/\\/g, '/').replace(/\/+$/g, '')
    if (!snapshot[normalized]) {
      const err: NodeJS.ErrnoException = new Error(
        `ENOENT: no such file '${normalized}'`
      )
      err.code = 'ENOENT'
      throw err
    }
    return snapshot[normalized]
  }
  const readdirSync = (p: string): string[] => {
    const normalized = p.replace(/\\/g, '/').replace(/\/+$/g, '')
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
  return {
    __esModule: false,
    existsSync,
    readFileSync,
    readdirSync,
    __setFs: (next: FsSnapshot) => {
      snapshot = next
    },
  }
})

const fsMock = jest.requireMock('fs') as {
  __setFs: (snapshot: FsSnapshot) => void
}

const notFoundMock = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

const buildIssue = (
  slug: string,
  frontmatter: Record<string, unknown>,
  body = '正文内容'
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
  const map: FsSnapshot = {}
  for (const [rel, content] of entries) {
    map[rel.replace(/\\/g, '/').replace(/^\/+/, '')] = content
  }
  return map
}

describe('issues/[slug]/page.tsx', () => {
  beforeEach(() => {
    notFoundMock.mockClear()
    jest.resetModules()
  })

  describe('generateStaticParams', () => {
    it('基于已发布 issue 返回 slug 列表', async () => {
      // Arrange
      const e1 = buildIssue(
        '001',
        { issue: 1, title: '创刊号', date: '2026-04-08', published: true },
        'A'
      )
      const e2 = buildIssue(
        '002',
        { issue: 2, title: '第2期', date: '2026-04-15', published: false },
        'B'
      )
      const e3 = buildIssue(
        '003',
        { issue: 3, title: '第3期', date: '2026-04-22', published: true },
        'C'
      )
      fsMock.__setFs(
        snapshotFrom([
          ['001/README.md', e1],
          ['002/README.md', e2],
          ['003/README.md', e3],
        ])
      )

      // Act
      const { generateStaticParams } = await import('../page')
      const params = await generateStaticParams()

      // Assert:应只包含已发布的 001/003
      const slugs = params.map((p: { slug: string }) => p.slug).sort()
      expect(slugs).toEqual(['001', '003'])
    })

    it('没有 issue 时返回空数组', async () => {
      fsMock.__setFs(snapshotFrom([]))
      const { generateStaticParams } = await import('../page')
      const params = await generateStaticParams()
      expect(params).toEqual([])
    })
  })

  describe('generateMetadata', () => {
    it('找到 issue 时返回 title + description + openGraph', async () => {
      const e1 = buildIssue(
        '001',
        {
          issue: 1,
          title: '青年周刊 · 创刊号',
          date: '2026-04-08',
          published: true,
          description: '创刊号描述',
        },
        'A'
      )
      fsMock.__setFs(snapshotFrom([['001/README.md', e1]]))

      const { generateMetadata } = await import('../page')
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: '001' }),
      })

      expect(meta.title).toBe('青年周刊 · 创刊号 - 青年周刊')
      expect((meta as { description?: string }).description).toBe('创刊号描述')
      const og = (meta as { openGraph?: Record<string, unknown> }).openGraph
      expect(og).toMatchObject({
        title: '青年周刊 · 创刊号',
        description: '创刊号描述',
        type: 'article',
        publishedTime: '2026-04-08',
      })
    })

    it('找不到 issue 时返回降级 title', async () => {
      fsMock.__setFs(snapshotFrom([]))

      const { generateMetadata } = await import('../page')
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: '999' }),
      })

      expect(meta.title).toBe('周刊未找到')
    })

    it('非法 slug 返回降级 title', async () => {
      fsMock.__setFs(snapshotFrom([]))
      const { generateMetadata } = await import('../page')
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: '../etc/passwd' }),
      })
      expect(meta.title).toBe('周刊未找到')
    })
  })

  describe('Page 组件', () => {
    it('渲染标题、日期、期号徽章、frontmatter 字段', async () => {
      // Arrange
      const e1 = buildIssue(
        '001',
        {
          issue: 1,
          title: '青年周刊 · 创刊号',
          date: '2026-04-08',
          published: true,
          description: '欢迎来到青年周刊',
        },
        '# 创刊号\n\n这是正文。'
      )
      fsMock.__setFs(snapshotFrom([['001/README.md', e1]]))

      const IssuePage = (await import('../page')).default

      // Act
      const element = await IssuePage({
        params: Promise.resolve({ slug: '001' }),
      })
      render(element as React.ReactElement)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('青年周刊 · 创刊号')).toBeInTheDocument()
      })
      expect(screen.getByText('2026-04-08')).toBeInTheDocument()
      expect(screen.getByText('第1期')).toBeInTheDocument()
      expect(screen.getByText('欢迎来到青年周刊')).toBeInTheDocument()
    })

    it('frontmatter 缺 description 时不渲染描述段落', async () => {
      const e2 = buildIssue(
        '002',
        {
          issue: 2,
          title: '第2期',
          date: '2026-04-15',
          published: true,
        },
        '正文'
      )
      fsMock.__setFs(snapshotFrom([['002/README.md', e2]]))

      const IssuePage = (await import('../page')).default
      const element = await IssuePage({
        params: Promise.resolve({ slug: '002' }),
      })
      render(element as React.ReactElement)

      await waitFor(() => {
        expect(screen.getByText('第2期')).toBeInTheDocument()
      })
      // 描述段落(以 text-lg 区分)不应该存在
      expect(
        screen.queryByText('欢迎来到青年周刊')
      ).not.toBeInTheDocument()
    })

    it('非法 slug 调用 notFound()', async () => {
      // Arrange
      fsMock.__setFs(snapshotFrom([]))
      const IssuePage = (await import('../page')).default

      // Act
      const element = await IssuePage({
        params: Promise.resolve({ slug: '../etc/passwd' }),
      })
      render(element as React.ReactElement)

      // Assert
      await waitFor(() => {
        expect(notFoundMock).toHaveBeenCalled()
      })
    })

    it('合法但文件不存在的 slug 调用 notFound()', async () => {
      fsMock.__setFs(snapshotFrom([]))
      const IssuePage = (await import('../page')).default
      const element = await IssuePage({
        params: Promise.resolve({ slug: '999' }),
      })
      render(element as React.ReactElement)
      await waitFor(() => {
        expect(notFoundMock).toHaveBeenCalled()
      })
    })

    it('渲染返回周刊列表与订阅的导航链接', async () => {
      const e1 = buildIssue(
        '001',
        {
          issue: 1,
          title: '创刊号',
          date: '2026-04-08',
          published: true,
        },
        '正文'
      )
      fsMock.__setFs(snapshotFrom([['001/README.md', e1]]))

      const IssuePage = (await import('../page')).default
      const element = await IssuePage({
        params: Promise.resolve({ slug: '001' }),
      })
      render(element as React.ReactElement)

      await waitFor(() => {
        expect(screen.getByText('返回周刊列表')).toBeInTheDocument()
      })
      // "← 查看所有周刊" 与 "订阅周刊 →"
      expect(screen.getByText(/查看所有周刊/)).toBeInTheDocument()
      expect(screen.getByText(/订阅周刊/)).toBeInTheDocument()
    })
  })
})
