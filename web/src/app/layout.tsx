import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './components/ThemeProvider'
import Header from './components/Header'
import Footer from './components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '青年周刊 - 为年轻人打造的内容聚合周刊',
  description: '融合科技、二次元、游戏、成长等多个领域的综合性青年内容周刊。参考阮一峰科技爱好者周刊的开源模式，温暖、有趣、有深度。',
  keywords: ['青年周刊', '科技', '二次元', '游戏', '成长', '周刊', '年轻人'],
  authors: [{ name: '青年周刊编辑部' }],
  openGraph: {
    title: '青年周刊',
    description: '为年轻人打造的内容聚合周刊',
    type: 'website',
    locale: 'zh_CN',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
