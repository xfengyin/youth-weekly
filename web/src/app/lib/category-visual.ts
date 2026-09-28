/**
 * 分类装饰视觉映射（仅视觉，按分类 id 关联）。
 * 分类数据本身来自 site-data.json（config.yaml 生成），避免内容双份维护；
 * 这里只集中管理各分类的强调色与渐变，供首页与分类页共用。
 */

export interface CategoryVisual {
  /** 单色强调（分类页分割线等） */
  accent: string
  /** 渐变起止（首页图标卡，Tailwind 渐变工具类片段） */
  gradient: string
}

export const DEFAULT_CATEGORY_VISUAL: CategoryVisual = {
  accent: '#0075de',
  gradient: 'from-[#0075de] to-[#62aef0]',
}

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  editorial: { accent: '#0075de', gradient: 'from-[#0075de] to-[#62aef0]' },
  tech: { accent: '#2a9d99', gradient: 'from-[#2a9d99] to-[#62aef0]' },
  anime: { accent: '#ff64c8', gradient: 'from-[#ff64c8] to-[#b78cf5]' },
  gaming: { accent: '#1aae39', gradient: 'from-[#1aae39] to-[#62ef8c]' },
  stories: { accent: '#dd5b00', gradient: 'from-[#dd5b00] to-[#ffb25e]' },
  tools: { accent: '#615d59', gradient: 'from-[#615d59] to-[#a39e98]' },
  watching: { accent: '#391c57', gradient: 'from-[#391c57] to-[#8b5cf6]' },
  gallery: { accent: '#0075de', gradient: 'from-[#0075de] to-[#2a9d99]' },
  jobs: { accent: '#dd5b00', gradient: 'from-[#dd5b00] to-[#eb5757]' },
}

export function categoryVisual(id: string): CategoryVisual {
  return CATEGORY_VISUALS[id] ?? DEFAULT_CATEGORY_VISUAL
}
