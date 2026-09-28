/**
 * 分类装饰强调色（仅视觉，按分类 id 关联）。
 * 分类数据本身来自 site-data.json（config.yaml 生成），避免内容双份维护；
 * 这里只集中管理各分类的强调色，供分类页装饰线等使用。
 */

export const DEFAULT_CATEGORY_ACCENT = '#0075de'

export const CATEGORY_ACCENTS: Record<string, string> = {
  editorial: '#0075de',
  tech: '#2a9d99',
  anime: '#ff64c8',
  gaming: '#1aae39',
  stories: '#dd5b00',
  tools: '#615d59',
  watching: '#391c57',
  gallery: '#0075de',
  jobs: '#dd5b00',
}

export function categoryVisual(id: string): { accent: string } {
  return { accent: CATEGORY_ACCENTS[id] ?? DEFAULT_CATEGORY_ACCENT }
}
