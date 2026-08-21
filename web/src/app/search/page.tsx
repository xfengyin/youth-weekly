import type { Metadata } from 'next'
import SearchClient from './SearchClient'

export const metadata: Metadata = {
  title: '搜索',
  description: '在青年周刊全站内容中搜索关键词。',
  alternates: { canonical: 'search/' },
}

export default function SearchPage() {
  return <SearchClient />
}
