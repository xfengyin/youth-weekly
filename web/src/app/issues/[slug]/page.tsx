import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getAllIssues, getIssueBySlug, type Issue } from '../../lib/content'
import { extractToc, tocByLine, readingTimeMinutes, coverUrl } from '../../lib/toc'
import IssueCover from '../../components/IssueCover'
import CopyLinkButton from '../../components/CopyLinkButton'
import BackToTop from '../../components/BackToTop'
import ReadingProgress from './ReadingProgress'

/**
 * 现代杂志风阅读页：
 * - 封面驱动 Hero（封面大图 / 期号 / 日期 / 标题 / 简介 / 阅读时长 / 复制链接）
 * - 顶部阅读进度条（ReadingProgress，client）
 * - 侧边目录（桌面 sticky 右侧）+ 移动端可折叠目录
 * - 正文排版增强（prose-custom：标题序号条、表格、图片、引用）
 * - 上一篇 / 下一篇导航 + 返回顶部
 *
 * Markdown 渲染安全基线不变：
 * 1. 默认不执行 dangerouslySetInnerHTML（react-markdown 转义），消除 XSS 注入面。
 * 2. 外链自动 target="_blank" rel="noopener noreferrer"。
 * 3. 正文 h1 降级为 h2，避免与页面级 h1 并存。
 * 4. h2/h3 按源码行号（node.position）映射目录锚点 id。
 */

interface MarkdownRendererProps {
  content: string
  headingIds: Map<number, string>
}

