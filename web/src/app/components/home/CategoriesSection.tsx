import Link from 'next/link'
import { type Category } from '../../lib/content'
import { categoryVisual } from '../../lib/category-visual'

/** 首页“内容板块”：渐变图标卡网格 */
export default function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
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
                className={`category-icon-card mx-auto mb-4 bg-gradient-to-br ${categoryVisual(category.id).gradient}`}
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
  )
}
