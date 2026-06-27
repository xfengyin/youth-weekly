'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="text-8xl font-serif font-bold text-primary-500 dark:text-primary-400 mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
        页面走丢了
      </h1>
      <p className="text-text-secondary dark:text-text-secondary-dark mb-8 max-w-md">
        你访问的页面不存在，或者已经被移走了。别担心，我们帮你找了几个好去处。
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          <Home size={18} />
          回到首页
        </Link>
        <Link
          href="/issues"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-border dark:border-border-dark hover:bg-bg-secondary dark:hover:bg-bg-secondary-dark rounded-lg font-medium transition-colors text-text-primary dark:text-text-primary-dark"
        >
          <Search size={18} />
          浏览周刊
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-border dark:border-border-dark hover:bg-bg-secondary dark:hover:bg-bg-secondary-dark rounded-lg font-medium transition-colors text-text-primary dark:text-text-primary-dark"
        >
          <ArrowLeft size={18} />
          返回上一页
        </button>
      </div>
    </div>
  )
}
