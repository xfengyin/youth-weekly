'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, ArrowLeft, Calendar, X } from 'lucide-react'
import Fuse from 'fuse.js'

interface SearchResult {
  issue: number
  title: string
  date: string
  slug: string
  excerpt: string
}

// 搜索数据（实际应用中可以从 API 获取）
const mockResults: SearchResult[] = [
  {
    issue: 1,
    title: '青年周刊 · 创刊号',
    date: '2026-04-08',
    slug: '001',
    excerpt:
      '欢迎来到青年周刊！这是一份为年轻人打造的内容聚合周刊，涵盖科技、二次元、游戏、成长等多个领域...',
  },
]

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const fuse = useMemo(() => {
    return new Fuse(mockResults, {
      keys: ['title', 'excerpt'],
      threshold: 0.4,
    })
  }, [])

  useEffect(() => {
    if (query.trim()) {
      setIsSearching(true)
      const searchResults = fuse.search(query)
      setResults(searchResults.map((result) => result.item))
      setIsSearching(false)
    } else {
      setResults([])
    }
  }, [query, fuse])

  return (
    <div className="min-h-screen bg-[#f6f5f4] dark:bg-[#202020] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
            搜索
          </h1>
        </div>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#a39e98] dark:text-[#615d59]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索周刊内容..."
            className="input pl-12 pr-12 py-3.5 text-base"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#a39e98] dark:text-[#615d59] hover:text-[#615d59] dark:hover:text-[rgba(255,255,255,0.95)]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Status */}
        {query && (
          <div className="mb-6 text-sm text-[#a39e98] dark:text-[#615d59]">
            找到 {results.length} 个结果
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {results.map((result) => (
            <Link
              key={result.slug}
              href={`/issues/${result.slug}/`}
              className="card p-6 block group"
            >
              <div className="flex items-center space-x-2 text-sm text-[#a39e98] dark:text-[#615d59] mb-3">
                <Calendar className="w-4 h-4" />
                <span>{result.date}</span>
                <span>·</span>
                <span>第{result.issue}期</span>
              </div>
              <h2 className="text-xl font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-2 group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors">
                {result.title}
              </h2>
              <p className="text-[#615d59] dark:text-[#a39e98] text-sm leading-relaxed">
                {result.excerpt}
              </p>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {query && results.length === 0 && !isSearching && (
          <div className="text-center py-20">
            <Search className="w-14 h-14 text-[#a39e98] dark:text-[#615d59] mx-auto mb-5" />
            <h3 className="text-lg font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-2">
              未找到相关内容
            </h3>
            <p className="text-[#615d59] dark:text-[#a39e98]">
              请尝试使用其他关键词搜索
            </p>
          </div>
        )}

        {/* Initial State */}
        {!query && (
          <div className="text-center py-20">
            <Search className="w-14 h-14 text-[#a39e98] dark:text-[#615d59] mx-auto mb-5" />
            <h3 className="text-lg font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-2">
              开始搜索
            </h3>
            <p className="text-[#615d59] dark:text-[#a39e98] mb-8">
              输入关键词搜索周刊内容
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['AI工具', '游戏评测', '职场指南', '书籍推荐'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="badge cursor-pointer hover:bg-[rgba(0,117,222,0.12)] transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
