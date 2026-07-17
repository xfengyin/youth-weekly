// Jest 全局测试设置
// 注册 @testing-library/jest-dom 扩展,提供 toBeInTheDocument 等 DOM 断言
import '@testing-library/jest-dom'

// mock next/link,避免在 jsdom 中触发 next/router 内部行为
jest.mock('next/link', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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

// mock next-themes,提供可控的 useTheme 实现
jest.mock('next-themes', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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
