Page({
  data: {
    issues: [],
    loading: true,
    hasMore: false
  },

  onLoad() {
    this.loadIssues()
  },

  onPullDownRefresh() {
    this.loadIssues().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadIssues() {
    this.setData({ loading: true })
    
    try {
      // 模拟数据
      const mockIssues = [
        {
          issue: 1,
          title: '青年周刊 · 创刊号',
          date: '2026-04-08',
          description: '欢迎来到青年周刊！这是一份为年轻人打造的内容聚合周刊...',
          slug: '001'
        }
      ]
      
      this.setData({
        issues: mockIssues,
        loading: false,
        hasMore: false
      })
    } catch (error) {
      console.error('加载失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  goToDetail(e) {
    const slug = e.currentTarget.dataset.slug
    wx.navigateTo({
      url: `/pages/detail/detail?slug=${slug}`
    })
  }
})
