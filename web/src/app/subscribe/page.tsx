import type { Metadata } from 'next'
import { getSiteData } from '../lib/content'
import SubscribeClient from './SubscribeClient'

export const metadata: Metadata = {
  title: '订阅青年周刊',
  description: '订阅青年周刊：每周一更新的内容聚合周刊，支持邮件订阅与 RSS。',
  alternates: { canonical: 'subscribe/' },
}

export default function SubscribePage() {
  // 联系邮箱唯一来源：site-data.json（config.yaml 生成），避免硬编码双份
  let contactEmail = 'youth-weekly@example.com'
  try {
    const siteData = getSiteData()
    const email = siteData.site && siteData.site.email
    if (typeof email === 'string' && email) contactEmail = email
  } catch {
    // 产物缺失时使用兜底地址（构建期不应发生，deploy 会先生成产物）
  }

  return <SubscribeClient contactEmail={contactEmail} />
}
