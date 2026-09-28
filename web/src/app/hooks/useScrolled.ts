'use client'

import { useEffect, useState } from 'react'

/**
 * 页面滚动超过 threshold（px）后返回 true。
 * passive 监听；初始值 false，SSR/首帧安全。
 */
export function useScrolled(threshold: number): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}
