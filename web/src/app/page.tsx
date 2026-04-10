import Link from 'next/link'
import { ArrowRight, Calendar, BookOpen, Sparkles } from 'lucide-react'
import { getAllIssues } from './lib/content'

export default function Home() {
  const issues = getAllIssues()
  const latestIssue = issues[0]
  const recentIssues = issues.slice(0, 5)

  return (
    <div className="min-h-screen">
      {/* Hero Section — Notion Warm Minimal */}
      <section className="relative bg-white dark:bg-[#191919] py-24 lg:py-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-[#f6f5f4] dark:bg-[rgba(255,255,255,0.08)] rounded-[9999px] px-4 py-1.5 mb-10">
              <Sparkles className="w-3.5 h-3.5 text-[#0075de]" />
              <span className="text-[12px] font-semibold tracking-wide text-[#615d59] dark:text-[#a39e98]">
                创刊号已发布
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-[64px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-8 leading-[1.05] tracking-tight">
              欢迎来到
              <span className="text-[#0075de]">青年周刊</span>
            </h1>

            <p className="text-lg md:text-xl text-[#615d59] dark:text-[#a39e98] max-w-2xl mx-auto mb-12 leading-relaxed">
              一份为年轻人打造的内容聚合周刊。融合科技、二次元、游戏、成长等多个领域，
              每周为你精选最有价值的内容。
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/issues/"
                className="btn-primary inline-flex items-center justify-center space-x-2 text-[15px] font-semibold px-7 py-2.5"
              >
                <BookOpen className="w-5 h-5" />
                <span>开始阅读</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/subscribe/"
                className="btn-secondary inline-flex items-center justify-center space-x-2 text-[15px] font-semibold px-7 py-2.5"
              >
                <span>邮件订阅</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Issue Section — White Background */}
      {latestIssue && (
        <section className="py-20 bg-white dark:bg-[#191919]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl md:text-[32px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] leading-tight">
                最新一期
              </h2>
              <Link
                href={`/issues/${latestIssue.slug}/`}
                className="text-[#0075de] dark:text-[#62aef0] hover:text-[#005bab] dark:hover:text-[#62aef0] font-semibold text-[15px] inline-flex items-center"
              >
                阅读全文
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="card p-8 md:p-10">
              <div className="flex items-center space-x-2 text-sm text-[#a39e98] dark:text-[#615d59] mb-5">
                <Calendar className="w-4 h-4" />
                <span>{latestIssue.date}</span>
                <span>·</span>
                <span>第{latestIssue.issue}期</span>
              </div>

              <h3 className="text-2xl md:text-[28px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-5 leading-snug">
                {latestIssue.title}
              </h3>

              <p className="text-[#615d59] dark:text-[#a39e98] leading-relaxed mb-7">
                {latestIssue.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {['科技新势力', '二次元次元壁', '游戏研究所', '青春故事会'].map(
                  (tag) => (
                    <span key={tag} className="badge">
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Issues Section — Warm White Background */}
      <section className="py-20 bg-[#f6f5f4] dark:bg-[#202020]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-[32px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-10 leading-tight">
            往期周刊
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentIssues.map((issue) => (
              <Link
                key={issue.slug}
                href={`/issues/${issue.slug}/`}
                className="card p-7 group"
              >
                <div className="flex items-center space-x-2 text-sm text-[#a39e98] dark:text-[#615d59] mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>{issue.date}</span>
                </div>

                <h3 className="text-lg font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-3 group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors leading-snug">
                  {issue.title}
                </h3>

                <p className="text-sm text-[#615d59] dark:text-[#a39e98] line-clamp-2 leading-relaxed">
                  {issue.description}
                </p>

                <div className="mt-5 flex items-center text-[#0075de] dark:text-[#62aef0] text-sm font-semibold">
                  <span>阅读本期</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {issues.length > 5 && (
            <div className="mt-10 text-center">
              <Link
                href="/issues/"
                className="btn-secondary inline-flex items-center text-[15px] font-semibold"
              >
                <span>查看全部 {issues.length} 期</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section — White Background */}
      <section className="py-20 bg-white dark:bg-[#191919]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-[32px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-10 text-center leading-tight">
            内容板块
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
                className="card p-6 text-center group"
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="font-bold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-1.5 group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-[#a39e98] dark:text-[#615d59]">
                  {category.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe CTA — Notion Blue Section */}
      <section className="py-20 bg-[#0075de]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-[40px] font-bold font-serif-heading text-white mb-5 leading-tight">
            订阅青年周刊
          </h2>
          <p className="text-[rgba(255,255,255,0.85)] mb-10 text-lg leading-relaxed">
            每周一更新，直接发送到您的邮箱。不错过任何精彩内容。
          </p>
          <Link
            href="/subscribe/"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-[#0075de] font-semibold text-[15px] rounded-[4px] hover:bg-[#f6f5f4] transition-colors"
          >
            立即订阅
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  )
}
