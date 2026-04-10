import Link from 'next/link'
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react'
import { getAllIssues } from '../lib/content'

export default function IssuesPage() {
  const issues = getAllIssues()

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

        {/* Issues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map((issue) => (
            <Link
              key={issue.slug}
              href={`/issues/${issue.slug}/`}
              className="card p-7 group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-2 text-sm text-[#a39e98] dark:text-[#615d59]">
                  <Calendar className="w-4 h-4" />
                  <span>{issue.date}</span>
                </div>
                <span className="badge">
                  第{issue.issue}期
                </span>
              </div>

              <h2 className="text-xl font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-3 group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors leading-snug">
                {issue.title}
              </h2>

              <p className="text-[#615d59] dark:text-[#a39e98] text-sm line-clamp-3 mb-5 leading-relaxed">
                {issue.description}
              </p>

              <div className="flex items-center justify-between pt-5 border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
                <div className="flex items-center text-sm text-[#a39e98] dark:text-[#615d59]">
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  <span>阅读全文</span>
                </div>
                <span className="text-[#0075de] dark:text-[#62aef0] group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

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
