import BackLink from './BackLink'

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  className?: string
}

/** 功能页统一页首：返回链接 + 页面标题 + 可选描述 */
export default function PageHeader({
  title,
  description,
  backHref = '/',
  backLabel = '返回首页',
  className = 'mb-10',
}: PageHeaderProps) {
  return (
    <div className={className}>
      <BackLink href={backHref} label={backLabel} className="mb-5" />
      <h1 className="text-3xl md:text-[40px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] leading-tight">
        {title}
      </h1>
      {description && (
        <p className="mt-3 text-[#615d59] dark:text-[#a39e98]">{description}</p>
      )}
    </div>
  )
}
