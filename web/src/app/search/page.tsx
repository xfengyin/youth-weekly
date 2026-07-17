'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, ArrowLeft, Calendar, X, AlertCircle } from 'lucide-react'
import Fuse from 'fuse.js'

interface SearchResult {
  issue: number
  title: string
  date: string
  slug: string
  excerpt: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [searchData, setSearchData] = useState<SearchResult[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // 错误状态：避免 catch 静默吞错，提供可观测性
  const [error, setError] = useState<string | null>(null)

  // 加载搜索索引数据
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/search-data.json`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`搜索数据请求失败 (HTTP ${res.status})`)
        }
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setSearchData(Array.isArray(data) ? data : [])
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        // 记录错误到控制台，便于线上排查
        // eslint-disable-next-line no-console
        console.error('[search] 加载搜索数据失败:', err)
        const message =
          err instanceof Error ? err.message : '加载搜索数据时发生未知错误'
        setError(message)
        setSearchData([])
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const fuse = useMemo(() => {
    return new Fuse(searchData, {
      keys: ['title', 'excerpt'],
      threshold: 0.4,
    })
  }, [searchData])

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
            aria-label="搜索周刊内容"
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

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20">
            <p className="text-[#a39e98] dark:text-[#615d59]">搜索数据加载中...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div
            role="alert"
            className="callout"
            style={{ borderLeft: '4px solid var(--color-error)' }}
          >
            <span className="callout-icon" aria-hidden="true">
              <AlertCircle className="w-5 h-5 text-[#eb5757]" />
            </span>
            <div className="callout-content">
              <p className="font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-1">
                搜索数据加载失败
              </p>
              <p>{error}</p>
              <p className="mt-2 text-xs text-[#a39e98] dark:text-[#615d59]">
                请稍后重试，或刷新页面。如问题持续，请联系站点管理员。
              </p>
            </div>
          </div>
        )}

        {/* Search Status */}
        {!isLoading && query && (
          <div className="mb-6 text-sm text-[#a39e98] dark:text-[#615d59]">
            找到 {results.length} 个结果
          </div>
        )}

        {/* Results */}
        {!isLoading && (
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
        )}

        {/* Empty State */}
        {!isLoading && query && results.length === 0 && !isSearching && (
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
        {!isLoading && !query && (
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
