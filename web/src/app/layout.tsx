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
  title: {
    default: '青年周刊 - 为年轻人打造的内容聚合周刊',
    template: '%s - 青年周刊',
  },
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
        // 相对路径：基于 metadataBase（含 /youth-weekly basePath）解析为
        // https://xfengyin.github.io/youth-weekly/og-image.png
        url: 'og-image.png',
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
        {/* a11y：跳过导航直达主内容（WCAG 2.4.1 Bypass Blocks） */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-[#0075de] focus:text-white focus:font-semibold"
        >
          跳到主要内容
        </a>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-white dark:bg-[#191919]">
            <Header />
            <main id="main" className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
