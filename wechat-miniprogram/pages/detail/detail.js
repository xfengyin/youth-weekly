const { fetchIssue, sanitizeSlug } = require('../../utils/request')

Page({
  data: {
    issue: null,
    loading: true,
    notFound: false,
    content: '',
  },

  onLoad(options) {
    const slug = options && options.slug
    if (slug) {
      this.loadIssue(slug)
    } else {
      this.setData({ loading: false, notFound: true })
    }
  },

  /** 单期详情：真实数据来自 issue-<slug>.json（T-B 产物） */
  async loadIssue(slug) {
    this.setData({ loading: true })

    try {
      const safeSlug = sanitizeSlug(slug)
      if (!safeSlug) {
        this.setData({ loading: false, notFound: true })
        return
      }

      const issue = await fetchIssue(safeSlug)
      if (!issue) {
        this.setData({ loading: false, notFound: true })
        return
      }

      this.setData({
        issue,
        content: this.formatContent(issue.content || ''),
        loading: false,
      })

      wx.setNavigationBarTitle({
        title: issue.title || '青年周刊',
      })
    } catch (error) {
      console.error('加载失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none',
      })
      this.setData({ loading: false, notFound: true })
    }
  },

  /* ── Markdown → rich-text 安全渲染 ─────────────────────────────
   * 顺序很重要：先 HTML 转义，再做 markdown 变换。
   * 这样正文里任何 <script>、<img onerror=...> 等原始 HTML 都会
   * 先变成纯文本实体，不可能注入到 rich-text 节点属性中。
   * rich-text 本身不执行脚本，转义后连“渲染注入”也被消除。
   */
  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  },

  /** 行内处理：加粗 / 行内代码 / 链接去 URL / 图片去 URL */
  inline(text) {
    let s = text
      .replace(/\*\*(.+?)\*\*/g, '<text style="font-weight:bold">$1</text>')
      .replace(/`([^`]+)`/g, '<text style="font-family:monospace;background:#f3f4f6;padding:0 6rpx;border-radius:6rpx;">$1</text>')
      // 链接与图片只保留可见文本（不注入 href，避免外链跳转风险）；
      // 支持一层嵌套括号的 URL（如 javascript:alert(1)）
      .replace(/!\[([^\]]*)\]\(((?:[^()]|\([^()]*\))*)\)/g, '$1')
      .replace(/\[([^\]]+)\]\(((?:[^()]|\([^()]*\))*)\)/g, '$1')
    return s
  },

  formatContent(content) {
    const escaped = this.escapeHtml(content)
    const lines = escaped.split('\n')
    const blocks = []
    let codeLines = null // 非 null 表示在代码块内

    const pushParagraph = (text) => {
      const t = this.inline(text.trim())
      if (t) {
        blocks.push(`<view style="margin:16rpx 0;line-height:1.8;">${t}</view>`)
      }
    }

    lines.forEach((rawLine) => {
      const line = rawLine.replace(/\s+$/, '')

      // 代码块（``` 围栏）
      if (/^```/.test(line)) {
        if (codeLines === null) {
          codeLines = []
        } else {
          // 内容已在顶层 escapeHtml 中转义，直接拼接（勿再转义，避免 &lt; 变 &amp;lt;）
          const code = codeLines.join('\n')
          blocks.push(
            `<view style="background:#f3f4f6;border-radius:12rpx;padding:20rpx;margin:16rpx 0;font-family:monospace;font-size:24rpx;white-space:pre-wrap;">${code}</view>`
          )
          codeLines = null
        }
        return
      }
      if (codeLines !== null) {
        codeLines.push(line)
        return
      }

      // 标题
      let m = line.match(/^(#{1,6})\s+(.*)$/)
      if (m) {
        const level = Math.min(m[1].length, 6)
        const size = level <= 1 ? 36 : level === 2 ? 32 : 30
        blocks.push(
          `<view style="font-size:${size}rpx;font-weight:bold;margin:32rpx 0 16rpx 0;color:#0ea5e9;">${this.inline(m[2])}</view>`
        )
        return
      }

      // 引用（内容已先转义，> 已变为 &gt;，此处匹配转义后的形态）
      m = line.match(/^&gt;\s?(.*)$/)
      if (m) {
        blocks.push(
          `<view style="border-left:6rpx solid #0ea5e9;padding-left:20rpx;margin:16rpx 0;color:#6b7280;">${this.inline(m[1])}</view>`
        )
        return
      }

      // 分隔线（--- / ***）
      if (/^-{3,}$/.test(line) || /^\*{3,}$/.test(line)) {
        blocks.push(
          `<view style="height:2rpx;background:#e5e7eb;margin:24rpx 0;"></view>`
        )
        return
      }

      // 无序列表
      m = line.match(/^[-*]\s+(.*)$/)
      if (m) {
        blocks.push(
          `<view style="margin:12rpx 0;padding-left:30rpx;position:relative;line-height:1.7;">` +
            `<view style="position:absolute;left:0;top:14rpx;width:12rpx;height:12rpx;background:#0ea5e9;border-radius:50%;"></view>` +
            `${this.inline(m[1])}</view>`
        )
        return
      }

      // 有序列表（降级为普通文本行）
      m = line.match(/^\d+[.)]\s+(.*)$/)
      if (m) {
        blocks.push(
          `<view style="margin:12rpx 0;line-height:1.7;">${this.inline(m[1])}</view>`
        )
        return
      }

      // 表格分隔行（| --- |）与表格行：降级为普通文本
      if (/^\s*\|/.test(line)) {
        const cells = line.split('|').map((c) => c.trim())
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c) || c === '')) {
          blocks.push(
            `<view style="margin:12rpx 0;line-height:1.7;">${this.inline(line.replace(/^\s*\|\s*|\s*\|\s*$/g, ''))}</view>`
          )
        }
        return
      }

      // 空行：段落间距
      if (!line) {
        blocks.push('<view style="height:8rpx;"></view>')
        return
      }

      // 普通段落
      pushParagraph(line)
    })

    // 未闭合代码块：原样收尾（内容已转义，直接拼接）
    if (codeLines !== null) {
      blocks.push(
        `<view style="background:#f3f4f6;border-radius:12rpx;padding:20rpx;margin:16rpx 0;font-family:monospace;font-size:24rpx;white-space:pre-wrap;">${codeLines.join('\n')}</view>`
      )
    }

    return blocks.join('')
  },

  onShareAppMessage() {
    const { issue } = this.data
    return {
      title: issue ? issue.title : '青年周刊',
      path: issue
        ? `/pages/detail/detail?slug=${issue.slug}`
        : '/pages/index/index',
    }
  },
})
