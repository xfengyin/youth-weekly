import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getAllIssues, getIssueBySlug, type Issue } from '../../lib/content'
import { extractToc, readingTimeMinutes, coverUrl } from '../../lib/toc'
import { parseMagazine, type MagazineArticle, type MagazineSection } from '../../lib/magazine'
import IssueCover from '../../components/IssueCover'
import CopyLinkButton from '../../components/CopyLinkButton'
import BackToTop from '../../components/BackToTop'
import ReadingProgress from './ReadingProgress'

/**
 * 杂志化阅读页（参考《周刊少年Jump》《知音漫客》《看天下》版式）：
 * - 封面：刊头（masthead）+ 期号/日期/定价条 + 封面图 + 封面故事 + 本期看点
 * - 目次：点线引导的 CONTENTS 目录
 * - 栏目：大号栏目序号 + 英文栏目名 + 栏目色带 + 文章卡片网格
 * - 刊首语：首字下沉的社论版式
 * - 兼容：无法解析成栏目的内容自动回退为纯 Markdown 渲染
 *
 * Markdown 渲染安全基线不变：
 * 1. 默认不执行 dangerouslySetInnerHTML（react-markdown 转义），消除 XSS 注入面。
 * 2. 外链自动 target="_blank" rel="noopener noreferrer"。
 * 3. 正文 h1 降级为 h2，避免与页面级 h1 并存。
 */

interface MarkdownRendererProps {
  content: string
  headingIds: Map<number, string>
}

function MarkdownRenderer({ content, headingIds }: MarkdownRendererProps) {
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

/** 文章正文：轻量 Markdown（仅段落/加粗/链接/列表/引用），统一外链安全行为 */
function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
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
      {markdown}
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

/** 文章卡片 */
function ArticleCard({
  article,
  accent,
}: {
  article: MagazineArticle
  accent: string
}) {
  return (
    <article className="group relative flex flex-col bg-white dark:bg-[#1b1a18] border border-black/10 dark:border-white/10 p-5 md:p-6 shadow-[4px_4px_0_rgba(0,0,0,0.06)] dark:shadow-[4px_4px_0_rgba(255,255,255,0.04)] transition-transform duration-200 hover:-translate-y-0.5">
      <span className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: accent }} aria-hidden="true" />
      {article.title && (
        <h3 className="text-lg md:text-xl font-bold leading-snug text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-3">
          {article.title}
        </h3>
      )}
      {article.body && (
        <div className="mag-article-body prose-mag text-[15px] leading-[1.85] text-[#3f3b37] dark:text-[#c9c4bd]">
          <ArticleBody markdown={article.body} />
        </div>
      )}
      {(article.source || article.url) && (
        <footer className="mt-auto pt-4 flex items-center justify-between gap-3">
          <span className="text-[11px] tracking-wide uppercase font-semibold text-[#8d8781] dark:text-[#8d8781]">
            {article.source ? `via ${article.source}` : ''}
          </span>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[13px] font-bold whitespace-nowrap transition-opacity hover:opacity-70"
              style={{ color: accent }}
            >
              阅读原文 →
            </a>
          )}
        </footer>
      )}
    </article>
  )
}

/** 空栏目占位（保留杂志栏目完整性） */
function EmptySection({ accent }: { accent: string }) {
  return (
    <div className="border-2 border-dashed border-black/15 dark:border-white/15 px-6 py-10 text-center">
      <p className="text-sm text-[#8d8781]">本期该栏目暂无精选内容</p>
      <a
        href="https://github.com/xfengyin/youth-weekly/issues"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm font-bold hover:underline"
        style={{ color: accent }}
      >
        欢迎投稿推荐 →
      </a>
    </div>
  )
}

/** 单个栏目的杂志版块 */
function MagazineSectionBlock({
  section,
  index,
}: {
  section: MagazineSection
  index: number
}) {
  const accent = section.color
  return (
    <section
      id={`section-${index + 1}`}
      className="scroll-mt-24 border-t-2 border-black/85 dark:border-white/80"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        {/* 栏目标题：大号序号 + 英文栏目名 + 中文栏目名 + 导语 */}
        <header className="mb-8 flex items-start gap-4 md:gap-6">
          <div
            className="font-black leading-[0.8] tracking-tighter tabular-nums select-none text-[56px] md:text-[72px]"
            style={{ color: accent }}
            aria-hidden="true"
          >
            {String(index + 1).padStart(2, '0')}
          </div>
          <div className="pt-1 min-w-0">
            <div
              className="text-[11px] font-black uppercase tracking-[0.28em]"
              style={{ color: accent }}
            >
              {section.en}
            </div>
            <h2 className="mt-0.5 text-2xl md:text-4xl font-black tracking-tight text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
              {section.name}
            </h2>
            {section.tagline && (
              <p className="mt-2 text-sm md:text-[15px] text-[#615d59] dark:text-[#a39e98]">
                {section.tagline}
              </p>
            )}
          </div>
        </header>

        {section.editorial ? (
          <div className="max-w-3xl">
            {section.articles.map((article, i) => (
              <div
                key={i}
                className="mag-dropcap prose-mag text-[17px] md:text-lg leading-[1.95] text-[#3f3b37] dark:text-[#c9c4bd]"
              >
                <ArticleBody markdown={article.body} />
              </div>
            ))}
          </div>
        ) : section.articles.length > 0 ? (
          <div className="grid gap-5 md:gap-6 md:grid-cols-2">
            {section.articles.map((article, i) => (
              <ArticleCard key={i} article={article} accent={accent} />
            ))}
          </div>
        ) : (
          <EmptySection accent={accent} />
        )}
      </div>
    </section>
  )
}

