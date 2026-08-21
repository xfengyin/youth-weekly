/**
 * 数据请求工具
 *
 * - wx.request 的 Promise 封装（含超时与 HTTP 状态校验）
 * - slug 白名单校验（^\\d+$），防止把任意输入拼进 URL
 * - 数据契约与 T-B 产物（web/public/*.json）保持一致
 */
const config = require('./config')

const SLUG_RE = /^\d+$/

/** 校验 slug；非法返回 null */
function sanitizeSlug(slug) {
  if (typeof slug !== 'string') return null
  return SLUG_RE.test(slug) ? slug : null
}

/** 通用 GET 请求（Promise 化） */
function get(path, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.baseUrl}/${path}`,
      method: 'GET',
      timeout: timeoutMs,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(`请求失败 (HTTP ${res.statusCode}): ${path}`))
        }
      },
      fail(err) {
        reject(new Error(`网络请求失败: ${path}（${err.errMsg || 'unknown'}）`))
      },
    })
  })
}

/** 获取周刊索引列表 */
function fetchIssueIndex() {
  return get(config.paths.issueIndex)
}

/** 获取站点元数据（categories 等） */
function fetchSiteData() {
  return get(config.paths.siteData)
}

/** 获取单期周刊；slug 非法返回 Promise<null> */
async function fetchIssue(slug) {
  const safe = sanitizeSlug(slug)
  if (!safe) return null
  return get(config.paths.issueDetail(safe))
}

module.exports = {
  get,
  sanitizeSlug,
  fetchIssueIndex,
  fetchSiteData,
  fetchIssue,
  config,
}
