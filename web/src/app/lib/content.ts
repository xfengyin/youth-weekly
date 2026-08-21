import fs from 'fs'
import path from 'path'

/**
 * ════════════════════════════════════════════════════════════════════════
 * 数据源：JSON 静态产物（唯一数据源）
 * ════════════════════════════════════════════════════════════════════════
 * 本模块不再直接读取 docs/*.md，而是消费 `youth-weekly generate`
 * （scripts/ 侧 OCP 管线）产出的 JSON：
 *   - web/public/issue_index.json   —— 已发布周刊索引（最新在前）
 *   - web/public/issue-<slug>.json  —— 单期全文（含 markdown content）
 *   - web/public/site-data.json     —— 站点元数据（site/author/categories/build）
 *   - web/public/search-data.json   —— 搜索索引（供 /search/ 客户端消费）
 *
 * 注意：构建（next build / 静态导出）前必须先运行 generate，产物缺失时
 * 本模块会快速失败并给出提示，避免“空数据静默上线”。本地开发：
 *   cd scripts && uv run youth-weekly generate
 */

/** 产物根目录：web/public（Next 静态导出会自动复制进 out/）；不存在返回 null */
function resolvePublicDir(): string | null {
  const publicDir = path.join(process.cwd(), 'public')
  return fs.existsSync(publicDir) ? publicDir : null
}

/** 读取 public 下的 JSON 产物；缺失/损坏时快速失败并给出可操作提示 */
function readJson<T>(fileName: string, options?: { optional?: boolean }): T | null {
  const publicDir = resolvePublicDir()
  if (!publicDir) {
    if (options?.optional) {
      return null // 单期产物缺失视为“不存在”→ 页面走 notFound()
    }
    throw new Error(
      `[content] public 目录不存在: ${publicDir}。` +
        `请在构建前运行 \`cd scripts && uv run youth-weekly generate\` 生成 JSON 产物。`,
    )
  }
  const fullPath = path.join(publicDir, fileName)
  if (!fs.existsSync(fullPath)) {
    if (options?.optional) {
      return null
    }
    throw new Error(
      `[content] 缺少 JSON 产物: ${fileName}（${fullPath}）。` +
        `请先运行 \`cd scripts && uv run youth-weekly generate\` 后再构建/开发。`,
    )
  }
  try {
    const raw = fs.readFileSync(fullPath, 'utf8')
    return JSON.parse(raw) as T
  } catch (err) {
    throw new Error(
      `[content] JSON 产物解析失败: ${fileName}（${(err as Error).message}）`,
    )
  }
}

// ── 类型（与 scripts 侧产物 schema 对齐）───────────────────────────────

/** 周刊索引条目（web/public/issue_index.json） */
export interface IssueIndexEntry {
  issue: number
  title: string
  date: string
  description?: string
  slug: string
  /**
   * 封面图相对路径（如 './assets/cover.png'，指向 docs/issues/<slug>/assets/）。
   * 属生成器（T-B）产物契约字段，docs 中确有封面文件；
   * 当前 Web UI 尚未渲染封面（静态导出未同步 docs 资产），保留字段供后续使用。
   */
  cover?: string
}

/** 单期周刊（web/public/issue-<slug>.json） */
export interface Issue {
  issue: number
  title: string
  date: string
  published: boolean
  /** 封面图相对路径；当前 UI 未渲染，保留（见 IssueIndexEntry.cover 说明） */
  cover?: string
  description?: string
  content?: string
  slug: string
}

/** 搜索索引条目（web/public/search-data.json） */
export interface SearchResult {
  issue: number
  title: string
  date: string
  slug: string
  excerpt: string
}

/** 站点分类（web/public/site-data.json -> categories） */
export interface Category {
  id: string
  name: string
  icon: string
  tagline?: string
}

/** 站点元数据（web/public/site-data.json） */
export interface SiteData {
  site: Record<string, unknown>
  author: Record<string, unknown>
  categories: Category[]
  build: Record<string, unknown>
}

// ── 读取函数（⚠️ 仅可在 Server Component / 构建期调用，依赖 fs）────────

/**
 * 获取所有已发布周刊（列表视图使用，不含正文 content）。
 * 数据源：web/public/issue_index.json（generate 已按 published 过滤、按期号倒序）。
 */
export function getAllIssues(): Issue[] {
  const entries = readJson<IssueIndexEntry[]>('issue_index.json')
  return (Array.isArray(entries) ? entries : []).map((entry) => ({
    issue: entry.issue,
    title: entry.title,
    date: entry.date,
    published: true, // 生成器只输出已发布条目
    cover: entry.cover ? String(entry.cover) : undefined,
    description: entry.description ? String(entry.description) : undefined,
    slug: entry.slug,
  }))
}

/**
 * 获取单期周刊全文。
 * 数据源：web/public/issue-<slug>.json（generate 只输出已发布期次）。
 * 入口先做白名单校验，防止路径遍历。
 */
export function getIssueBySlug(slug: string): Issue | null {
  // 防止路径遍历攻击（与旧 fs 实现一致）
  if (!/^\d+$/.test(slug)) return null

  // 单期产物按“可选”读取：缺失时返回 null，由页面走 notFound()；
  // 列表/站点级产物（issue_index/site-data）仍严格快速失败。
  const data = readJson<Issue | null>(`issue-${slug}.json`, { optional: true })
  if (!data || typeof data !== 'object') return null

  return {
    issue: Number(data.issue ?? parseInt(slug, 10)),
    title: String(data.title || `第${slug}期`),
    date: String(data.date || ''),
    published: data.published === true,
    cover: data.cover ? String(data.cover) : undefined,
    description: data.description ? String(data.description) : undefined,
    content: data.content ? String(data.content) : undefined,
    slug: String(data.slug || slug),
  }
}

/**
 * 获取搜索索引（与 /search/ 页客户端 fetch 的 search-data.json 同源）。
 */
export function getSearchIndex(): SearchResult[] {
  const data = readJson<SearchResult[]>('search-data.json')
  return Array.isArray(data) ? data : []
}

/**
 * 站点分类（唯一来源：site-data.json，由 config.yaml 生成）。
 */
export function getCategories(): Category[] {
  const siteData = readJson<Partial<SiteData>>('site-data.json')
  return siteData && Array.isArray(siteData.categories) ? siteData.categories : []
}

/**
 * 站点元数据（site/author/build 等，供页面 / 测试消费）。
 */
export function getSiteData(): SiteData {
  const siteData = readJson<SiteData>('site-data.json')
  if (!siteData) {
    throw new Error('[content] site-data.json 产物缺失或为空。')
  }
  return siteData
}
