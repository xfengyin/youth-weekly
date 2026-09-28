'use client'

import { ArrowUp } from 'lucide-react'
import { useScrolled } from '../hooks/useScrolled'

/** 返回顶部按钮：滚动超过一定距离后显示 */
export default function BackToTop() {
  const visible = useScrolled(600)

  if (!visible) return null

  return (
    <button
      type="button"
      aria-label="返回顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-[80] p-3 rounded-full bg-[#0075de] text-white shadow-lg hover:bg-[#005bab] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#097fe8] focus-visible:ring-offset-2"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}
