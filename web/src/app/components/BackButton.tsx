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
      className="btn-secondary gap-2 px-5 py-2.5"
    >
      <ArrowLeft size={18} />
      返回上一页
    </button>
  )
}
