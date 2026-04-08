const app = getApp()

Page({
  data: {
    latestIssue: null,
    recentIssues: [],
    categories: [
      { id: 'tech', name: '科技', icon: '🚀' },
      { id: 'anime', name: '二次元', icon: '🎨' },
      { id: 'gaming', name: '游戏', icon: '🎮' },
      { id: 'stories', name: '故事', icon: '📖' },
      { id: 'tools', name: '工具', icon: '🛠️' },
      { id: 'watching', name: '在看', icon: '👀' },
    ],
    loading: true
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
      // 这里应该从服务器获取数据
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
        latestIssue: mockIssues[0],
        recentIssues: mockIssues,
        loading: false
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

  goToIssue(e) {
    const slug = e.currentTarget.dataset.slug
    wx.navigateTo({
      url: `/pages/detail/detail?slug=${slug}`
    })
  },

  goToAllIssues() {
    wx.switchTab({
      url: '/pages/list/list'
    })
  },

  onShareAppMessage() {
    return {
      title: '青年周刊 - 为年轻人打造的内容聚合周刊',
      path: '/pages/index/index'
    }
  }
})
