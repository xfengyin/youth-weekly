'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Rss, Bell, CheckCircle, AlertCircle } from 'lucide-react'

export default function SubscribePage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 模拟订阅请求
    if (email && email.includes('@')) {
      setStatus('success')
      setMessage('订阅成功！感谢您的关注，我们会将最新周刊发送到您的邮箱。')
      setEmail('')
    } else {
      setStatus('error')
      setMessage('请输入有效的邮箱地址。')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            订阅青年周刊
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            每周一更新，不错过任何精彩内容
          </p>
        </div>

        {/* Subscription Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Email Subscription */}
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  邮件订阅
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  每周一直接收送到邮箱
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input"
              />
              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <Bell className="w-4 h-4" />
                <span>订阅</span>
              </button>
            </form>

            {status === 'success' && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{message}</p>
              </div>
            )}

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              我们尊重您的隐私，不会分享您的邮箱地址。您可以随时取消订阅。
            </p>
          </div>

          {/* RSS Subscription */}
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Rss className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  RSS 订阅
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  使用 RSS 阅读器订阅
                </p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4">
              <code className="text-sm text-gray-700 dark:text-gray-300 break-all">
                https://youth-weekly.github.io/rss.xml
              </code>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText('https://youth-weekly.github.io/rss.xml')
              }}
              className="w-full btn-secondary"
            >
              复制 RSS 地址
            </button>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                推荐的 RSS 阅读器：
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• <a href="https://feedly.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">Feedly</a></li>
                <li>• <a href="https://www.inoreader.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">Inoreader</a></li>
                <li>• <a href="https://reederapp.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">Reeder</a> (macOS/iOS)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="card p-6 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-900">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            订阅内容说明
          </h2>
          <ul className="space-y-3 text-gray-600 dark:text-gray-300">
            <li className="flex items-start space-x-2">
              <span className="text-primary-600 dark:text-primary-400">✓</span>
              <span>每周一早上 8 点更新</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary-600 dark:text-primary-400">✓</span>
              <span>包含全部 8 个板块的内容</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary-600 dark:text-primary-400">✓</span>
              <span>可随时取消订阅</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary-600 dark:text-primary-400">✓</span>
              <span>无垃圾邮件，只有优质内容</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
