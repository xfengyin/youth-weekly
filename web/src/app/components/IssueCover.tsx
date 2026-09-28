'use client'

import { useState } from 'react'

interface IssueCoverProps {
  src: string
  alt: string
  /** 外层 className（尺寸/圆角/阴影等由调用方控制） */
  className?: string
  imgClassName?: string
}

/**
 * 期次封面图：加载失败时回退到品牌渐变占位（含期号感装饰），
 * 保证任何期次都有视觉封面。
 */
export default function IssueCover({ src, alt, className = '', imgClassName = '' }: IssueCoverProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-[#f6f5f4] dark:bg-[#202020] ${className}`}
      >
        <div className="w-16 h-16 rounded-full bg-[#0075de]/10 flex items-center justify-center text-[#0075de] dark:text-[#62aef0] text-2xl font-bold">
          刊
        </div>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={imgClassName || className}
    />
  )
}
