Page({
  data: {
    issue: null,
    loading: true,
    content: ''
  },

  onLoad(options) {
    const { slug } = options
    if (slug) {
      this.loadIssue(slug)
    }
  },

  async loadIssue(slug) {
    this.setData({ loading: true })
    
    try {
      // 模拟数据
      const mockIssue = {
        issue: 1,
        title: '青年周刊 · 创刊号',
        date: '2026-04-08',
        description: '欢迎来到青年周刊！这是一份为年轻人打造的内容聚合周刊...',
        slug: slug,
        content: `
## 刊首语

欢迎来到《青年周刊》！

这是一份专门为年轻人打造的内容聚合周刊。在这个信息爆炸的时代，我们希望成为你身边的一个可靠伙伴，帮你筛选有价值的内容，发现有趣的事物，记录成长的点滴。

## 科技新势力

### Cursor：AI驱动的代码编辑器

Cursor 是一款基于 VS Code 的 AI 代码编辑器，内置了 GPT-4 级别的代码补全和理解能力。

### Suno AI：用文本生成音乐

Suno AI 是一款革命性的 AI 音乐生成工具，只需要输入文字描述，就能生成完整的歌曲。

## 二次元次元壁

### 春季新番推荐

- 《葬送的芙莉莲》第二季
- 《我推的孩子》第二季

## 游戏研究所

### 《黑神话：悟空》最终预告

2026年最期待的国产 3A 大作《黑神话：悟空》发布了最终预告片。
        `.trim()
      }
      
      this.setData({
        issue: mockIssue,
        content: this.formatContent(mockIssue.content),
        loading: false
      })
      
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: mockIssue.title
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

  formatContent(content) {
    // 简单的 Markdown 格式转换
    return content
      .replace(/## (.*)/g, '<view style="font-size: 32rpx; font-weight: bold; margin: 40rpx 0 20rpx 0; color: #0ea5e9;">$1</view>')
      .replace(/### (.*)/g, '<view style="font-size: 30rpx; font-weight: 600; margin: 30rpx 0 16rpx 0;">$1</view>')
      .replace(/- (.*)/g, '<view style="margin: 12rpx 0; padding-left: 30rpx; position: relative;"><view style="position: absolute; left: 0; top: 12rpx; width: 12rpx; height: 12rpx; background: #0ea5e9; border-radius: 50%;"></view>$1</view>')
      .replace(/\n/g, '<view style="margin: 16rpx 0; line-height: 1.8;"></view>')
  },

  onShareAppMessage() {
    const { issue } = this.data
    return {
      title: issue ? issue.title : '青年周刊',
      path: `/pages/detail/detail?slug=${issue?.slug || ''}`
    }
  }
})