export default async function IssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const issue = getIssueBySlug(slug)

  if (!issue) {
    notFound()
  }

  const content = issue.content || ''
  const magazine = parseMagazine(content)
  const hasMagazine = magazine.sections.length > 0

  const toc = extractToc(content)
  const headingIds = new Map(toc.map((item) => [item.line, item.id]))
  const minutes = readingTimeMinutes(content)
  const cover = coverUrl(issue.slug)

  const issues = getAllIssues()
  const index = issues.findIndex((i) => i.slug === issue.slug)
  const newer: Issue | undefined = index > 0 ? issues[index - 1] : undefined
  const older: Issue | undefined = index >= 0 ? issues[index + 1] : undefined

  // 本期看点：取前 4 个栏目名
  const highlights = magazine.sections
    .filter((s) => !s.editorial)
    .slice(0, 4)
    .map((s) => s.name)

  return (
    <div className="min-h-screen bg-[#faf7f0] dark:bg-[#121110]">
      <ReadingProgress />

      <div className="mag-paper pb-20">
        {/* ── 返回列表 ── */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6">
          <Link
            href="/issues/"
            className="inline-flex items-center text-[13px] font-bold tracking-wide text-[#615d59] dark:text-[#a39e98] hover:text-[#e60012] dark:hover:text-[#ff5a5f] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回周刊列表
          </Link>
        </div>

        {/* ── 封面 ── */}
        <header className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 pb-10">
          {/* 顶部信息条 */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-y-2 border-black dark:border-white py-2 text-[11px] md:text-xs font-bold uppercase tracking-[0.18em] text-[rgba(0,0,0,0.8)] dark:text-[rgba(255,255,255,0.8)]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {issue.date}
            </span>
            <span className="hidden sm:inline">每周一更新</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              约 {minutes} 分钟
            </span>
            <span className="text-[#e60012] dark:text-[#ff5a5f]">定价：免费</span>
          </div>

          {/* 刊头 masthead */}
          <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="mag-masthead text-5xl sm:text-6xl md:text-7xl leading-[0.95] text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                青年周刊
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="h-1.5 w-14 bg-[#e60012]" aria-hidden="true" />
                <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.42em] text-[#615d59] dark:text-[#a39e98]">
                  Youth Weekly
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge !text-[13px]">第{issue.issue}期</span>
              <CopyLinkButton />
            </div>
          </div>

          {/* 封面图 + 封面故事 */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8">
            <IssueCover
              src={cover}
              alt={`${issue.title} 封面`}
              className="aspect-[16/10] w-full border-2 border-black dark:border-white shadow-[6px_6px_0_rgba(0,0,0,0.85)] dark:shadow-[6px_6px_0_rgba(255,255,255,0.75)] overflow-hidden"
              imgClassName="aspect-[16/10] w-full object-cover border-2 border-black dark:border-white shadow-[6px_6px_0_rgba(0,0,0,0.85)] dark:shadow-[6px_6px_0_rgba(255,255,255,0.75)]"
            />

            <div className="flex flex-col justify-between border-2 border-black dark:border-white bg-white dark:bg-[#1b1a18] p-6 md:p-7 shadow-[6px_6px_0_rgba(0,0,0,0.85)] dark:shadow-[6px_6px_0_rgba(255,255,255,0.75)]">
              <div>
                <span className="inline-block bg-[#e60012] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white">
                  封面故事
                </span>
                <h2 className="mt-4 text-xl md:text-2xl font-black leading-snug text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                  {issue.title}
                </h2>
                {issue.description && (
                  <p className="mt-4 text-[15px] leading-[1.9] text-[#3f3b37] dark:text-[#c9c4bd]">
                    {issue.description}
                  </p>
                )}
              </div>

              {highlights.length > 0 && (
                <div className="mt-6 pt-5 border-t border-dashed border-black/25 dark:border-white/25">
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8d8781] mb-2.5">
                    本期看点
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {highlights.map((name) => (
                      <li
                        key={name}
                        className="border border-black/30 dark:border-white/30 px-2.5 py-1 text-[12px] font-bold text-[rgba(0,0,0,0.8)] dark:text-[rgba(255,255,255,0.8)]"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── 目次 ── */}
        {hasMagazine && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-12">
            <div className="flex items-end justify-between border-b-4 border-black dark:border-white pb-3 mb-6">
              <h2 className="text-3xl md:text-4xl font-black tracking-[0.18em] text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                目 次
              </h2>
              <span className="text-[11px] font-black uppercase tracking-[0.34em] text-[#8d8781]">
                Contents
              </span>
            </div>
            <ol className="grid gap-x-12 sm:grid-cols-2">
              {magazine.sections.map((section, i) => (
                <li key={`${section.name}-${i}`}>
                  <a
                    href={`#section-${i + 1}`}
                    className="group flex items-baseline gap-3 py-2.5"
                  >
                    <span
                      className="text-lg font-black tabular-nums"
                      style={{ color: section.color }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[16px] font-bold text-[rgba(0,0,0,0.92)] dark:text-[rgba(255,255,255,0.92)] group-hover:underline">
                      {section.name}
                    </span>
                    <span className="mag-leader flex-1 translate-y-[-3px]" aria-hidden="true" />
                    <span className="text-[12px] font-semibold tabular-nums text-[#a39e98]">
                      {String(i * 4 + 3).padStart(3, '0')}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ── 栏目正文 ── */}
        {hasMagazine ? (
          magazine.sections.map((section, i) => (
            <MagazineSectionBlock key={`${section.name}-${i}`} section={section} index={i} />
          ))
        ) : (
          /* 回退：无法解析成栏目时，按传统 Markdown 阅读页渲染 */
          <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
            <article className="prose-custom">
              <MarkdownRenderer content={content} headingIds={headingIds} />
            </article>
            {toc.length > 0 && (
              <details className="mt-10 border border-black/15 dark:border-white/15 bg-white dark:bg-[#1b1a18] px-5 py-4">
                <summary className="cursor-pointer font-bold">本期目录</summary>
                <nav aria-label="本期目录" className="mt-3 space-y-2">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm hover:text-[#e60012] transition-colors ${
                        item.level === 3 ? 'pl-4 text-[#615d59] dark:text-[#a39e98]' : 'font-semibold'
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </details>
            )}
          </section>
        )}

        {/* ── 卷尾：投稿 + 期次导航 ── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6">
          <div className="border-2 border-black dark:border-white bg-white dark:bg-[#1b1a18] p-6 md:p-7 shadow-[6px_6px_0_rgba(0,0,0,0.85)] dark:shadow-[6px_6px_0_rgba(255,255,255,0.75)]">
            <p className="font-black text-lg flex items-center gap-2 text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
              <Heart className="w-5 h-5 text-[#e60012]" />
              喜欢这期内容？
            </p>
            <p className="mt-2 text-[15px] text-[#3f3b37] dark:text-[#c9c4bd]">
              分享给朋友，或到{' '}
              <a
                href="https://github.com/xfengyin/youth-weekly/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#e60012] hover:underline"
              >
                GitHub Issues
              </a>{' '}
              提交反馈和投稿。
            </p>
          </div>

          <nav aria-label="期次导航" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {older ? (
              <Link
                href={`/issues/${older.slug}/`}
                className="group flex flex-col gap-1.5 border-2 border-black dark:border-white bg-white dark:bg-[#1b1a18] p-5 transition-transform hover:-translate-y-0.5"
              >
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8d8781] inline-flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> 上一期
                </span>
                <span className="font-bold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] line-clamp-2 group-hover:text-[#e60012] transition-colors">
                  {older.title}
                </span>
                <span className="text-xs text-[#a39e98]">{older.date}</span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}

            {newer && (
              <Link
                href={`/issues/${newer.slug}/`}
                className="group flex flex-col items-end gap-1.5 border-2 border-black dark:border-white bg-white dark:bg-[#1b1a18] p-5 text-right transition-transform hover:-translate-y-0.5"
              >
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8d8781] inline-flex items-center gap-1">
                  下一期 <ChevronRight className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] line-clamp-2 group-hover:text-[#e60012] transition-colors">
                  {newer.title}
                </span>
                <span className="text-xs text-[#a39e98]">{newer.date}</span>
              </Link>
            )}
          </nav>

          <div className="mt-8 flex justify-between border-t border-black/15 dark:border-white/15 pt-6">
            <Link href="/issues/" className="text-sm font-bold text-[#e60012] hover:underline">
              ← 查看所有周刊
            </Link>
            <Link href="/subscribe/" className="text-sm font-bold text-[#e60012] hover:underline">
              订阅周刊 →
            </Link>
          </div>
        </section>
      </div>

      <BackToTop />
    </div>
  )
}
