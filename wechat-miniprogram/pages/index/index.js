const { fetchIssueIndex, fetchSiteData } = require('../../utils/request')

Page({
  data: {
    latestIssue: null,
    recentIssues: [],
    categories: [],
    loading: true,
  },

  onLoad() {
    this.loadData()
  },

  onPullDownRefresh() {
    // 兼容旧基础库：不用 Promise.prototype.finally
    this.loadData().then(
      () => wx.stopPullDownRefresh(),
      () => wx.stopPullDownRefresh()
    )
  },

  /** 并行加载：周刊索引 + 站点分类（均为 T-B JSON 产物） */
  async loadData() {
    this.setData({ loading: true })

    try {
      const [issues, siteData] = await Promise.all([
        fetchIssueIndex(),
        fetchSiteData(),
      ])

      const issueList = Array.isArray(issues) ? issues : []
      const categories = (siteData && Array.isArray(siteData.categories))
        ? siteData.categories
        : []

      this.setData({
        latestIssue: issueList[0] || null,
        recentIssues: issueList,
        categories,
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

  goToIssue(e) {
    const slug = e.currentTarget.dataset.slug
    if (!slug) return
    wx.navigateTo({
      url: `/pages/detail/detail?slug=${slug}`,
    })
  },

  goToAllIssues() {
    wx.switchTab({
      url: '/pages/list/list',
    })
  },

  onShareAppMessage() {
    const { latestIssue } = this.data
    return {
      title: latestIssue
        ? `${latestIssue.title} - 青年周刊`
        : '青年周刊 - 为年轻人打造的内容聚合周刊',
      path: latestIssue
        ? `/pages/detail/detail?slug=${latestIssue.slug}`
        : '/pages/index/index',
    }
  },
})
