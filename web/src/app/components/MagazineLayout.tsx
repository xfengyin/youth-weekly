import { type MagazineArticle, type MagazineSection } from '../lib/magazine'
import { ArticleBody } from './IssueMarkdown'

/** 文章卡片 */
function ArticleCard({
  article,
  accent,
}: {
  article: MagazineArticle
  accent: string
}) {
  return (
    <article className="group relative flex flex-col bg-white dark:bg-[#1b1a18] border border-black/10 dark:border-white/10 p-5 md:p-6 shadow-[4px_4px_0_rgba(0,0,0,0.06)] dark:shadow-[4px_4px_0_rgba(255,255,255,0.04)] transition-transform duration-200 hover:-translate-y-0.5">
      <span className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: accent }} aria-hidden="true" />
      {article.title && (
        <h3 className="text-lg md:text-xl font-bold leading-snug text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-3">
          {article.title}
        </h3>
      )}
      {article.body && (
        <div className="mag-article-body prose-mag text-[15px] leading-[1.85] text-[#3f3b37] dark:text-[#c9c4bd]">
          <ArticleBody markdown={article.body} />
        </div>
      )}
      {(article.source || article.url) && (
        <footer className="mt-auto pt-4 flex items-center justify-between gap-3">
          <span className="text-[11px] tracking-wide uppercase font-semibold text-[#8d8781] dark:text-[#8d8781]">
            {article.source ? `via ${article.source}` : ''}
          </span>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[13px] font-bold whitespace-nowrap transition-opacity hover:opacity-70"
              style={{ color: accent }}
            >
              阅读原文 →
            </a>
          )}
        </footer>
      )}
    </article>
  )
}

/** 空栏目占位（保留杂志栏目完整性） */
function EmptySection({ accent }: { accent: string }) {
  return (
    <div className="border-2 border-dashed border-black/15 dark:border-white/15 px-6 py-10 text-center">
      <p className="text-sm text-[#8d8781]">本期该栏目暂无精选内容</p>
      <a
        href="https://github.com/xfengyin/youth-weekly/issues"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm font-bold hover:underline"
        style={{ color: accent }}
      >
        欢迎投稿推荐 →
      </a>
    </div>
  )
}

/** 单个栏目的杂志版块 */
function MagazineSectionBlock({
  section,
  index,
}: {
  section: MagazineSection
  index: number
}) {
  const accent = section.color
  return (
    <section
      id={`section-${index + 1}`}
      className="scroll-mt-24 border-t-2 border-black/85 dark:border-white/80"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        {/* 栏目标题：大号序号 + 英文栏目名 + 中文栏目名 + 导语 */}
        <header className="mb-8 flex items-start gap-4 md:gap-6">
          <div
            className="font-black leading-[0.8] tracking-tighter tabular-nums select-none text-[56px] md:text-[72px]"
            style={{ color: accent }}
            aria-hidden="true"
          >
            {String(index + 1).padStart(2, '0')}
          </div>
          <div className="pt-1 min-w-0">
            <div
              className="text-[11px] font-black uppercase tracking-[0.28em]"
              style={{ color: accent }}
            >
              {section.en}
            </div>
            <h2 className="mt-0.5 text-2xl md:text-4xl font-black tracking-tight text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
              {section.name}
            </h2>
            {section.tagline && (
              <p className="mt-2 text-sm md:text-[15px] text-[#615d59] dark:text-[#a39e98]">
                {section.tagline}
              </p>
            )}
          </div>
        </header>

        {section.editorial ? (
          <div className="max-w-3xl">
            {section.articles.map((article, i) => (
              <div
                key={i}
                className="mag-dropcap prose-mag text-[17px] md:text-lg leading-[1.95] text-[#3f3b37] dark:text-[#c9c4bd]"
              >
                <ArticleBody markdown={article.body} />
              </div>
            ))}
          </div>
        ) : section.articles.length > 0 ? (
          <div className="grid gap-5 md:gap-6 md:grid-cols-2">
            {section.articles.map((article, i) => (
              <ArticleCard key={i} article={article} accent={accent} />
            ))}
          </div>
        ) : (
          <EmptySection accent={accent} />
        )}
      </div>
    </section>
  )
}

/** 杂志版式：目次 + 栏目正文 */
export default function MagazineLayout({ sections }: { sections: MagazineSection[] }) {
  return (
    <>
      {/* ── 目次 ── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-end justify-between border-b-4 border-black dark:border-white pb-3 mb-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-[0.18em] text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)]">
            目 次
          </h2>
          <span className="text-[11px] font-black uppercase tracking-[0.34em] text-[#8d8781]">
            Contents
          </span>
        </div>
        <ol className="grid gap-x-12 sm:grid-cols-2">
          {sections.map((section, i) => (
            <li key={`${section.name}-${i}`}>
              <a
                href={`#section-${i + 1}`}
                className="group flex items-baseline gap-3 py-2.5"
              >
                <span
                  className="text-lg font-black tabular-nums"
                  style={{ color: section.color }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[16px] font-bold text-[rgba(0,0,0,0.92)] dark:text-[rgba(255,255,255,0.92)] group-hover:underline">
                  {section.name}
                </span>
                <span className="mag-leader flex-1 translate-y-[-3px]" aria-hidden="true" />
                <span className="text-[12px] font-semibold tabular-nums text-[#a39e98]">
                  {String(i * 4 + 3).padStart(3, '0')}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 栏目正文 ── */}
      {sections.map((section, i) => (
        <MagazineSectionBlock key={`${section.name}-${i}`} section={section} index={i} />
      ))}
    </>
  )
}
