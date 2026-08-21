const { fetchIssueIndex } = require('../../utils/request')

Page({
  data: {
    issues: [],
    loading: true,
  },

  onLoad() {
    this.loadIssues()
  },

  onPullDownRefresh() {
    // 兼容旧基础库：不用 Promise.prototype.finally
    this.loadIssues().then(
      () => wx.stopPullDownRefresh(),
      () => wx.stopPullDownRefresh()
    )
  },

  /** 周刊列表：真实数据来自 issue_index.json（T-B 产物） */
  async loadIssues() {
    this.setData({ loading: true })

    try {
      const issues = await fetchIssueIndex()
      this.setData({
        issues: Array.isArray(issues) ? issues : [],
        loading: false,
      })
    } catch (error) {
      console.error('加载失败:', error)
      wx.showToast({
        title: '加载失败，请下拉重试',
        icon: 'none',
      })
      this.setData({ loading: false })
    }
  },

  goToDetail(e) {
    const slug = e.currentTarget.dataset.slug
    if (!slug) return
    wx.navigateTo({
      url: `/pages/detail/detail?slug=${slug}`,
    })
  },
})
