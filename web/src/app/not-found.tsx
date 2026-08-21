import type { Metadata } from 'next'
import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import BackButton from './components/BackButton'

export const metadata: Metadata = {
  title: '页面未找到',
  description: '你访问的页面不存在或已被移除。',
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="text-8xl font-serif font-bold text-primary-500 dark:text-primary-400 mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-primary-900 dark:text-white mb-2">
        页面走丢了
      </h1>
      <p className="text-secondary-500 dark:text-secondary-300 mb-8 max-w-md">
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
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-secondary-300 dark:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-lg font-medium transition-colors text-primary-900 dark:text-white"
        >
          <Search size={18} />
          浏览周刊
        </Link>
        <BackButton />
      </div>
    </div>
  )
}
