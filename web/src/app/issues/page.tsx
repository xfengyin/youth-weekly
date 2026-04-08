import Link from 'next/link'
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react'
import { getAllIssues } from '../lib/content'

export default function IssuesPage() {
  const issues = getAllIssues()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            所有周刊
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            共 {issues.length} 期内容，每周更新
          </p>
        </div>

        {/* Issues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map((issue) => (
            <Link
              key={issue.slug}
              href={`/issues/${issue.slug}/`}
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{issue.date}</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                  第{issue.issue}期
                </span>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {issue.title}
              </h2>

              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
                {issue.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-4 h-4 mr-1" />
                  <span>阅读全文</span>
                </div>
                <span className="text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {issues.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              暂无周刊内容，敬请期待...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
