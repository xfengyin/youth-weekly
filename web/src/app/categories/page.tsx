import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCategories } from '../lib/content'

export const metadata: Metadata = {
  title: '内容分类',
  description: '浏览青年周刊全部内容板块：科技、二次元、游戏、成长、好工具等。',
  alternates: { canonical: 'categories/' },
}

/**
 * 分类装饰色：仅负责视觉（按 id 映射），分类数据本身来自
 * site-data.json（config.yaml 生成），避免内容双份维护。
 */
const ACCENTS: Record<string, string> = {
  editorial: '#0075de',
  tech: '#2a9d99',
  anime: '#ff64c8',
  gaming: '#1aae39',
  stories: '#dd5b00',
  tools: '#615d59',
  watching: '#391c57',
  gallery: '#0075de',
  jobs: '#dd5b00',
}

export default function CategoriesPage() {
  const categories = getCategories()
  return (
    <div className="min-h-screen bg-[#f6f5f4] dark:bg-[#202020] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14">
          <Link
            href="/"
            className="inline-flex items-center text-[#615d59] dark:text-[#a39e98] hover:text-[#0075de] dark:hover:text-[#62aef0] font-semibold text-[15px] mb-5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回首页
          </Link>
          <h1 className="text-3xl md:text-[40px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] leading-tight">
            内容分类
          </h1>
          <p className="mt-3 text-[#615d59] dark:text-[#a39e98]">
            浏览不同板块的内容，找到你感兴趣的主题
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              id={category.name}
              className="card p-7 group"
            >
              <div className="flex items-start space-x-5">
                <div className="text-4xl flex-shrink-0">{category.icon}</div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-2 group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors">
                    {category.name}
                  </h2>
                  <p className="text-sm text-[#615d59] dark:text-[#a39e98] leading-relaxed">
                    {category.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div
                  className="h-[2px] w-full rounded-full opacity-30"
                  style={{ backgroundColor: ACCENTS[category.id] ?? '#0075de' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Callout — Contribution Guide */}
        <div className="mt-16 callout">
          <span className="callout-icon">✏️</span>
          <div className="callout-content">
            <p className="font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-2">
              投稿指南
            </p>
            <p className="mb-4">
              欢迎向《青年周刊》投稿！我们接受各种类型的原创内容，包括技术文章、书评、影评、游戏评测等。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="https://github.com/xfengyin/youth-weekly/blob/main/CONTRIBUTING.md"
                target="_blank"
                className="btn-primary text-[15px]"
              >
                查看投稿指南
              </Link>
              <Link
                href="https://github.com/xfengyin/youth-weekly/issues"
                target="_blank"
                className="btn-secondary text-[15px]"
              >
                提交内容
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
