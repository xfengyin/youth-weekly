import Link from 'next/link'
import { ArrowRight, Calendar, BookOpen, Sparkles, Clock } from 'lucide-react'
import { getAllIssues, getCategories } from './lib/content'
import { coverUrl } from './lib/toc'
import IssueCover from './components/IssueCover'

/** 分类装饰渐变（仅视觉，按 id 映射） */
const CATEGORY_GRADIENTS: Record<string, string> = {
  editorial: 'from-[#0075de] to-[#62aef0]',
  tech: 'from-[#2a9d99] to-[#62aef0]',
  anime: 'from-[#ff64c8] to-[#b78cf5]',
  gaming: 'from-[#1aae39] to-[#62ef8c]',
  stories: 'from-[#dd5b00] to-[#ffb25e]',
  tools: 'from-[#615d59] to-[#a39e98]',
  watching: 'from-[#391c57] to-[#8b5cf6]',
  gallery: 'from-[#0075de] to-[#2a9d99]',
  jobs: 'from-[#dd5b00] to-[#eb5757]',
}

export default function Home() {
  const issues = getAllIssues()
  const categories = getCategories()
  const latestIssue = issues[0]
  const recentIssues = issues.slice(0, 5)

  return (
    <div className="min-h-screen">
      {/* Hero — 封面驱动的欢迎区 */}
      <section className="relative bg-white dark:bg-[#191919] py-20 lg:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* 文案侧 */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center space-x-2 bg-[#f6f5f4] dark:bg-[rgba(255,255,255,0.08)] rounded-[9999px] px-4 py-1.5 mb-8">
                <Sparkles className="w-3.5 h-3.5 text-[#0075de]" />
                <span className="text-[12px] font-semibold tracking-wide text-[#615d59] dark:text-[#a39e98]">
                  已发布 {issues.length} 期
                </span>
              </div>

              <h1 className="text-4xl md:text-[56px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-6 leading-[1.08] tracking-tight">
                欢迎来到
                <span className="text-gradient block mt-1">青年周刊</span>
              </h1>

              <p className="text-lg md:text-xl text-[#615d59] dark:text-[#a39e98] max-w-xl mb-10 leading-relaxed">
                一份为年轻人打造的内容聚合周刊。融合科技、二次元、游戏、成长等多个领域，
                每周为你精选最有价值的内容。
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
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

              {/* 统计条 */}
              <dl className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                <div>
                  <dt className="text-xs text-[#615d59] dark:text-[#a39e98]">已发布期次</dt>
                  <dd className="text-2xl font-bold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                    {issues.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#615d59] dark:text-[#a39e98]">内容板块</dt>
                  <dd className="text-2xl font-bold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                    {categories.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#615d59] dark:text-[#a39e98]">更新频率</dt>
                  <dd className="text-2xl font-bold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                    每周
                  </dd>
                </div>
              </dl>
            </div>

            {/* 封面侧：最新一期 */}
            {latestIssue && (
              <Link
                href={`/issues/${latestIssue.slug}/`}
                className="group relative block animate-fade-in-up"
                style={{ animationDelay: '0.1s' }}
              >
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                  <IssueCover
                    src={coverUrl(latestIssue.slug)}
                    alt={`${latestIssue.title} 封面`}
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#0075de] via-[#2a9d99] to-[#8b5cf6]"
                    imgClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {/* 渐变遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="badge !bg-white/90 !text-[#0075de] mb-3">最新一期</span>
                    <h2 className="text-xl md:text-2xl font-bold text-white leading-snug line-clamp-2">
                      {latestIssue.title}
                    </h2>
                    <div className="mt-2 flex items-center gap-3 text-sm text-white/80">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {latestIssue.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        第{latestIssue.issue}期
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 最新一期详情 */}
      {latestIssue && (
        <section className="py-20 bg-white dark:bg-[#191919]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl md:text-[32px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] leading-tight">
                本期导读
              </h2>
              <Link
                href={`/issues/${latestIssue.slug}/`}
                className="text-[#0075de] dark:text-[#62aef0] hover:text-[#005bab] dark:hover:text-[#62aef0] font-semibold text-[15px] inline-flex items-center"
              >
                阅读全文
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="card card-hover p-8 md:p-10">
              <div className="flex items-center gap-3 text-sm text-[#615d59] dark:text-[#a39e98] mb-5">
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

              <Link
                href={`/issues/${latestIssue.slug}/`}
                className="inline-flex items-center gap-1.5 text-[#0075de] dark:text-[#62aef0] font-semibold text-[15px]"
              >
                开始阅读本期
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 往期周刊 — 封面卡片 */}
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
                className="card card-hover group overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <IssueCover
                    src={coverUrl(issue.slug)}
                    alt={`${issue.title} 封面`}
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#0075de] via-[#2a9d99] to-[#8b5cf6]"
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

      {/* 分类板块 — 渐变图标卡 */}
      <section className="py-20 bg-white dark:bg-[#191919]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-[32px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-10 text-center leading-tight">
            内容板块
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/#${encodeURIComponent(category.name)}`}
                className="card card-hover p-6 text-center group"
              >
                <div
                  className={`category-icon-card mx-auto mb-4 bg-gradient-to-br ${
                    CATEGORY_GRADIENTS[category.id] ?? 'from-[#0075de] to-[#62aef0]'
                  }`}
                >
                  <span aria-hidden="true">{category.icon}</span>
                </div>
                <h3 className="font-bold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-1.5 group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-[#615d59] dark:text-[#a39e98] line-clamp-1">
                  {category.tagline}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
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
