import Link from 'next/link'
import { ArrowRight, BookOpen, Calendar, Clock, Sparkles } from 'lucide-react'
import { type Issue } from '../../lib/content'
import { coverUrl } from '../../lib/toc'
import IssueCover from '../IssueCover'

interface HeroSectionProps {
  issueCount: number
  categoryCount: number
  latestIssue?: Issue
}

/** 首页 Hero：欢迎文案 + 统计条 + 最新一期封面 */
export default function HeroSection({ issueCount, categoryCount, latestIssue }: HeroSectionProps) {
  return (
    <section className="relative bg-white dark:bg-[#191919] py-20 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* 文案侧 */}
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-[#f6f5f4] dark:bg-[rgba(255,255,255,0.08)] rounded-[9999px] px-4 py-1.5 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-[#0075de]" />
              <span className="text-[12px] font-semibold tracking-wide text-[#615d59] dark:text-[#a39e98]">
                已发布 {issueCount} 期
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
                  {issueCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#615d59] dark:text-[#a39e98]">内容板块</dt>
                <dd className="text-2xl font-bold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                  {categoryCount}
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
  )
}
