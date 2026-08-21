/**
 * 页面 metadata 测试
 *
 * 验证各静态页导出的 Metadata（title/description/canonical）已补齐，
 * 与 layout 的 title.template（%s - 青年周刊）配合后生成完整标题。
 * （动态页 issues/[slug] 的 generateMetadata 见其自身测试。）
 */

import * as issuesModule from '../issues/page'
import * as archiveModule from '../archive/page'
import * as categoriesModule from '../categories/page'
import * as searchModule from '../search/page'
import * as subscribeModule from '../subscribe/page'
import * as notFoundModule from '../not-found'

const CANONICALS: Record<string, string> = {
  issues: 'issues/',
  archive: 'archive/',
  categories: 'categories/',
  search: 'search/',
  subscribe: 'subscribe/',
}

describe('页面 metadata', () => {
  it.each([
    ['issues', issuesModule],
    ['archive', archiveModule],
    ['categories', categoriesModule],
    ['search', searchModule],
    ['subscribe', subscribeModule],
  ])('%s 页导出带 title/description/canonical 的 metadata', (_name, mod) => {
    const meta = (mod as unknown as { metadata: Record<string, unknown> }).metadata
    expect(meta).toBeDefined()
    expect(typeof meta.title).toBe('string')
    expect((meta.title as string).length).toBeGreaterThan(0)
    expect(typeof meta.description).toBe('string')
    const alternates = meta.alternates as { canonical: string } | undefined
    expect(alternates?.canonical).toBe(CANONICALS[_name])
  })

  it('not-found 页导出降级 title 与 description', () => {
    const meta = (notFoundModule as unknown as { metadata: Record<string, unknown> })
      .metadata
    expect(meta).toBeDefined()
    expect(meta.title).toBe('页面未找到')
    expect(typeof meta.description).toBe('string')
  })

  it('layout 提供 title.template 供子页统一追加后缀', async () => {
    const layout = await import('../layout')
    const metadata = (layout as unknown as { metadata: { title: unknown } }).metadata
    const title = metadata.title as { template?: string; default?: string }
    expect(title.template).toBe('%s - 青年周刊')
    expect(typeof title.default).toBe('string')
  })
})
