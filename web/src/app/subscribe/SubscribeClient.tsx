'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Rss, Check } from 'lucide-react'

interface SubscribeClientProps {
  contactEmail: string
}

/**
 * 订阅页交互主体。
 * 说明：邮件订阅通道尚未接入后端/第三方服务，为避免“可提交表单但无真实
 * 通道”的误导，这里明确展示“功能规划中”，并提供 mailto 直达编辑部。
 */
export default function SubscribeClient({ contactEmail }: SubscribeClientProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const rssUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/rss.xml`
    try {
      await navigator.clipboard.writeText(rssUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 剪贴板不可用时静默降级（地址本身可见可复制）
    }
  }

  const rssUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/rss.xml`
  const mailtoHref = `mailto:${contactEmail}?subject=${encodeURIComponent('订阅青年周刊')}`

  return (
    <div className="min-h-screen bg-[#f6f5f4] dark:bg-[#202020] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center text-[#615d59] dark:text-[#a39e98] hover:text-[#0075de] dark:hover:text-[#62aef0] font-semibold text-[15px] mb-5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回首页
          </Link>
          <h1 className="text-3xl md:text-[40px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] leading-tight">
            订阅青年周刊
          </h1>
          <p className="mt-3 text-[#615d59] dark:text-[#a39e98]">
            每周一更新，不错过任何精彩内容
          </p>
        </div>

        {/* Subscription Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {/* Email Subscription（功能规划中） */}
          <div className="card card-hover p-7">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-[#f2f9ff] dark:bg-[rgba(0,117,222,0.15)] rounded-notion">
                <Mail className="w-5 h-5 text-[#0075de] dark:text-[#62aef0]" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                  邮件订阅
                </h2>
                <p className="text-sm text-[#615d59] dark:text-[#a39e98]">
                  每周一直接收送到邮箱
                </p>
              </div>
            </div>

            <div className="callout !bg-[rgba(0,117,222,0.06)] !border-[rgba(0,117,222,0.15)]">
              <p className="callout-content">
                邮件订阅功能正在规划中，敬请期待。期间可通过邮件联系我们，或在
                GitHub Issues 反馈：
              </p>
            </div>

            <a
              href={mailtoHref}
              className="mt-5 w-full btn-primary flex items-center justify-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>邮件联系编辑部</span>
            </a>

            <p className="mt-5 text-xs text-[#615d59] dark:text-[#a39e98] leading-relaxed">
              我们尊重您的隐私，不会分享您的邮箱地址。
            </p>
          </div>

          {/* RSS Subscription */}
          <div className="card card-hover p-7">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-[rgba(221,91,0,0.06)] dark:bg-[rgba(221,91,0,0.12)] rounded-notion">
                <Rss className="w-5 h-5 text-[#dd5b00]" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                  RSS 订阅
                </h2>
                <p className="text-sm text-[#615d59] dark:text-[#a39e98]">
                  使用 RSS 阅读器订阅
                </p>
              </div>
            </div>

            <div className="bg-[#f6f5f4] dark:bg-[rgba(255,255,255,0.06)] rounded-notion p-3.5 mb-5 border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
              <code className="text-sm text-[#615d59] dark:text-[#a39e98] break-all font-mono">
                {rssUrl}
              </code>
            </div>

            <button onClick={handleCopy} className="w-full btn-secondary">
              {copied ? (
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  已复制
                </span>
              ) : (
                '复制 RSS 地址'
              )}
            </button>

            <div className="mt-6 space-y-2.5">
              <p className="text-sm font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
                推荐的 RSS 阅读器：
              </p>
              <ul className="text-sm text-[#615d59] dark:text-[#a39e98] space-y-1.5">
                <li>
                  •{' '}
                  <a
                    href="https://feedly.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0075de] dark:hover:text-[#62aef0] transition-colors"
                  >
                    Feedly
                  </a>
                </li>
                <li>
                  •{' '}
                  <a
                    href="https://www.inoreader.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0075de] dark:hover:text-[#62aef0] transition-colors"
                  >
                    Inoreader
                  </a>
                </li>
                <li>
                  •{' '}
                  <a
                    href="https://reederapp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0075de] dark:hover:text-[#62aef0] transition-colors"
                  >
                    Reeder
                  </a>{' '}
                  (macOS/iOS)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Info Section — Callout Style */}
        <div className="callout">
          <span className="callout-icon">📬</span>
          <div className="callout-content">
            <p className="font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-3">
              订阅内容说明
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <span className="text-[#0075de] dark:text-[#62aef0]">✓</span>
                <span>每周一早上 8 点更新</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-[#0075de] dark:text-[#62aef0]">✓</span>
                <span>包含全部 8 个板块的内容</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-[#0075de] dark:text-[#62aef0]">✓</span>
                <span>可随时取消订阅</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-[#0075de] dark:text-[#62aef0]">✓</span>
                <span>无垃圾邮件，只有优质内容</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
