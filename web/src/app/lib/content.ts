import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import remarkGfm from 'remark-gfm'

const docsDirectory = path.join(process.cwd(), '..', '..', 'docs')

export interface Issue {
  issue: number
  title: string
  date: string
  published: boolean
  cover?: string
  description?: string
  content?: string
  slug: string
}

export interface SearchResult {
  issue: number
  title: string
  date: string
  slug: string
  excerpt: string
}

// 获取所有周刊
export function getAllIssues(): Issue[] {
  const issuesDirectory = path.join(docsDirectory, 'issues')
  
  if (!fs.existsSync(issuesDirectory)) {
    return []
  }

  const issueDirs = fs.readdirSync(issuesDirectory)
    .filter(dir => /^\d+$/.test(dir))
    .sort((a, b) => parseInt(b) - parseInt(a))

  const issues = issueDirs.map(dir => {
    const fullPath = path.join(issuesDirectory, dir, 'README.md')
    
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      issue: parseInt(dir),
      title: data.title || `第${dir}期`,
      date: data.date || '',
      published: data.published !== false,
      cover: data.cover,
      description: data.description,
      content: content,
      slug: dir,
    }
  }).filter((issue): issue is Issue => issue !== null && issue.published)

  return issues
}

// 获取单期周刊
export function getIssueBySlug(slug: string): Issue | null {
  const fullPath = path.join(docsDirectory, 'issues', slug, 'README.md')
  
  if (!fs.existsSync(fullPath)) {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  return {
    issue: parseInt(slug),
    title: data.title || `第${slug}期`,
    date: data.date || '',
    published: data.published !== false,
    cover: data.cover,
    description: data.description,
    content: content,
    slug,
  }
}

// 渲染 Markdown 为 HTML
export async function renderMarkdown(content: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(content)
  
  return result.toString()
}

// 获取搜索索引
export function getSearchIndex(): SearchResult[] {
  const issues = getAllIssues()
  
  return issues.map(issue => {
    const content = issue.content || ''
    // 提取前200个字符作为摘要
    const excerpt = content
      .replace(/#.*\n/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '$1')
      .slice(0, 200) + '...'

    return {
      issue: issue.issue,
      title: issue.title,
      date: issue.date,
      slug: issue.slug,
      excerpt,
    }
  })
}

// 分类数据
export const categories = [
  { id: 'editorial', name: '刊首语', icon: '📝' },
  { id: 'tech', name: '科技新势力', icon: '🚀' },
  { id: 'anime', name: '二次元次元壁', icon: '🎨' },
  { id: 'gaming', name: '游戏研究所', icon: '🎮' },
  { id: 'stories', name: '青春故事会', icon: '📖' },
  { id: 'tools', name: '好工具', icon: '🛠️' },
  { id: 'watching', name: '在看什么', icon: '👀' },
  { id: 'gallery', name: '一周图鉴', icon: '📷' },
  { id: 'jobs', name: '谁在招人', icon: '💼' },
]

// 生成 RSS
export function generateRSS(issues: Issue[]): string {
  const siteUrl = 'https://youth-weekly.github.io'
  
  const rssItems = issues.map(issue => `
    <item>
      <title>${issue.title}</title>
      <link>${siteUrl}/issues/${issue.slug}/</link>
      <pubDate>${new Date(issue.date).toUTCString()}</pubDate>
      <guid>${siteUrl}/issues/${issue.slug}/</guid>
      <description>${issue.description || ''}</description>
    </item>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>青年周刊</title>
    <link>${siteUrl}</link>
    <description>为年轻人打造的内容聚合周刊</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`
}
