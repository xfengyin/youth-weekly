import { type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { type Issue } from '../lib/content'
import IssueCover from './IssueCover'
import CopyLinkButton from './CopyLinkButton'
import BackToTop from './BackToTop'
import ReadingProgress from '../issues/[slug]/ReadingProgress'

/** 页面壳：返回列表 / 封面刊头 / 卷尾导航 */
interface IssueShellProps {
  issue: Issue
  minutes: number
  cover: string
  highlights: string[]
  older?: Issue
  newer?: Issue
  children: ReactNode
}

export default function IssueShell({
  issue,
  minutes,
  cover,
  highlights,
  older,
  newer,
  children,
}: IssueShellProps) {
  return (
    <div className="min-h-screen bg-[#faf7f0] dark:bg-[#121110]">
      <ReadingProgress />

      <div className="mag-paper pb-20">
        {/* ── 返回列表 ── */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6">
          <Link
            href="/issues/"
            className="inline-flex items-center text-[13px] font-bold tracking-wide text-[#615d59] dark:text-[#a39e98] hover:text-[#0075de] dark:hover:text-[#62aef0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回周刊列表
          </Link>
        </div>

        {/* ── 封面 ── */}
        <header className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 pb-10">
          {/* 顶部信息条 */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-y border-[var(--color-border-strong)] py-2 text-[11px] md:text-xs font-bold uppercase tracking-[0.18em] text-[rgba(0,0,0,0.8)] dark:text-[rgba(255,255,255,0.8)]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {issue.date}
            </span>
            <span className="hidden sm:inline">每周一更新</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              约 {minutes} 分钟
            </span>
            <span className="text-[#0075de] dark:text-[#62aef0]">定价：免费</span>
          </div>

          {/* 刊头 masthead */}
          <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="mag-masthead text-5xl sm:text-6xl md:text-7xl leading-[0.95] text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                青年周刊
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="h-1.5 w-14 bg-[#0075de]" aria-hidden="true" />
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
              className="aspect-[16/10] w-full rounded-notion-lg border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden"
              imgClassName="aspect-[16/10] w-full object-cover rounded-notion-lg"
            />

            <div className="flex flex-col justify-between border border-[var(--color-border)] bg-white dark:bg-[#1b1a18] p-6 md:p-7 shadow-[var(--shadow-card)]">
              <div>
                <span className="inline-block bg-[#0075de] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white">
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
                <div className="mt-6 pt-5 border-t border-dashed border-[var(--color-border)]">
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8d8781] mb-2.5">
                    本期看点
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {highlights.map((name) => (
                      <li
                        key={name}
                        className="border border-[var(--color-border-strong)] px-2.5 py-1 text-[12px] font-bold text-[rgba(0,0,0,0.8)] dark:text-[rgba(255,255,255,0.8)]"
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

        {children}

        {/* ── 卷尾：投稿 + 期次导航 ── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6">
          <div className="border border-[var(--color-border)] bg-white dark:bg-[#1b1a18] p-6 md:p-7 shadow-[var(--shadow-card)]">
            <p className="font-black text-lg flex items-center gap-2 text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
              <Heart className="w-5 h-5 text-[#0075de]" />
              喜欢这期内容？
            </p>
            <p className="mt-2 text-[15px] text-[#3f3b37] dark:text-[#c9c4bd]">
              分享给朋友，或到{' '}
              <a
                href="https://github.com/xfengyin/youth-weekly/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#0075de] hover:underline"
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
                className="group flex flex-col gap-1.5 border border-[var(--color-border)] bg-white dark:bg-[#1b1a18] p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
              >
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8d8781] inline-flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> 上一期
                </span>
                <span className="font-bold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] line-clamp-2 group-hover:text-[#0075de] transition-colors">
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
                className="group flex flex-col items-end gap-1.5 border border-[var(--color-border)] bg-white dark:bg-[#1b1a18] p-5 text-right shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
              >
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8d8781] inline-flex items-center gap-1">
                  下一期 <ChevronRight className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] line-clamp-2 group-hover:text-[#0075de] transition-colors">
                  {newer.title}
                </span>
                <span className="text-xs text-[#a39e98]">{newer.date}</span>
              </Link>
            )}
          </nav>

          <div className="mt-8 flex justify-between border-t border-[var(--color-border)] pt-6">
            <Link href="/issues/" className="text-sm font-bold text-[#0075de] hover:underline">
              ← 查看所有周刊
            </Link>
            <Link href="/subscribe/" className="text-sm font-bold text-[#0075de] hover:underline">
              订阅周刊 →
            </Link>
          </div>
        </section>
      </div>

      <BackToTop />
    </div>
  )
}
