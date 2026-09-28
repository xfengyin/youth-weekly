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
      <div className="text-8xl font-serif-heading font-bold text-[#0075de] dark:text-[#62aef0] mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-2">
        页面走丢了
      </h1>
      <p className="text-[#615d59] dark:text-[#a39e98] mb-8 max-w-md">
        你访问的页面不存在，或者已经被移走了。别担心，我们帮你找了几个好去处。
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/" className="btn-primary gap-2 px-5 py-2.5">
          <Home size={18} />
          回到首页
        </Link>
        <Link href="/issues" className="btn-secondary gap-2 px-5 py-2.5">
          <Search size={18} />
          浏览周刊
        </Link>
        <BackButton />
      </div>
    </div>
  )
}
