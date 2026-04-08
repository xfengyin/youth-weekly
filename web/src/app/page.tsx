import Link from 'next/link'
import { ArrowRight, Calendar, BookOpen, Sparkles } from 'lucide-react'
import { getAllIssues } from './lib/content'

export default function Home() {
  const issues = getAllIssues()
  const latestIssue = issues[0]
  const recentIssues = issues.slice(0, 5)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm mb-8">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                创刊号已发布
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              欢迎来到<span className="text-gradient">青年周刊</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
              一份为年轻人打造的内容聚合周刊。融合科技、二次元、游戏、成长等多个领域，
              每周为你精选最有价值的内容。
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/issues/"
                className="btn-primary inline-flex items-center justify-center space-x-2 text-lg px-8 py-3"
              >
                <BookOpen className="w-5 h-5" />
                <span>开始阅读</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/subscribe/"
                className="btn-secondary inline-flex items-center justify-center space-x-2 text-lg px-8 py-3"
              >
                <span>邮件订阅</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 dark:bg-primary-900/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary-200 dark:bg-secondary-900/30 rounded-full blur-3xl" />
      </section>

      {/* Latest Issue Section */}
      {latestIssue && (
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                最新一期
              </h2>
              <Link
                href={`/issues/${latestIssue.slug}/`}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium inline-flex items-center"
              >
                阅读全文
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="card p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <Calendar className="w-4 h-4" />
                <span>{latestIssue.date}</span>
                <span>·</span>
                <span>第{latestIssue.issue}期</span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {latestIssue.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {latestIssue.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {['科技新势力', '二次元次元壁', '游戏研究所', '青春故事会'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Issues Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            往期周刊
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentIssues.map((issue) => (
              <Link
                key={issue.slug}
                href={`/issues/${issue.slug}/`}
                className="card p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>{issue.date}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {issue.title}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {issue.description}
                </p>
                
                <div className="mt-4 flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                  <span>阅读本期</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {issues.length > 5 && (
            <div className="mt-8 text-center">
              <Link
                href="/issues/"
                className="btn-secondary inline-flex items-center"
              >
                <span>查看全部 {issues.length} 期</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            内容板块
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: '🚀', name: '科技新势力', desc: 'AI、编程、工具' },
              { icon: '🎨', name: '二次元次元壁', desc: 'ACG、动漫' },
              { icon: '🎮', name: '游戏研究所', desc: '游戏评测、攻略' },
              { icon: '📖', name: '青春故事会', desc: '成长、职场' },
              { icon: '🛠️', name: '好工具', desc: '效率、生产力' },
              { icon: '👀', name: '在看什么', desc: '影视、书籍' },
              { icon: '📷', name: '一周图鉴', desc: '视觉精选' },
              { icon: '💼', name: '谁在招人', desc: '招聘信息' },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/categories/#${category.name}`}
                className="card p-6 text-center hover:shadow-md transition-shadow group"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {category.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            订阅青年周刊
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            每周一更新，直接发送到您的邮箱。不错过任何精彩内容。
          </p>
          <Link
            href="/subscribe/"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            立即订阅
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  )
}
