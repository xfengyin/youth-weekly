import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Share2 } from 'lucide-react'
import { getAllIssues, getIssueBySlug, renderMarkdown } from '../../lib/content'

export async function generateStaticParams() {
  const issues = getAllIssues()
  return issues.map((issue) => ({
    slug: String(issue.slug),
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const issue = getIssueBySlug(slug)

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

export default async function IssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const issue = getIssueBySlug(slug)

  if (!issue) {
    notFound()
  }

  const contentHtml = await renderMarkdown(issue.content || '')

  return (
    <div className="min-h-screen bg-white dark:bg-[#191919]">
      <div className="bg-[#f6f5f4] dark:bg-[#202020] border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <Link
            href="/issues/"
            className="inline-flex items-center text-[15px] font-semibold text-[#615d59] dark:text-[#a39e98] hover:text-[#0075de] dark:hover:text-[#62aef0] mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回周刊列表
          </Link>

          <div className="flex items-center space-x-3 text-sm text-[#a39e98] dark:text-[#615d59] mb-5">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{issue.date}</span>
            </div>
            <span>·</span>
            <span className="badge">
              第{issue.issue}期
            </span>
          </div>

          <h1 className="text-3xl md:text-[40px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-5 leading-tight">
            {issue.title}
          </h1>

          {issue.description && (
            <p className="text-lg text-[#615d59] dark:text-[#a39e98] leading-relaxed">
              {issue.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <article className="prose-custom">
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>

        <div className="callout mt-12">
          <span className="callout-icon">💡</span>
          <div className="callout-content">
            <p className="font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-1">
              喜欢这期内容？
            </p>
            <p>
              分享给朋友，或到{' '}
              <a
                href="https://github.com/xfengyin/youth-weekly/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0075de] dark:text-[#62aef0] hover:underline"
              >
                GitHub Issues
              </a>{' '}
              提交反馈和投稿。
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center justify-end">
            <Link
              href="https://github.com/xfengyin/youth-weekly/issues"
              target="_blank"
              className="text-sm text-[#615d59] dark:text-[#a39e98] hover:text-[#0075de] dark:hover:text-[#62aef0]"
            >
              有问题或建议？
            </Link>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <Link
            href="/issues/"
            className="text-[#0075de] dark:text-[#62aef0] hover:text-[#005bab] dark:hover:text-[#62aef0] font-semibold text-[15px]"
          >
            ← 查看所有周刊
          </Link>
          <Link
            href="/subscribe/"
            className="text-[#0075de] dark:text-[#62aef0] hover:text-[#005bab] dark:hover:text-[#62aef0] font-semibold text-[15px]"
          >
            订阅周刊 →
          </Link>
        </div>
      </div>
    </div>
  )
}
