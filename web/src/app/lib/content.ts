import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import remarkGfm from 'remark-gfm'
import DOMPurify from 'isomorphic-dompurify'

const docsDirectory = path.join(process.cwd(), '..', 'docs')

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
/**
 * ⚠️ 仅可在 Server Component 中使用（依赖 fs 模块）
 * 不可在客户端组件或浏览器环境中调用
 */
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

    const issue: Issue = {
      issue: parseInt(dir),
      title: String(data.title || `第${dir}期`),
      date: String(data.date || ''),
      published: data.published !== false,
      cover: data.cover ? String(data.cover) : undefined,
      description: data.description ? String(data.description) : undefined,
      content: String(content),
      slug: String(dir),
    }
    return issue
  }).filter((issue): issue is Issue => issue !== null && issue.published)

  return issues
}

// 获取单期周刊
/**
 * ⚠️ 仅可在 Server Component 中使用（依赖 fs 模块）
 * 不可在客户端组件或浏览器环境中调用
 */
export function getIssueBySlug(slug: string): Issue | null {
  // 防止路径遍历攻击
  if (!/^\d+$/.test(slug)) return null

  const fullPath = path.join(docsDirectory, 'issues', slug, 'README.md')
  
  if (!fs.existsSync(fullPath)) {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  return {
    issue: parseInt(slug),
    title: String(data.title || `第${slug}期`),
    date: String(data.date || ''),
    published: data.published !== false,
    cover: data.cover ? String(data.cover) : undefined,
    description: data.description ? String(data.description) : undefined,
    content: String(content),
    slug: String(slug),
  }
}

// 渲染 Markdown 为 HTML（带 XSS 防护）
export async function renderMarkdown(content: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(content)
  
  const rawHtml = result.toString()
  
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'strong', 'em', 'del', 's',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'figure', 'figcaption',
      'span', 'div',
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'class', 'className',
      'align',
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORCE_BODY: false,
  })
}

// 获取搜索索引
/**
 * ⚠️ 仅可在 Server Component 中使用（依赖 fs 模块）
 * 不可在客户端组件或浏览器环境中调用
 */
export function getSearchIndex(): SearchResult[] {
  const issues = getAllIssues()

  return issues.map(issue => {
    const content = issue.content || ''
    // 提取前200个字符作为摘要
    const excerpt = content
      .replace(/#.*\n/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
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

// ⚠️ RSS 生成已迁移至 Python 端 (scripts/generate_rss.py)
// 使用 feedgen 确保正确的 XML 转义，避免注入风险
// 此函数保留仅供内部 API route 使用，如需 RSS 请运行 generate_rss.py