function MarkdownRenderer({ content, headingIds }: MarkdownRendererProps) {
  // 按源码行号（node.position.start.line）回填目录锚点 id，
  // 与 lib/toc.ts 的 extractToc 使用同一行号来源。
  const idFor = (node: unknown) => {
    const line = (node as { position?: { start?: { line?: number } } } | undefined)
      ?.position?.start?.line
    return typeof line === 'number' ? headingIds.get(line) : undefined
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: 'h2',
        h2: ({ node, children, ...props }) => (
          <h2 {...props} id={idFor(node)}>
            {children}
          </h2>
        ),
        h3: ({ node, children, ...props }) => (
          <h3 {...props} id={idFor(node)}>
            {children}
          </h3>
        ),
        a: ({ node: _node, href, children, ...props }) => {
          const isExternal = typeof href === 'string' && /^https?:\/\//.test(href)
          return (
            <a
              href={href}
              {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              {...props}
            >
              {children}
            </a>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export async function generateStaticParams() {
  const issues = getAllIssues()
  return issues.map((issue) => ({
    slug: String(issue.slug),
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const issue = getIssueBySlug(slug)

  if (!issue) {
    return {
      title: '周刊未找到',
    }
  }

  return {
    // 标题后缀由 layout 的 title.template（%s - 青年周刊）统一追加
    title: issue.title,
    description: issue.description,
    alternates: { canonical: `issues/${issue.slug}/` },
    openGraph: {
      title: issue.title,
      description: issue.description,
      type: 'article',
      publishedTime: issue.date,
      images: [{ url: `issues/${issue.slug}/assets/cover.png`, width: 1200, height: 630, alt: issue.title }],
    },
  }
}

export default async function IssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const issue = getIssueBySlug(slug)

  if (!issue) {
    notFound()
  }

  const content = issue.content || ''
  const toc = extractToc(content)
  const headingIds = new Map(toc.map((item) => [item.line, item.id]))
  const minutes = readingTimeMinutes(content)
  const cover = coverUrl(issue.slug)

  // 相邻期导航（getAllIssues 最新在前）
  const issues = getAllIssues()
  const index = issues.findIndex((i) => i.slug === issue.slug)
  const newer: Issue | undefined = index > 0 ? issues[index - 1] : undefined
  const older: Issue | undefined = index >= 0 ? issues[index + 1] : undefined

  return (
    <div className="min-h-screen bg-white dark:bg-[#191919]">
      <ReadingProgress />

      <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* 返回列表 */}
        <Link
          href="/issues/"
          className="inline-flex items-center text-[15px] font-semibold text-[#615d59] dark:text-[#a39e98] hover:text-[#0075de] dark:hover:text-[#62aef0] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回周刊列表
        </Link>

        {/* ── Hero ── */}
        <header className="mb-12 animate-fade-in-up">
          <IssueCover
            src={cover}
            alt={`${issue.title} 封面`}
            className="aspect-[16/9] w-full rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] overflow-hidden transition-transform duration-500 hover:scale-[1.008]"
            imgClassName="aspect-[16/9] w-full object-cover rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)]"
          />

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#615d59] dark:text-[#a39e98]">
            <span className="badge !text-[13px]">第{issue.issue}期</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {issue.date}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              约 {minutes} 分钟
            </span>
            <CopyLinkButton />
          </div>

          <h1 className="mt-4 text-3xl md:text-[44px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] leading-[1.15] tracking-tight">
            {issue.title}
          </h1>

          {issue.description && (
            <p className="mt-5 text-lg text-[#615d59] dark:text-[#a39e98] leading-relaxed max-w-3xl">
              {issue.description}
            </p>
          )}
        </header>

        {/* ── 正文 + 侧边目录 ── */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12 lg:items-start">
          <div className="min-w-0">
            <article className="prose-custom">
              <MarkdownRenderer content={content} headingIds={headingIds} />
            </article>

            {/* 移动端目录（原生 details，无 JS） */}
            {toc.length > 0 && (
              <details className="lg:hidden mt-10 rounded-xl border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-[#f6f5f4] dark:bg-[#202020] px-5 py-4">
                <summary className="cursor-pointer font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                  本期目录
                </summary>
                <nav aria-label="本期目录（移动端）" className="mt-3 space-y-2">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm hover:text-[#0075de] dark:hover:text-[#62aef0] transition-colors ${
                        item.level === 3 ? 'pl-4 text-[#615d59] dark:text-[#a39e98]' : 'font-semibold'
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </details>
            )}

            {/* 喜欢/投稿 */}
            <div className="callout mt-12">
              <span className="callout-icon">💡</span>
              <div className="callout-content">
                <p className="font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-1 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-[#dd5b00]" />
                  喜欢这期内容？
                </p>
                <p>
                  分享给朋友，或到{' '}
                  <a
                    href="https://github.com/xfengyin/youth-weekly/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0075de] dark:text-[#62aef0] hover:underline"
                  >
                    GitHub Issues
                  </a>{' '}
                  提交反馈和投稿。
                </p>
              </div>
            </div>

            {/* 上一篇 / 下一篇 */}
            <nav
              aria-label="期次导航"
              className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {older ? (
                <Link
                  href={`/issues/${older.slug}/`}
                  className="group card p-5 flex flex-col gap-1.5 hover:-translate-y-0.5 transition-transform"
                >
                  <span className="text-xs text-[#615d59] dark:text-[#a39e98] inline-flex items-center gap-1">
                    <ChevronLeft className="w-3.5 h-3.5" /> 上一篇
                  </span>
                  <span className="font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] line-clamp-2 group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors">
                    {older.title}
                  </span>
                  <span className="text-xs text-[#a39e98] dark:text-[#615d59]">{older.date}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}

              {newer && (
                <Link
                  href={`/issues/${newer.slug}/`}
                  className="group card p-5 flex flex-col gap-1.5 items-end text-right hover:-translate-y-0.5 transition-transform"
                >
                  <span className="text-xs text-[#615d59] dark:text-[#a39e98] inline-flex items-center gap-1">
                    下一篇 <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] line-clamp-2 group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors">
                    {newer.title}
                  </span>
                  <span className="text-xs text-[#a39e98] dark:text-[#615d59]">{newer.date}</span>
                </Link>
              )}
            </nav>

            {/* 底部链接 */}
            <div className="mt-8 pt-8 border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] flex justify-between">
              <Link
                href="/issues/"
                className="text-[#0075de] dark:text-[#62aef0] hover:text-[#005bab] dark:hover:text-[#62aef0] font-semibold text-[15px]"
              >
                ← 查看所有周刊
              </Link>
              <Link
                href="/subscribe/"
                className="text-[#0075de] dark:text-[#62aef0] hover:text-[#005bab] dark:hover:text-[#62aef0] font-semibold text-[15px]"
              >
                订阅周刊 →
              </Link>
            </div>
          </div>

          {/* 桌面端侧边目录 */}
          {toc.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-auto pr-2 border-l border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] pl-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#615d59] dark:text-[#a39e98] mb-4">
                  本期目录
                </h2>
                <nav aria-label="本期目录" className="space-y-2.5">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm leading-snug border-l-2 -ml-5 pl-5 transition-colors hover:text-[#0075de] dark:hover:text-[#62aef0] hover:border-[#0075de] dark:hover:border-[#62aef0] border-transparent ${
                        item.level === 3
                          ? 'pl-8 text-[#615d59] dark:text-[#a39e98]'
                          : 'font-semibold text-[rgba(0,0,0,0.9)] dark:text-[rgba(255,255,255,0.9)]'
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </article>

      <BackToTop />
    </div>
  )
}
