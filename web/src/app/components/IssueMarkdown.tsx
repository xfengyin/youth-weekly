import { type ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { type TocItem } from '../lib/toc'

/**
 * Markdown 渲染安全基线不变：
 * 1. 默认不执行 dangerouslySetInnerHTML（react-markdown 转义），消除 XSS 注入面。
 * 2. 外链自动 target="_blank" rel="noopener noreferrer"。
 * 3. 正文 h1 降级为 h2，避免与页面级 h1 并存。
 */

type MarkdownLinkProps = ComponentPropsWithoutRef<'a'> & { node?: unknown }

/** 统一链接渲染：外链在新标签打开并阻断反向 tabnabbing */
function MarkdownLink({ node: _node, href, children, ...props }: MarkdownLinkProps) {
  const isExternal = typeof href === 'string' && /^https?:\/\//.test(href)
  return (
    <a
      href={href}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    >
      {children}
    </a>
  )
}

interface MarkdownRendererProps {
  content: string
  headingIds: Map<number, string>
}

function MarkdownRenderer({ content, headingIds }: MarkdownRendererProps) {
  const idFor = (node: unknown) => {
    const line = (node as { position?: { start?: { line?: number } } } | undefined)
      ?.position?.start?.line
    return typeof line === 'number' ? headingIds.get(line) : undefined
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: 'h2',
        h2: ({ node, children, ...props }) => (
          <h2 {...props} id={idFor(node)}>
            {children}
          </h2>
        ),
        h3: ({ node, children, ...props }) => (
          <h3 {...props} id={idFor(node)}>
            {children}
          </h3>
        ),
        a: MarkdownLink,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

/** 文章正文：轻量 Markdown（仅段落/加粗/链接/列表/引用），统一外链安全行为 */
export function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: MarkdownLink,
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}

interface MarkdownFallbackProps {
  content: string
  headingIds: Map<number, string>
  toc: TocItem[]
}

/** 回退：无法解析成栏目时，按传统 Markdown 阅读页渲染 */
export function MarkdownFallback({ content, headingIds, toc }: MarkdownFallbackProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <article className="prose-custom">
        <MarkdownRenderer content={content} headingIds={headingIds} />
      </article>
      {toc.length > 0 && (
        <details className="mt-10 border border-black/15 dark:border-white/15 bg-white dark:bg-[#1b1a18] px-5 py-4">
          <summary className="cursor-pointer font-bold">本期目录</summary>
          <nav aria-label="本期目录" className="mt-3 space-y-2">
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block text-sm hover:text-[#0075de] transition-colors ${
                  item.level === 3 ? 'pl-4 text-[#615d59] dark:text-[#a39e98]' : 'font-semibold'
                }`}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </details>
      )}
    </section>
  )
}
