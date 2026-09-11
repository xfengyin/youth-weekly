/**
 * 杂志化排版解析器
 *
 * 把每期 Markdown 正文解析成「封面 / 目次 / 栏目 / 文章」结构化数据，
 * 供 issues/[slug]/page.tsx 渲染成期刊版式（参考周刊少年Jump / 知音漫客 / 看天下）。
 *
 * 兼容策略：解析失败（sections 为空）时调用方回退到纯 Markdown 渲染。
 */

export interface MagazineArticle {
  /** 文章标题（栏目标题下 ### 后的第一行）；刊首语等无标题块为空串 */
  title: string
  /** 文章正文（Markdown 片段，不含标题/阅读原文/来源行） */
  body: string
  /** 「阅读原文」外链 */
  url?: string
  /** 来源（— via *Source*） */
  source?: string
}

export interface MagazineSection {
  /** 栏目名，如「科技新势力」 */
  name: string
  /** 栏目英文名（用于版面装饰），如 TECH */
  en: string
  /** 栏目主色 */
  color: string
  /** 栏目导语（> 引用行） */
  tagline?: string
  /** 栏目内的文章列表 */
  articles: MagazineArticle[]
  /** 是否为整段式栏目（如刊首语，无 ### 分篇） */
  editorial?: boolean
}

export interface MagazineIssue {
  title: string
  /** 期号信息行（> 2026-09-07 | 第17期 | 每周更新） */
  meta?: string
  sections: MagazineSection[]
}

/** 内置栏目 → 英文名 + 主色（未知栏目回退 FEATURE/墨黑） */
const SECTION_META: Array<{ key: string; en: string; color: string }> = [
  { key: '刊首语', en: "EDITOR'S NOTE", color: '#e60012' },
  { key: '科技新势力', en: 'TECH', color: '#1657a8' },
  { key: '二次元次元壁', en: 'ACG', color: '#c2185b' },
  { key: '游戏研究所', en: 'GAMES', color: '#1aae39' },
  { key: '青春故事会', en: 'STORIES', color: '#dd5b00' },
  { key: '好工具', en: 'TOOLS', color: '#0f766e' },
  { key: '在看什么', en: 'WATCHING', color: '#4f46e5' },
  { key: '一周图鉴', en: 'GALLERY', color: '#b45309' },
  { key: '谁在招人', en: 'HIRING', color: '#334155' },
]

export function sectionMeta(name: string): { en: string; color: string } {
  const key = name.trim()
  for (const item of SECTION_META) {
    if (key.includes(item.key)) return { en: item.en, color: item.color }
  }
  return { en: 'FEATURE', color: '#111111' }
}

/** 清理正文中的分隔线、多余空行 */
function stripDivider(text: string): string {
  return text
    .replace(/^---+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 解析单篇文章片段（### 之后的整块） */
function parseArticle(chunk: string): MagazineArticle | null {
  const c = chunk.replace(/^\s+/, '')
  if (!c.trim()) return null

  const nl = c.indexOf('\n')
  const title = (nl === -1 ? c : c.slice(0, nl)).trim()
  let body = nl === -1 ? '' : c.slice(nl + 1).trim()

  // 「阅读原文」链接
  let url: string | undefined
  const linkMatch = body.match(/\[阅读原文\]\((https?:\/\/[^)\s]+)\)/)
  if (linkMatch) {
    url = linkMatch[1]
    body = body.replace(linkMatch[0], '').trim()
  }

  // 来源：— via *Source*
  let source: string | undefined
  const srcMatch = body.match(/—\s*via\s*\*([^*]+)\*/)
  if (srcMatch) {
    source = srcMatch[1].trim()
    body = body.replace(srcMatch[0], '').trim()
  }

  body = stripDivider(body)
  if (!title && !body) return null
  return { title, body, url, source }
}

/**
 * 解析一期 Markdown → 杂志结构。
 * - `# 标题` → title
 * - 首个 `> ...` → meta
 * - `## 栏目` → section（跳过「本期目录」，由页面重新生成）
 * - 栏目内 `> ...` → tagline
 * - 栏目内 `### 标题` → article
 */
export function parseMagazine(content: string): MagazineIssue {
  const text = (content || '').replace(/\r\n/g, '\n').trim()
  const result: MagazineIssue = { title: '', sections: [] }
  if (!text) return result

  const h1 = text.match(/^#\s+(.+)$/m)
  if (h1) result.title = h1[1].trim()

  const bq = text.match(/^>\s*(.+)$/m)
  if (bq) result.meta = bq[1].trim()

  // 按二级标题切栏目（parts[0] 为标题 + meta + 目录前的杂项）
  const parts = text.split(/\n##\s+/)
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i]
    const nl = chunk.indexOf('\n')
    const name = (nl === -1 ? chunk : chunk.slice(0, nl)).trim()
    let body = nl === -1 ? '' : chunk.slice(nl + 1)
    if (!name) continue
    // 「本期目录」跳过：页面用解析后的 sections 生成杂志目次
    if (name.includes('目录')) continue

    const meta = sectionMeta(name)
    const section: MagazineSection = {
      name,
      en: meta.en,
      color: meta.color,
      articles: [],
    }

    // 栏目导语：正文开头的引用行
    const trimmedStart = body.replace(/^\s+/, '')
    if (trimmedStart.startsWith('>')) {
      const tag = trimmedStart.match(/^>\s*(.+)$/m)
      if (tag) {
        section.tagline = tag[1].trim()
        body = body.replace(/^\s*>\s*.+\s*$/m, '')
      }
    }

    const articleChunks = body.split(/\n###\s+/)
    if (articleChunks.length > 1) {
      // 首个 ### 之前的引言（若有效）并入首篇前言
      const lead = stripDivider(articleChunks[0])
      for (let j = 1; j < articleChunks.length; j++) {
        const article = parseArticle(articleChunks[j])
        if (article) section.articles.push(article)
      }
      if (lead && section.articles.length === 0) {
        section.articles.push({ title: '', body: lead })
      }
    } else {
      const only = stripDivider(articleChunks[0])
      if (only) {
        section.editorial = true
        section.articles.push({ title: '', body: only })
      }
    }

    // 无内容的空栏目也保留（渲染成「欢迎投稿」占位，保持杂志栏目完整）
    result.sections.push(section)
  }

  return result
}
