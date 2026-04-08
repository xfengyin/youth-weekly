import Link from 'next/link'
import { ArrowLeft, Calendar, Archive } from 'lucide-react'
import { getAllIssues } from '../lib/content'

export default function ArchivePage() {
  const issues = getAllIssues()
  
  // 按年份分组
  const groupedByYear = issues.reduce((acc, issue) => {
    const year = issue.date ? issue.date.split('-')[0] : 'Unknown'
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(issue)
    return acc
  }, {} as Record<string, typeof issues>)

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            文章归档
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            共 {issues.length} 期周刊
          </p>
        </div>

        {/* Archive by Year */}
        <div className="space-y-8">
          {sortedYears.map((year) => (
            <div key={year}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Archive className="w-6 h-6 mr-2" />
                {year}年
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({groupedByYear[year].length}期)
                </span>
              </h2>
              
              <div className="space-y-2">
                {groupedByYear[year].map((issue) => (
                  <Link
                    key={issue.slug}
                    href={`/issues/${issue.slug}/`}
                    className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 min-w-[100px]">
                        <Calendar className="w-4 h-4" />
                        <span>{issue.date}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {issue.title}
                      </h3>
                    </div>
                    <span className="text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
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
          <div className="text-center py-16">
            <Archive className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              暂无归档内容
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
