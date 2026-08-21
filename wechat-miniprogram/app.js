const config = require('./utils/config')

App({
  onLaunch() {
    // 检查更新（基础库 >= 1.9.90）
    this.checkUpdate()
  },

  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(() => {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: (res) => {
                if (res.confirm) {
                  updateManager.applyUpdate()
                }
              },
            })
          })
        }
      })
    }
  },

  globalData: {
    baseUrl: config.baseUrl,
  },
})
