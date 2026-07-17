/**
 * Footer 组件单元测试
 *
 * 覆盖以下场景:
 * 1. 品牌名与简介
 * 2. 三类分栏链接(内容/社区/订阅)
 * 3. GitHub/RSS/Mail 社交图标链接
 * 4. 版权年份动态生成
 * 5. "用 ❤️ 为年轻人创作" 装饰文案
 * 6. 外链的安全属性(target=_blank + rel=noopener noreferrer)
 */

import { render, screen, within } from '@testing-library/react'
import Footer from '../Footer'

describe('Footer 组件', () => {
  describe('品牌与简介', () => {
    it('渲染品牌名 青年周刊', () => {
      render(<Footer />)
      expect(screen.getByText('青年周刊')).toBeInTheDocument()
    })

    it('渲染品牌简介文案', () => {
      render(<Footer />)
      expect(
        screen.getByText(/为年轻人打造的内容聚合周刊/)
      ).toBeInTheDocument()
    })

    it('品牌名链接指向首页', () => {
      render(<Footer />)
      const brandLink = screen.getByText('青年周刊').closest('a')
      expect(brandLink).toHaveAttribute('href', '/')
    })
  })

  describe('分栏链接', () => {
    it('渲染"内容"分栏', () => {
      render(<Footer />)
      expect(screen.getByText('内容')).toBeInTheDocument()
      expect(screen.getByText('最新周刊').closest('a')).toHaveAttribute(
        'href',
        '/issues/'
      )
      expect(screen.getByText('所有分类').closest('a')).toHaveAttribute(
        'href',
        '/categories/'
      )
      expect(screen.getByText('文章归档').closest('a')).toHaveAttribute(
        'href',
        '/archive/'
      )
    })

    it('渲染"社区"分栏', () => {
      render(<Footer />)
      expect(screen.getByText('社区')).toBeInTheDocument()
      // GitHub 链接
      const githubLink = screen
        .getByText('GitHub', { selector: 'a' })
        .closest('a')
      expect(githubLink).toHaveAttribute(
        'href',
        'https://github.com/xfengyin/youth-weekly'
      )
      // 投稿指南
      expect(screen.getByText('投稿指南').closest('a')).toHaveAttribute(
        'href',
        expect.stringContaining('CONTRIBUTING.md')
      )
      // 问题反馈
      expect(screen.getByText('问题反馈').closest('a')).toHaveAttribute(
        'href',
        expect.stringContaining('/issues')
      )
    })

    it('渲染"订阅"分栏', () => {
      render(<Footer />)
      expect(screen.getByText('订阅')).toBeInTheDocument()
      expect(screen.getByText('RSS订阅').closest('a')).toHaveAttribute(
        'href',
        '/rss.xml'
      )
      expect(screen.getByText('邮件订阅').closest('a')).toHaveAttribute(
        'href',
        '/subscribe/'
      )
    })
  })

  describe('社交图标链接', () => {
    it('GitHub 社交链接设置 target=_blank 与 rel=noopener noreferrer', () => {
      // Arrange
      const { container } = render(<Footer />)

      // Act:查找 href 以 https://github.com 开头的 a 标签
      const githubLink = container.querySelector(
        'a[href^="https://github.com/xfengyin/youth-weekly"]'
      )

      // Assert
      expect(githubLink).not.toBeNull()
      expect(githubLink).toHaveAttribute('target', '_blank')
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('RSS 链接指向 /rss.xml', () => {
      const { container } = render(<Footer />)
      const rssLink = container.querySelector('a[href="/rss.xml"]')
      expect(rssLink).toBeInTheDocument()
    })

    it('邮件链接使用 mailto: 协议', () => {
      const { container } = render(<Footer />)
      const mailLink = container.querySelector('a[href^="mailto:"]')
      expect(mailLink).not.toBeNull()
      expect(mailLink).toHaveAttribute(
        'href',
        expect.stringMatching(/^mailto:.+@.+/)
      )
    })
  })

  describe('版权与底部文案', () => {
    it('版权信息包含当前年份', () => {
      render(<Footer />)
      const year = new Date().getFullYear()
      // 版权文案格式:© {year} 青年周刊. 保留所有权利.
      const expectedText = `© ${year} 青年周刊. 保留所有权利.`
      expect(screen.getByText(expectedText)).toBeInTheDocument()
    })

    it('渲染"用 ❤️ 为年轻人创作"装饰文案', () => {
      // Arrange & Act
      render(<Footer />)

      // Assert:文案片段应该出现在文档中
      expect(screen.getByText(/为年轻人创作/)).toBeInTheDocument()
    })

    it('渲染 footer 元素', () => {
      const { container } = render(<Footer />)
      expect(container.querySelector('footer')).toBeInTheDocument()
    })
  })

  describe('外链安全', () => {
    it('所有指向外部域名的链接都带 target=_blank', () => {
      const { container } = render(<Footer />)
      const externalLinks = Array.from(
        container.querySelectorAll('a[href^="https://"]')
      ) as HTMLAnchorElement[]

      expect(externalLinks.length).toBeGreaterThan(0)
      for (const link of externalLinks) {
        expect(link).toHaveAttribute('target', '_blank')
        expect(link.getAttribute('rel') || '').toMatch(/noopener/)
      }
    })
  })
})
