import Link from 'next/link'
import { Github, Rss, Mail, Heart } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    内容: [
      { label: '最新周刊', href: '/issues/' },
      { label: '所有分类', href: '/categories/' },
      { label: '文章归档', href: '/archive/' },
    ],
    社区: [
      { label: 'GitHub', href: 'https://github.com/xfengyin/youth-weekly' },
      {
        label: '投稿指南',
        href: 'https://github.com/xfengyin/youth-weekly/blob/main/CONTRIBUTING.md',
      },
      {
        label: '问题反馈',
        href: 'https://github.com/xfengyin/youth-weekly/issues',
      },
    ],
    订阅: [
      { label: 'RSS订阅', href: '/rss.xml' },
      { label: '邮件订阅', href: '/subscribe/' },
    ],
  }

  return (
    <footer className="bg-[#f6f5f4] dark:bg-[#202020] border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link
              href="/"
              className="text-xl font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]"
            >
              青年周刊
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-[#615d59] dark:text-[#a39e98]">
              为年轻人打造的内容聚合周刊。
              <br />
              科技、二次元、游戏、成长。
            </p>
            <div className="mt-5 flex space-x-4">
              <a
                href="https://github.com/xfengyin/youth-weekly"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a39e98] hover:text-[#615d59] dark:hover:text-[rgba(255,255,255,0.95)] transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="/rss.xml"
                className="text-[#a39e98] hover:text-[#615d59] dark:hover:text-[rgba(255,255,255,0.95)] transition-colors"
              >
                <Rss className="w-5 h-5" />
              </a>
              <a
                href="mailto:youth-weekly@example.com"
                className="text-[#a39e98] hover:text-[#615d59] dark:hover:text-[rgba(255,255,255,0.95)] transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] uppercase tracking-wider">
                {category}
              </h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#615d59] dark:text-[#a39e98] hover:text-[#0075de] dark:hover:text-[#62aef0] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-[#a39e98] dark:text-[#615d59]">
              © {currentYear} 青年周刊. 保留所有权利.
            </p>
            <p className="text-sm text-[#a39e98] dark:text-[#615d59] flex items-center">
              用
              <Heart className="w-4 h-4 mx-1 text-[#dd5b00]" />
              为年轻人创作
            </p>
            {/* 隐私政策与使用条款页面尚未建立，待真正需要时再创建（YAGNI） */}
          </div>
        </div>
      </div>
    </footer>
  )
}
