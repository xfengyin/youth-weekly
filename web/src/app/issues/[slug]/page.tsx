import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Share2 } from 'lucide-react'
import { getAllIssues, getIssueBySlug, renderMarkdown } from '../../lib/content'

interface Props {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const issues = getAllIssues()
  return issues.map((issue) => ({
    slug: issue.slug,
  }))
}

export async function generateMetadata({ params }: Props) {
  const issue = getIssueBySlug(params.slug)
  
  if (!issue) {
    return {
      title: '周刊未找到',
    }
  }

  return {
    title: `${issue.title} | 青年周刊`,
    description: issue.description,
  }
}

export default async function IssuePage({ params }: Props) {
  const issue = getIssueBySlug(params.slug)

  if (!issue) {
    notFound()
  }

  const contentHtml = await renderMarkdown(issue.content || '')

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/issues/"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回周刊列表
          </Link>

          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{issue.date}</span>
            </div>
            <span>·</span>
            <span>第{issue.issue}期</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {issue.title}
          </h1>

          {issue.description && (
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {issue.description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose-custom">
          <div
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </article>

        {/* Share Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                分享本期：
              </span>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: issue.title,
                      url: window.location.href,
                    })
                  }
                }}
                className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            <Link
              href="https://github.com/your-username/youth-weekly/issues"
              target="_blank"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              有问题或建议？
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Link
            href="/issues/"
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            ← 查看所有周刊
          </Link>
          <Link
            href="/subscribe/"
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            订阅周刊 →
          </Link>
        </div>
      </div>
    </div>
  )
}
