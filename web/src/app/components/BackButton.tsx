'use client'

import { ArrowLeft } from 'lucide-react'

/**
 * “返回上一页”按钮：依赖 window.history，必须放在客户端组件中。
 */
export default function BackButton() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-2 px-5 py-2.5 border border-secondary-300 dark:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-lg font-medium transition-colors text-primary-900 dark:text-white"
    >
      <ArrowLeft size={18} />
      返回上一页
    </button>
  )
}
