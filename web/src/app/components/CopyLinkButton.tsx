'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

interface CopyLinkButtonProps {
  /** 自定义文案（默认“复制链接”） */
  label?: string
}

/** 复制当前页 URL（优先 Web Share，回退剪贴板），带“已复制”反馈 */
export default function CopyLinkButton({ label = '复制链接' }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
    } catch {
      // 用户取消分享或剪贴板不可用：静默降级
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? '已复制链接' : '复制链接'}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#615d59] dark:text-[#a39e98] hover:text-[#0075de] dark:hover:text-[#62aef0] transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-[#1aae39]" /> : <Link2 className="w-4 h-4" />}
      <span>{copied ? '已复制' : label}</span>
    </button>
  )
}
