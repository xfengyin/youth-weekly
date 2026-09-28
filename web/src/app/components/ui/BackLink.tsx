import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface BackLinkProps {
  href: string
  label: string
  className?: string
}

/** 页首“返回上级”链接（归档 / 分类 / 搜索 / 订阅等页面共用） */
export default function BackLink({ href, label, className = '' }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center font-semibold text-[15px] text-[#615d59] dark:text-[#a39e98] hover:text-[#0075de] dark:hover:text-[#62aef0] transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-1" />
      {label}
    </Link>
  )
}
