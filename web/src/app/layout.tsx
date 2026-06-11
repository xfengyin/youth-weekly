import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Serif_SC } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './components/ThemeProvider'
import Header from './components/Header'
import Footer from './components/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://xfengyin.github.io/youth-weekly'),
  title: '青年周刊 - 为年轻人打造的内容聚合周刊',
  description:
    '融合科技、二次元、游戏、成长等多个领域的综合性青年内容周刊。参考阮一峰科技爱好者周刊的开源模式，温暖、有趣、有深度。',
  keywords: ['青年周刊', '科技', '二次元', '游戏', '成长', '周刊', '年轻人'],
  authors: [{ name: '青年周刊编辑部' }],
  openGraph: {
    title: '青年周刊',
    description: '为年轻人打造的内容聚合周刊',
    type: 'website',
    locale: 'zh_CN',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '青年周刊',
      },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#191919' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSerifSC.variable} font-sans`}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-white dark:bg-[#191919]">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
