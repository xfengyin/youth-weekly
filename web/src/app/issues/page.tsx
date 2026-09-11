import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Calendar, ArrowRight } from 'lucide-react'
import { getAllIssues } from '../lib/content'
import { coverUrl } from '../lib/toc'
import IssueCover from '../components/IssueCover'

export const metadata: Metadata = {
  title: '所有周刊',
  description: '浏览青年周刊全部已发布期次，每周更新，涵盖科技、二次元、游戏、成长等领域。',
  alternates: { canonical: 'issues/' },
}

/**
 * 往期陈列页（杂志陈列架版式）：
 * - 刊头：青年周刊 masthead + BACK ISSUES
 * - 最新一期：大封面 + 封面故事
 * - 往期：竖版杂志封面网格（硬阴影 / 期号标签 / 悬浮微动效）
 */
export default function IssuesPage() {
  const issues = getAllIssues()
  const [latest, ...rest] = issues

  return (
    <div className="min-h-screen bg-[#faf7f0] dark:bg-[#121110]">
      <div className="mag-paper py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* ── 刊头 ── */}
          <header className="mb-10">
            <Link
              href="/"
              className="mb-6 inline-flex items-center text-[13px] font-bold tracking-wide text-[#615d59] dark:text-[#a39e98] transition-colors hover:text-[#e60012] dark:hover:text-[#ff5a5f]"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回首页
            </Link>

            <div className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-black pb-4 dark:border-white">
              <div>
                <h1 className="mag-masthead text-5xl leading-none text-[rgba(0,0,0,0.95)] sm:text-6xl dark:text-[rgba(255,255,255,0.95)]">
                  青年周刊
                </h1>
                <div className="mt-2 flex items-center gap-3">
                  <span className="h-1.5 w-14 bg-[#e60012]" aria-hidden="true" />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#615d59] dark:text-[#a39e98]">
                    Back Issues
                  </span>
                </div>
              </div>
              <span className="badge !text-[13px]">共 {issues.length} 期</span>
            </div>
          </header>

          {/* ── 最新一期：大封面 ── */}
          {latest && (
            <Link
              href={`/issues/${latest.slug}/`}
              className="group mb-14 grid gap-6 border-2 border-black bg-white p-5 shadow-[8px_8px_0_rgba(0,0,0,0.85)] transition-transform duration-200 hover:-translate-y-0.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-8 md:p-7 dark:border-white dark:bg-[#1b1a18] dark:shadow-[8px_8px_0_rgba(255,255,255,0.75)]"
            >
              <div className="relative">
                <IssueCover
                  src={coverUrl(latest.slug)}
                  alt={`${latest.title} 封面`}
                  className="aspect-[3/4] w-full border-2 border-black object-cover dark:border-white"
                  imgClassName="aspect-[3/4] w-full border-2 border-black object-cover dark:border-white"
                />
                <span className="absolute left-0 top-0 bg-[#e60012] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white">
                  最新一期
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#e60012]">
                  Cover Story
                </span>
                <h2 className="mt-3 text-2xl font-black leading-snug text-[rgba(0,0,0,0.95)] transition-colors group-hover:text-[#e60012] md:text-3xl dark:text-[rgba(255,255,255,0.95)]">
                  {latest.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-[#615d59] dark:text-[#a39e98]">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {latest.date}
                  </span>
                  <span className="badge !text-[12px]">第{latest.issue}期</span>
                </div>
                {latest.description && (
                  <p className="mt-5 line-clamp-4 text-[15px] leading-[1.9] text-[#3f3b37] dark:text-[#c9c4bd]">
                    {latest.description}
                  </p>
                )}
                <span className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-black text-[#e60012]">
                  阅读本期
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          )}

          {/* ── 往期：封面网格 ── */}
          {rest.length > 0 && (
            <>
              <div className="mb-6 flex items-end justify-between border-b-2 border-black pb-2 dark:border-white">
                <h2 className="text-2xl font-black tracking-[0.16em] text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                  往期回顾
                </h2>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#8d8781]">
                  Archive
                </span>
              </div>

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {rest.map((issue) => (
                  <Link key={issue.slug} href={`/issues/${issue.slug}/`} className="group">
                    <div className="relative overflow-hidden border-2 border-black shadow-[5px_5px_0_rgba(0,0,0,0.8)] transition-transform duration-200 group-hover:-translate-y-1 dark:border-white dark:shadow-[5px_5px_0_rgba(255,255,255,0.7)]">
                      <IssueCover
                        src={coverUrl(issue.slug)}
                        alt={`${issue.title} 封面`}
                        className="aspect-[3/4] w-full object-cover"
                        imgClassName="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/75 px-2.5 py-1.5 text-[11px] font-black tracking-wide text-white">
                        第{issue.issue}期
                      </span>
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug text-[rgba(0,0,0,0.95)] transition-colors group-hover:text-[#e60012] dark:text-[rgba(255,255,255,0.95)]">
                      {issue.title}
                    </h3>
                    <p className="mt-1 text-[12px] text-[#8d8781]">{issue.date}</p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* ── 尾部 ── */}
          <div className="mt-14 flex justify-between border-t border-black/15 pt-6 dark:border-white/15">
            <Link href="/" className="text-sm font-bold text-[#e60012] hover:underline">
              ← 返回首页
            </Link>
            <Link href="/subscribe/" className="text-sm font-bold text-[#e60012] hover:underline">
              订阅周刊 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
