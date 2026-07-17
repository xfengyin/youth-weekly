import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

/**
 * 文档根目录解析：
 * 1. 优先使用环境变量 DOCS_PATH（生产/CI 可通过该变量覆盖，避免对 process.cwd() 的硬编码依赖）。
 * 2. 兜底使用 `process.cwd()/../docs`（兼容本地开发环境与 `next export` 工作目录）。
 *
 * 若目录不存在，抛出明确错误，避免静默失败导致空数据。
 */
function resolveDocsDirectory(): string {
  const fallback = path.join(process.cwd(), '..', 'docs')
  const docsDirectory = process.env.DOCS_PATH
    ? path.resolve(process.env.DOCS_PATH)
    : fallback

  if (!fs.existsSync(docsDirectory)) {
    throw new Error(
      `[content] 文档目录不存在: ${docsDirectory}` +
        (process.env.DOCS_PATH
          ? `（来源：DOCS_PATH 环境变量）`
          : `（默认值，可通过设置 DOCS_PATH 环境变量覆盖）`),
    )
  }

  return docsDirectory
}

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
  const docsDirectory = resolveDocsDirectory()
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
      published: data.published === true,
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

  const docsDirectory = resolveDocsDirectory()
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
    published: data.published === true,
    cover: data.cover ? String(data.cover) : undefined,
    description: data.description ? String(data.description) : undefined,
    content: String(content),
    slug: String(slug),
  }
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
