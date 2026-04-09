# 青年周刊 微信小程序

> 青年周刊微信小程序端，支持阅读周刊内容

## 功能

- 📰 首页展示最新周刊
- 📋 周刊列表页
- 📖 文章详情阅读页
- 🔄 下拉刷新
- 📤 分享功能

## 开发

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目目录 `wechat-miniprogram/`
3. 开始开发

## 项目结构

```
wechat-miniprogram/
├── pages/
│   ├── index/          # 首页（最新周刊）
│   ├── list/           # 周刊列表
│   └── detail/         # 文章详情
├── components/         # 公共组件
├── utils/              # 工具函数
├── app.js              # 小程序入口
├── app.json            # 小程序配置
├── app.wxss            # 全局样式
└── sitemap.json        # 站点地图
```

## 配置

在 `app.json` 中修改服务器地址：

```json
{
  "baseUrl": "https://xfengyin.github.io/youth-weekly"
}
```
