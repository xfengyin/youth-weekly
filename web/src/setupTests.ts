// Jest 全局测试设置
// 注册 @testing-library/jest-dom 扩展,提供 toBeInTheDocument 等 DOM 断言
import '@testing-library/jest-dom'

// mock next/link,避免在 jsdom 中触发 next/router 内部行为
jest.mock('next/link', () => {
    const React = require('react')
  const NextLink = ({
    href,
    children,
    ...rest
  }: {
    href: string
    children?: React.ReactNode
  }) => React.createElement('a', { href, ...rest }, children)
  NextLink.displayName = 'NextLink'
  return {
    __esModule: true,
    default: NextLink,
  }
})

// mock next/navigation 的 useRouter 等客户端 hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  notFound: jest.fn(),
}))


// mock next/font/google：jsdom 环境无法加载字体数据，
// layout.tsx 在模块顶层调用 Inter()/Noto_Serif_SC()，需返回可控对象
jest.mock('next/font/google', () => ({
  __esModule: true,
  Inter: () => ({ className: 'mock-inter', variable: '--font-inter' }),
  Noto_Serif_SC: () => ({ className: 'mock-noto', variable: '--font-noto-serif-sc' }),
}))

// mock next-themes,提供可控的 useTheme 实现
jest.mock('next-themes', () => {
    const React = require('react')

  let currentTheme = 'light'
  const setTheme = jest.fn((next: string) => {
    currentTheme = next
  })

  const useTheme = () => ({
    theme: currentTheme,
    setTheme,
    resolvedTheme: currentTheme,
    themes: ['light', 'dark', 'system'],
    systemTheme: 'light',
  })

  const ThemeProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children)

  return {
    __esModule: true,
    useTheme,
    ThemeProvider,
  }
})
