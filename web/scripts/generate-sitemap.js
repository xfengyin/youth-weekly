/**
 * sitemap.xml 生成脚本（构建前运行：npm run build 会先触发 prebuild）
 *
 * 基于 web/public/issue_index.json（T-B 产物，已发布期次）生成全站 sitemap，
 * 避免手工维护导致过期（此前 sitemap 停在 6 期，实际已有 12 期）。
 *
 * 用法：node scripts/generate-sitemap.js
 */
const fs = require('fs')
const path = require('path')

const BASE = 'https://xfengyin.github.io/youth-weekly'
const publicDir = path.join(__dirname, '..', 'public')
const indexFile = path.join(publicDir, 'issue_index.json')

function urlEntry(loc, changefreq, priority, lastmod) {
  const lines = ['  <url>', `    <loc>${BASE}${loc}</loc>`]
  if (lastmod) {
    lines.push(`    <lastmod>${lastmod}</lastmod>`)
  }
  lines.push(
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  )
  return lines.join('\n')
}

let issues = []
if (fs.existsSync(indexFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(indexFile, 'utf8'))
    if (Array.isArray(data)) issues = data
  } catch (err) {
    console.warn(`[sitemap] 解析 ${indexFile} 失败，仅生成静态页: ${err.message}`)
  }
} else {
  console.warn(`[sitemap] 缺少 ${indexFile}，仅生成静态页（请先运行 youth-weekly generate）`)
}

const staticUrls = [
  urlEntry('/', 'weekly', '1.0'),
  urlEntry('/issues/', 'weekly', '0.8'),
  urlEntry('/archive/', 'monthly', '0.6'),
  urlEntry('/categories/', 'monthly', '0.5'),
  urlEntry('/search/', 'monthly', '0.5'),
  urlEntry('/subscribe/', 'monthly', '0.6'),
]

const issueUrls = issues.map((issue) =>
  urlEntry(
    `/issues/${String(issue.slug)}/`,
    'never',
    '0.7',
    typeof issue.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(issue.date)
      ? issue.date
      : undefined,
  ),
)

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.concat(issueUrls).join('\n')}
</urlset>
`

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml)
console.log(
  `[sitemap] 已生成 web/public/sitemap.xml：共 ${staticUrls.length + issueUrls.length} 条 URL（含 ${issueUrls.length} 期）`,
)
