import Link from 'next/link'
import { Github, Twitter, Mail, Rss, Heart } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    内容: [
      { label: '最新周刊', href: '/issues/' },
      { label: '所有分类', href: '/categories/' },
      { label: '文章归档', href: '/archive/' },
    ],
    社区: [
      { label: 'GitHub', href: 'https://github.com/your-username/youth-weekly' },
      { label: '投稿指南', href: 'https://github.com/your-username/youth-weekly/blob/main/CONTRIBUTING.md' },
      { label: '问题反馈', href: 'https://github.com/your-username/youth-weekly/issues' },
    ],
    订阅: [
      { label: 'RSS订阅', href: '/rss.xml' },
      { label: '邮件订阅', href: '/subscribe/' },
    ],
  }

  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-xl font-bold text-gradient">
              青年周刊
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              为年轻人打造的内容聚合周刊。
              <br />
              科技、二次元、游戏、成长。
            </p>
            <div className="mt-4 flex space-x-4">
              <a
                href="https://github.com/your-username/youth-weekly"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="/rss.xml"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Rss className="w-5 h-5" />
              </a>
              <a
                href="mailto:youth-weekly@example.com"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                {category}
              </h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {currentYear} 青年周刊. 保留所有权利.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              用
              <Heart className="w-4 h-4 mx-1 text-red-500" />
              为年轻人创作
            </p>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/privacy/"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                隐私政策
              </Link>
              <Link
                href="/terms/"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                使用条款
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
