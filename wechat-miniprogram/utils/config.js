/**
 * 小程序全局配置
 *
 * 数据源：GitHub Pages 静态站（与 Web 前端共用 T-B 生成的 JSON 产物）：
 *   - /issue_index.json      周刊索引（最新在前，仅已发布）
 *   - /issue-<slug>.json     单期全文（markdown content）
 *   - /site-data.json        站点元数据（categories 等）
 *
 * ⚠️ 部署前需在微信公众平台「开发管理 → 服务器域名 → request 合法域名」中
 * 添加该域名（HTTPS），否则 wx.request 会被拦截（开发工具可勾选
 * “不校验合法域名”调试）。
 */
module.exports = {
  baseUrl: 'https://xfengyin.github.io/youth-weekly',
  // 数据文件路由（相对 baseUrl）
  paths: {
    issueIndex: 'issue_index.json',
    siteData: 'site-data.json',
    issueDetail: (slug) => `issue-${slug}.json`,
  },
}
