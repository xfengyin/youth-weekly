/**
 * lib/toc.ts 单元测试：目录提取 / 阅读时长 / 封面 URL
 */
import { extractToc, cleanHeadingText, readingTimeMinutes, coverUrl } from '../toc'

describe('extractToc', () => {
  it('提取 ## / ### 标题并生成稳定锚点 id 与行号', () => {
    const md = '# 刊首语\n\n## 科技新势力\n\n### Cursor\n\n正文\n\n## 游戏研究所\n'
    const toc = extractToc(md)

    expect(toc).toHaveLength(3)
    expect(toc[0]).toMatchObject({ level: 2, text: '科技新势力', id: 'section-1', line: 3 })
    expect(toc[1]).toMatchObject({ level: 3, text: 'Cursor', id: 'section-2', line: 5 })
    expect(toc[2]).toMatchObject({ level: 2, text: '游戏研究所', id: 'section-3', line: 9 })
  })

  it('清洗标题中的行内 markdown 记号', () => {
    const toc = extractToc('## 科技**新势力**与 `AI`\n')
    expect(toc[0].text).toBe('科技新势力与 AI')
  })

  it('忽略 # 一级标题与无标题内容', () => {
    const toc = extractToc('# 页级标题\n\n普通段落\n- 列表\n')
    expect(toc).toHaveLength(0)
  })

  it('空内容返回空数组', () => {
    expect(extractToc('')).toEqual([])
  })
})

describe('cleanHeadingText', () => {
  it('去除加粗/代码/链接记号', () => {
    expect(cleanHeadingText('**加粗** `code` [链接](https://a.com)')).toBe('加粗 code 链接')
  })
})

describe('readingTimeMinutes', () => {
  it('按约 400 字/分钟估算中文阅读时长', () => {
    const chinese = '好'.repeat(800)
    expect(readingTimeMinutes(chinese)).toBe(2)
  })

  it('忽略 markdown 记号不纳入字数', () => {
    const md = '## 标题\n\n' + '好'.repeat(200) + '\n\n- 列表项\n'
    const minutes = readingTimeMinutes(md)
    expect(minutes).toBeGreaterThanOrEqual(1)
    expect(minutes).toBeLessThanOrEqual(2)
  })

  it('下限为 1 分钟', () => {
    expect(readingTimeMinutes('一句话')).toBe(1)
    expect(readingTimeMinutes('')).toBe(1)
  })
})

describe('coverUrl', () => {
  it('拼接 basePath + 固定 assets 路径', () => {
    // jest 环境下 NEXT_PUBLIC_BASE_PATH 未注入 → 空前缀
    expect(coverUrl('001')).toBe('/issues/001/assets/cover.png')
  })
})
