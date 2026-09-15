import { notFound } from 'next/navigation'
import { getAllIssues, getIssueBySlug, type Issue } from '../../lib/content'
import { readingTimeMinutes, coverUrl } from '../../lib/toc'
import { parseMagazine } from '../../lib/magazine'
import IssueShell from '../../components/IssueShell'
import MagazineLayout from '../../components/MagazineLayout'
import { MarkdownFallback } from '../../components/IssueMarkdown'

/**
 * 杂志化阅读页（参考《周刊少年Jump》《知音漫客》《看天下》版式）：
 * - 封面：刊头（masthead）+ 期号/日期/定价条 + 封面图 + 封面故事 + 本期看点
 * - 目次：点线引导的 CONTENTS 目录
 * - 栏目：大号栏目序号 + 英文栏目名 + 栏目色带 + 文章卡片网格
 * - 刊首语：首字下沉的社论版式
 * - 兼容：无法解析成栏目的内容自动回退为纯 Markdown 渲染
 *
 * 本文件只负责数据获取与组装，版式渲染见 components/。
 */

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
    title: issue.title,
    description: issue.description,
    alternates: { canonical: `issues/${issue.slug}/` },
    openGraph: {
      title: issue.title,
      description: issue.description,
      type: 'article',
      publishedTime: issue.date,
      images: [{ url: `issues/${issue.slug}/assets/cover.png`, width: 1200, height: 630, alt: issue.title }],
    },
  }
}

export default async function IssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const issue = getIssueBySlug(slug)

  if (!issue) {
    notFound()
  }

  const content = issue.content || ''
  const magazine = parseMagazine(content)
  const hasMagazine = magazine.sections.length > 0

  // 目录/锚点数据随杂志解析一次产出，避免对同一份 Markdown 二次解析
  const toc = magazine.toc
  const headingIds = new Map(toc.map((item) => [item.line, item.id]))
  const minutes = readingTimeMinutes(content)
  const cover = coverUrl(issue.slug)

  const issues = getAllIssues()
  const index = issues.findIndex((i) => i.slug === issue.slug)
  const newer: Issue | undefined = index > 0 ? issues[index - 1] : undefined
  const older: Issue | undefined = index >= 0 ? issues[index + 1] : undefined

  // 本期看点：取前 4 个栏目名
  const highlights = magazine.sections
    .filter((s) => !s.editorial)
    .slice(0, 4)
    .map((s) => s.name)

  return (
    <IssueShell
      issue={issue}
      minutes={minutes}
      cover={cover}
      highlights={highlights}
      older={older}
      newer={newer}
    >
      {hasMagazine ? (
        <MagazineLayout sections={magazine.sections} />
      ) : (
        /* 回退：无法解析成栏目时，按传统 Markdown 阅读页渲染 */
        <MarkdownFallback content={content} headingIds={headingIds} toc={toc} />
      )}
    </IssueShell>
  )
}
