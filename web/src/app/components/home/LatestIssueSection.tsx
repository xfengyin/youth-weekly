import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import { type Issue } from '../../lib/content'

/** 首页“本期导读”：最新一期的标题与摘要 */
export default function LatestIssueSection({ issue }: { issue: Issue }) {
  return (
    <section className="py-20 bg-white dark:bg-[#191919]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl md:text-[32px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] leading-tight">
            本期导读
          </h2>
          <Link
            href={`/issues/${issue.slug}/`}
            className="text-[#0075de] dark:text-[#62aef0] hover:text-[#005bab] dark:hover:text-[#62aef0] font-semibold text-[15px] inline-flex items-center"
          >
            阅读全文
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="card card-hover p-8 md:p-10">
          <div className="flex items-center gap-3 text-sm text-[#615d59] dark:text-[#a39e98] mb-5">
            <Calendar className="w-4 h-4" />
            <span>{issue.date}</span>
            <span>·</span>
            <span>第{issue.issue}期</span>
          </div>

          <h3 className="text-2xl md:text-[28px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-5 leading-snug">
            {issue.title}
          </h3>

          <p className="text-[#615d59] dark:text-[#a39e98] leading-relaxed mb-7">
            {issue.description}
          </p>

          <Link
            href={`/issues/${issue.slug}/`}
            className="inline-flex items-center gap-1.5 text-[#0075de] dark:text-[#62aef0] font-semibold text-[15px]"
          >
            开始阅读本期
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
