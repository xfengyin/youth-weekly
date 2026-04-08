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
    excerpt: '欢迎来到青年周刊！这是一份为年轻人打造的内容聚合周刊，涵盖科技、二次元、游戏、成长等多个领域...',
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            搜索
          </h1>
        </div>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索周刊内容..."
            className="input pl-12 pr-12 py-4 text-lg"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Status */}
        {query && (
          <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            找到 {results.length} 个结果
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {results.map((result) => (
            <Link
              key={result.slug}
              href={`/issues/${result.slug}/`}
              className="card p-6 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <Calendar className="w-4 h-4" />
                <span>{result.date}</span>
                <span>·</span>
                <span>第{result.issue}期</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                {result.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {result.excerpt}
              </p>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {query && results.length === 0 && !isSearching && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              未找到相关内容
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              请尝试使用其他关键词搜索
            </p>
          </div>
        )}

        {/* Initial State */}
        {!query && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              开始搜索
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              输入关键词搜索周刊内容
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['AI工具', '游戏评测', '职场指南', '书籍推荐'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
