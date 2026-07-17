/**
 * Header 组件单元测试
 *
 * 覆盖以下场景:
 * 1. logo 与品牌名渲染
 * 2. 桌面端导航链接(首页/周刊/分类/搜索/订阅)
 * 3. 移动菜单切换(open/close)
 * 4. 主题切换按钮(light/dark)
 * 5. 移动菜单关闭行为(点击链接后自动关闭)
 *
 * 注意:next/link、next-themes 等已在 setupTests.ts 中 mock
 */

import { render, screen, within, fireEvent } from '@testing-library/react'
import Header from '../Header'

describe('Header 组件', () => {
  describe('基础渲染', () => {
    it('渲染 logo 与品牌名', () => {
      // Arrange & Act
      render(<Header />)

      // Assert
      expect(screen.getByText('青年周刊')).toBeInTheDocument()
    })

    it('logo 链接指向首页', () => {
      render(<Header />)

      // 第一个匹配文本为"青年周刊"的元素是 logo
      const logoLink = screen.getAllByText('青年周刊')[0].closest('a')
      expect(logoLink).toHaveAttribute('href', '/')
    })

    it('渲染 header 元素', () => {
      const { container } = render(<Header />)

      expect(container.querySelector('header')).toBeInTheDocument()
    })
  })

  describe('桌面端导航', () => {
    it('渲染所有主导航项', () => {
      render(<Header />)

      const expectedNavLabels = ['首页', '周刊', '分类', '搜索', '订阅']

      for (const label of expectedNavLabels) {
        expect(screen.getAllByText(label).length).toBeGreaterThan(0)
      }
    })

    it('导航链接的 href 正确', () => {
      render(<Header />)

      expect(screen.getByText('首页').closest('a')).toHaveAttribute('href', '/')
      expect(screen.getByText('周刊').closest('a')).toHaveAttribute(
        'href',
        '/issues/'
      )
      expect(screen.getByText('分类').closest('a')).toHaveAttribute(
        'href',
        '/categories/'
      )
      expect(screen.getByText('搜索').closest('a')).toHaveAttribute(
        'href',
        '/search/'
      )
      expect(screen.getByText('订阅').closest('a')).toHaveAttribute(
        'href',
        '/subscribe/'
      )
    })
  })

  describe('移动菜单切换', () => {
    it('初始状态下移动菜单隐藏', () => {
      render(<Header />)

      // 移动菜单具有 id="mobile-menu" 和 role="dialog",初始未渲染
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('点击菜单按钮后显示移动菜单', () => {
      render(<Header />)

      // 菜单按钮带有 aria-label="菜单"
      const menuButton = screen.getByRole('button', { name: '菜单' })
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(menuButton)

      expect(menuButton).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('移动菜单包含 RSS 链接', () => {
      render(<Header />)

      fireEvent.click(screen.getByRole('button', { name: '菜单' }))

      const dialog = screen.getByRole('dialog')
      const rssLink = within(dialog).getByText('RSS').closest('a')
      expect(rssLink).toHaveAttribute('href', '/rss.xml')
    })

    it('再次点击菜单按钮收起移动菜单', () => {
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: '菜单' })
      fireEvent.click(menuButton) // 展开
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      fireEvent.click(menuButton) // 收起
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('点击移动菜单中的链接后菜单自动关闭', () => {
      render(<Header />)

      // 打开菜单
      fireEvent.click(screen.getByRole('button', { name: '菜单' }))
      const dialog = screen.getByRole('dialog')

      // 点击"周刊"链接
      fireEvent.click(within(dialog).getByText('周刊'))

      // 菜单应关闭
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('主题切换按钮', () => {
    it('mounted 之前不渲染主题切换按钮', () => {
      // Arrange:首次渲染 mounted=false,主题按钮不出现
      const { container } = render(<Header />)

      // 没有 aria-label 包含"主题"的按钮
      const themeButtons = container.querySelectorAll(
        'button[aria-label*="主题"]'
      )
      expect(themeButtons).toHaveLength(0)
    })

    it('mounted 之后渲染主题切换按钮(初始 light → 显示 Moon 图标)', () => {
      render(<Header />)

      // 触发 useEffect 中的 setMounted(true)
      // RTL 中 useEffect 会在 render 后自动 flush
      const themeButton = screen.getByRole('button', { name: '切换到暗色主题' })
      expect(themeButton).toBeInTheDocument()
      expect(themeButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('点击主题按钮调用 setTheme 切换主题', () => {
      render(<Header />)

      const themeButton = screen.getByRole('button', { name: '切换到暗色主题' })
      fireEvent.click(themeButton)

      // 我们的 mock 中 setTheme 会被调用,并且会把 currentTheme 切到 'dark'
      // 因为主题变化是在 mock 中维护的,所以重新渲染后会看到 Sun 图标与新 aria-label
      // 重新 render 一次以应用 mock 内部的状态变更
      // 实际在我们的 mock 中:setTheme 直接修改 currentTheme 变量
      // 组件本身读取 useTheme() 的返回值,我们需要触发重渲染
      // 这里使用 rerender 模拟
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { rerender } = render(<Header />)
      rerender(<Header />)

      // 因为 mock 内部 currentTheme 已变更,新渲染应展示切换后的按钮
      const newButton = screen.getByRole('button', { name: '切换到亮色主题' })
      expect(newButton).toBeInTheDocument()
      expect(newButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('订阅 CTA', () => {
    it('渲染桌面端订阅按钮', () => {
      render(<Header />)

      const subscribeLinks = screen.getAllByText('订阅')
      // 应至少有一个链接指向 /subscribe/
      const subscribeLink = subscribeLinks
        .map((el) => el.closest('a'))
        .find((el) => el?.getAttribute('href') === '/subscribe/')
      expect(subscribeLink).toBeDefined()
    })
  })
})
