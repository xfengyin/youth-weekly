import Link from 'next/link'
import { ArrowLeft, Calendar, Archive } from 'lucide-react'
import { getAllIssues } from '../lib/content'

export default function ArchivePage() {
  const issues = getAllIssues()

  // 按年份分组
  const groupedByYear = issues.reduce(
    (acc, issue) => {
      const year = issue.date ? issue.date.split('-')[0] : 'Unknown'
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(issue)
      return acc
    },
    {} as Record<string, typeof issues>
  )

  const sortedYears = Object.keys(groupedByYear).sort((a, b) =>
    b.localeCompare(a)
  )

  return (
    <div className="min-h-screen bg-[#f6f5f4] dark:bg-[#202020] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
            文章归档
          </h1>
          <p className="mt-3 text-[#615d59] dark:text-[#a39e98]">
            共 {issues.length} 期周刊
          </p>
        </div>

        {/* Archive by Year */}
        <div className="space-y-10">
          {sortedYears.map((year) => (
            <div key={year}>
              <h2 className="text-2xl font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-5 flex items-center leading-tight">
                <Archive className="w-5 h-5 mr-2.5 text-[#a39e98] dark:text-[#615d59]" />
                {year}年
                <span className="ml-2 text-sm font-normal text-[#a39e98] dark:text-[#615d59]">
                  ({groupedByYear[year].length}期)
                </span>
              </h2>

              <div className="space-y-3">
                {groupedByYear[year].map((issue) => (
                  <Link
                    key={issue.slug}
                    href={`/issues/${issue.slug}/`}
                    className="card p-5 flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-5">
                      <div className="flex items-center space-x-2 text-sm text-[#a39e98] dark:text-[#615d59] min-w-[100px]">
                        <Calendar className="w-4 h-4" />
                        <span>{issue.date}</span>
                      </div>
                      <h3 className="font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors">
                        {issue.title}
                      </h3>
                    </div>
                    <span className="text-[#a39e98] dark:text-[#615d59] group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {issues.length === 0 && (
          <div className="text-center py-20">
            <Archive className="w-14 h-14 text-[#a39e98] dark:text-[#615d59] mx-auto mb-5" />
            <p className="text-[#615d59] dark:text-[#a39e98]">
              暂无归档内容
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
