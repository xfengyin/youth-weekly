/**
 * 阅读体验工具：目录提取 / 阅读时长估算 / 封面 URL
 */

/** 目录项（取自 markdown 的 ## / ### 标题） */
export interface TocItem {
  level: number // 2 | 3
  text: string
  id: string
  /** 在源 markdown 中的行号（1 起），用于 react-markdown 组件按 node.position 映射锚点 */
  line: number
}

/** 从标题文本生成稳定锚点 id（按出现顺序编号，避免中英文 slug 算法不一致） */
export function headingId(index: number): string {
  return `section-${index + 1}`
}

/** 清洗标题文本（去掉行内 markdown 记号，供目录显示） */
export function cleanHeadingText(raw: string): string {
  return raw
    .replace(/[*_`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .trim()
}

/**
 * 从 markdown 正文提取 ## / ### 标题（带行号）。
 * 与 MarkdownRenderer 中自定义 h2/h3 组件按 node.position.start.line 匹配。
 */
export function extractToc(content: string): TocItem[] {
  const items: TocItem[] = []
  let index = 0
  const lines = String(content || '').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{2,3})\s+(.+)$/)
    if (m) {
      items.push({
        level: m[1].length,
        text: cleanHeadingText(m[2]),
        id: headingId(index),
        line: i + 1,
      })
      index++
    }
  }
  return items
}

/** 行号 → TocItem 映射（渲染时按 node.position 查锚点 id） */
export function tocByLine(content: string): Map<number, TocItem> {
  const map = new Map<number, TocItem>()
  for (const item of extractToc(content)) {
    map.set(item.line, item)
  }
  return map
}

/**
 * 阅读时长估算（中文按字符数：约 400 字/分钟，下限 1 分钟）。
 * 先去掉 markdown 记号，避免把语法字符算进阅读量。
 */
export function readingTimeMinutes(content: string): number {
  const text = String(content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`\-|]/g, ' ')
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
  const latinWords = (text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ').match(/[A-Za-z0-9]+/g) || [])
    .length
  const total = cjk + latinWords
  return Math.max(1, Math.round(total / 400))
}

/** 封面图 URL（basePath 前缀 + 固定 assets 路径） */
export function coverUrl(slug: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/issues/${slug}/assets/cover.png`
}
