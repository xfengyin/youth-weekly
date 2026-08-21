import type { Metadata } from 'next'
import SubscribeClient from './SubscribeClient'

export const metadata: Metadata = {
  title: '订阅青年周刊',
  description: '订阅青年周刊：每周一更新的内容聚合周刊，支持邮件订阅与 RSS。',
  alternates: { canonical: 'subscribe/' },
}

export default function SubscribePage() {
  return <SubscribeClient />
}
