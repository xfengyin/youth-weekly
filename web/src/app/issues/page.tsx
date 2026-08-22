import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Calendar, BookOpen, ArrowRight } from 'lucide-react'
import { getAllIssues } from '../lib/content'
import { coverUrl } from '../lib/toc'
import IssueCover from '../components/IssueCover'

export const metadata: Metadata = {
  title: '所有周刊',
  description: '浏览青年周刊全部已发布期次，每周更新，涵盖科技、二次元、游戏、成长等领域。',
  alternates: { canonical: 'issues/' },
}

export default function IssuesPage() {
  const issues = getAllIssues()
  const [latest, ...rest] = issues

  return (
    <div className="min-h-screen bg-[#f6f5f4] dark:bg-[#202020] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center text-[#615d59] dark:text-[#a39e98] hover:text-[#0075de] dark:hover:text-[#62aef0] font-semibold text-[15px] mb-5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回首页
          </Link>
          <h1 className="text-3xl md:text-[40px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] leading-tight">
            所有周刊
          </h1>
          <p className="mt-3 text-[#615d59] dark:text-[#a39e98]">
            共 {issues.length} 期内容，每周更新
          </p>
        </div>

        {/* 最新一期：Feature 大卡片 */}
        {latest && (
          <Link
            href={`/issues/${latest.slug}/`}
            className="group card card-hover block overflow-hidden mb-10"
          >
            <div className="grid md:grid-cols-2">
              <div className="relative aspect-[16/10] md:aspect-auto md:h-full overflow-hidden">
                <IssueCover
                  src={coverUrl(latest.slug)}
                  alt={`${latest.title} 封面`}
                  className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#0075de] via-[#2a9d99] to-[#8b5cf6]"
                  imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute top-4 left-4 badge !bg-[#0075de] !text-white !text-[13px]">
                  最新一期
                </span>
              </div>
              <div className="p-7 md:p-9 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-sm text-[#615d59] dark:text-[#a39e98] mb-4">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {latest.date}
                  </span>
                  <span>·</span>
                  <span className="badge !text-[12px]">第{latest.issue}期</span>
                </div>
                <h2 className="text-2xl md:text-[28px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-4 leading-snug group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors">
                  {latest.title}
                </h2>
                {latest.description && (
                  <p className="text-[#615d59] dark:text-[#a39e98] leading-relaxed mb-6 line-clamp-3">
                    {latest.description}
                  </p>
                )}
                <span className="inline-flex items-center gap-1.5 text-[#0075de] dark:text-[#62aef0] font-semibold text-[15px]">
                  阅读本期
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* 其余期次：网格卡片 */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((issue) => (
              <Link
                key={issue.slug}
                href={`/issues/${issue.slug}/`}
                className="card card-hover group overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <IssueCover
                    src={coverUrl(issue.slug)}
                    alt={`${issue.title} 封面`}
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#0075de] via-[#2a9d99] to-[#8b5cf6]"
                    imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute top-3 left-3 badge !bg-white/90 dark:!bg-black/60 !text-[#0075de] dark:!text-[#62aef0]">
                    第{issue.issue}期
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center text-sm text-[#615d59] dark:text-[#a39e98] mb-3">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    {issue.date}
                  </div>
                  <h3 className="text-lg font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-2 leading-snug group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors line-clamp-2">
                    {issue.title}
                  </h3>
                  <p className="text-sm text-[#615d59] dark:text-[#a39e98] line-clamp-3 leading-relaxed flex-1">
                    {issue.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[#0075de] dark:text-[#62aef0] text-sm font-semibold">
                    <BookOpen className="w-4 h-4" />
                    阅读全文
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {issues.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-[#a39e98] dark:text-[#615d59] mx-auto mb-5" />
            <p className="text-[#615d59] dark:text-[#a39e98]">
              暂无周刊内容，敬请期待...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
