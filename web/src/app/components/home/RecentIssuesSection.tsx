import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import { type Issue } from '../../lib/content'
import { coverUrl } from '../../lib/toc'
import IssueCover from '../IssueCover'

interface RecentIssuesSectionProps {
  issues: Issue[]
  totalCount: number
}

/** 首页“往期周刊”：封面卡片网格 + 查看全部入口 */
export default function RecentIssuesSection({ issues, totalCount }: RecentIssuesSectionProps) {
  return (
    <section className="py-20 bg-[#f6f5f4] dark:bg-[#202020]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-[32px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-10 leading-tight">
          往期周刊
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map((issue) => (
            <Link
              key={issue.slug}
              href={`/issues/${issue.slug}/`}
              className="card card-hover group overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <IssueCover
                  src={coverUrl(issue.slug)}
                  alt={`${issue.title} 封面`}
                  className="absolute inset-0 w-full h-full bg-[#f6f5f4] dark:bg-[#202020]"
                  imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <span className="absolute top-3 left-3 badge !bg-white/90 dark:!bg-black/60 !text-[#0075de] dark:!text-[#62aef0]">
                  第{issue.issue}期
                </span>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-sm text-[#615d59] dark:text-[#a39e98] mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>{issue.date}</span>
                </div>
                <h3 className="text-lg font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-3 leading-snug group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors line-clamp-2">
                  {issue.title}
                </h3>
                <p className="text-sm text-[#615d59] dark:text-[#a39e98] line-clamp-2 leading-relaxed flex-1">
                  {issue.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-[#0075de] dark:text-[#62aef0] text-sm font-semibold">
                  阅读本期
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {totalCount > 5 && (
          <div className="mt-10 text-center">
            <Link
              href="/issues/"
              className="btn-secondary inline-flex items-center text-[15px] font-semibold"
            >
              <span>查看全部 {totalCount} 期</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
