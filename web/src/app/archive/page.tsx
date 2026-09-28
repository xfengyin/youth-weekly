import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Archive } from 'lucide-react'
import { getAllIssues } from '../lib/content'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'

export const metadata: Metadata = {
  title: '文章归档',
  description: '按年份归档浏览青年周刊全部期次。',
  alternates: { canonical: 'archive/' },
}

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
        <PageHeader title="文章归档" description={`共 ${issues.length} 期周刊`} />

        {/* Archive by Year */}
        <div className="space-y-10">
          {sortedYears.map((year) => (
            <div key={year}>
              <h2 className="text-2xl font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-5 flex items-center leading-tight">
                <Archive className="w-5 h-5 mr-2.5 text-[#615d59] dark:text-[#a39e98]" />
                {year}年
                <span className="ml-2 text-sm font-normal text-[#615d59] dark:text-[#a39e98]">
                  ({groupedByYear[year].length}期)
                </span>
              </h2>

              <div className="space-y-3">
                {groupedByYear[year].map((issue) => (
                  <Link
                    key={issue.slug}
                    href={`/issues/${issue.slug}/`}
                    className="card card-hover p-5 flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-5">
                      <div className="flex items-center space-x-2 text-sm text-[#615d59] dark:text-[#a39e98] min-w-[100px]">
                        <Calendar className="w-4 h-4" />
                        <span>{issue.date}</span>
                      </div>
                      <h3 className="font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors">
                        {issue.title}
                      </h3>
                    </div>
                    <span className="text-[#615d59] dark:text-[#a39e98] group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors">
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
          <EmptyState icon={Archive} description="暂无归档内容" />
        )}
      </div>
    </div>
  )
}
