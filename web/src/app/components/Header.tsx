'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Sun, Moon, Menu, X, Search, Rss } from 'lucide-react'

export default function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/issues/', label: '周刊' },
    { href: '/categories/', label: '分类' },
    { href: '/search/', label: '搜索' },
    { href: '/subscribe/', label: '订阅' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#191919]/90 backdrop-blur-md border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5">
            <span className="text-2xl font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
              青年周刊
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[15px] font-semibold text-[#615d59] dark:text-[#a39e98] hover:text-[rgba(0,0,0,0.95)] dark:hover:text-[rgba(255,255,255,0.95)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-[4px] text-[#615d59] dark:text-[#a39e98] hover:bg-[#f6f5f4] dark:hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                aria-label="切换主题"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Subscribe CTA (Desktop) */}
            <Link
              href="/subscribe/"
              className="hidden md:inline-flex items-center text-[15px] font-semibold text-white bg-[#0075de] hover:bg-[#005bab] px-4 py-1.5 rounded-[4px] transition-colors"
            >
              订阅
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-[4px] text-[#615d59] dark:text-[#a39e98] hover:bg-[#f6f5f4] dark:hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              aria-label="菜单"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[15px] font-semibold text-[#615d59] dark:text-[#a39e98] hover:text-[rgba(0,0,0,0.95)] dark:hover:text-[rgba(255,255,255,0.95)] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/rss.xml"
                className="flex items-center space-x-2 text-[15px] font-semibold text-[#615d59] dark:text-[#a39e98] hover:text-[rgba(0,0,0,0.95)] dark:hover:text-[rgba(255,255,255,0.95)] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Rss className="w-4 h-4" />
                <span>RSS</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
