import { type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title?: string
  description?: string
  /** 描述段落附加类名（如需与下方内容拉开间距） */
  descriptionClassName?: string
  children?: ReactNode
}

/** 空状态 / 引导态：居中图标 + 标题 + 描述（搜索、归档等页面共用） */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  descriptionClassName = '',
  children,
}: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <Icon className="w-14 h-14 text-[#615d59] dark:text-[#a39e98] mx-auto mb-5" />
      {title && (
        <h3 className="text-lg font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className={`text-[#615d59] dark:text-[#a39e98] ${descriptionClassName}`}>
          {description}
        </p>
      )}
      {children}
    </div>
  )
}
