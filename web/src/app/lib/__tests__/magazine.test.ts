/**
 * magazine.ts 杂志解析器单元测试
 *
 * 覆盖:
 * 1. 标题 / meta 提取
 * 2. 栏目切分（跳过「本期目录」）
 * 3. 栏目导语（> 引用）
 * 4. 文章解析：标题 / 正文 / 阅读原文 / 来源
 * 5. 刊首语整段式栏目（无 ###）
 * 6. 空栏目保留
 * 7. 空内容 / 无栏目时 sections 为空（页面回退 Markdown）
 */

import { parseMagazine, sectionMeta } from '../magazine'

const SAMPLE = `# 青年周刊 · 第 17 期

> 2026-09-07 | 第17期 | 每周更新

---

## 本期目录

1. [刊首语](#刊首语)
2. [科技新势力](#科技新势力)

---

## 刊首语

**欢迎来到《青年周刊》第 17 期！**

阅读愉快！

---

## 科技新势力

> AI 工具、编程技巧、效率软件、前沿技术

### 某个科技标题

这是摘要正文，支持 **加粗**。

[阅读原文](https://example.com/a)

— via *TechCrunch*

---

### 第二个标题

第二篇摘要。

[阅读原文](https://example.com/b)

— via *The Verge*

---

## 游戏研究所

> 游戏评测、攻略心得、行业动态

本期该板块暂无精选内容,欢迎通过 GitHub Issues 投稿推荐。
`

describe('parseMagazine', () => {
  it('提取标题与期号 meta', () => {
    const m = parseMagazine(SAMPLE)
    expect(m.title).toBe('青年周刊 · 第 17 期')
    expect(m.meta).toBe('2026-09-07 | 第17期 | 每周更新')
  })

  it('跳过「本期目录」，保留其余栏目', () => {
    const m = parseMagazine(SAMPLE)
    const names = m.sections.map((s) => s.name)
    expect(names).not.toContain('本期目录')
    expect(names).toEqual(['刊首语', '科技新势力', '游戏研究所'])
  })

  it('提取栏目导语', () => {
    const m = parseMagazine(SAMPLE)
    const tech = m.sections.find((s) => s.name === '科技新势力')
    expect(tech?.tagline).toBe('AI 工具、编程技巧、效率软件、前沿技术')
  })

  it('解析文章标题/正文/阅读原文/来源', () => {
    const m = parseMagazine(SAMPLE)
    const tech = m.sections.find((s) => s.name === '科技新势力')!
    expect(tech.articles).toHaveLength(2)

    const first = tech.articles[0]
    expect(first.title).toBe('某个科技标题')
    expect(first.url).toBe('https://example.com/a')
    expect(first.source).toBe('TechCrunch')
    expect(first.body).toContain('这是摘要正文')
    expect(first.body).not.toContain('阅读原文')
    expect(first.body).not.toContain('— via')

    const second = tech.articles[1]
    expect(second.title).toBe('第二个标题')
    expect(second.url).toBe('https://example.com/b')
    expect(second.source).toBe('The Verge')
  })

  it('刊首语识别为整段式栏目（editorial）', () => {
    const m = parseMagazine(SAMPLE)
    const note = m.sections.find((s) => s.name === '刊首语')!
    expect(note.editorial).toBe(true)
    expect(note.articles).toHaveLength(1)
    expect(note.articles[0].body).toContain('欢迎来到')
  })

  it('空栏目被保留（用于占位渲染）', () => {
    const m = parseMagazine(SAMPLE)
    const games = m.sections.find((s) => s.name === '游戏研究所')!
    expect(games.articles).toHaveLength(1)
  })

  it('无栏目内容返回空 sections（页面回退 Markdown）', () => {
    const m = parseMagazine('# 只有标题\n\n一段普通正文。')
    expect(m.sections).toHaveLength(0)
    expect(m.title).toBe('只有标题')
  })

  it('空内容安全返回', () => {
    expect(parseMagazine('')).toEqual({ title: '', sections: [] })
    expect(parseMagazine(undefined as unknown as string)).toEqual({ title: '', sections: [] })
  })
})

describe('sectionMeta', () => {
  it('已知栏目返回英文名与配色', () => {
    expect(sectionMeta('科技新势力').en).toBe('TECH')
    expect(sectionMeta('刊首语').color).toBe('#e60012')
  })

  it('未知栏目回退 FEATURE', () => {
    expect(sectionMeta('随机栏目').en).toBe('FEATURE')
  })
})
