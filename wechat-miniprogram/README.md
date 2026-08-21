# 青年周刊 微信小程序

> 青年周刊微信小程序端：接入 GitHub Pages 静态站的真实 JSON 数据（与 Web 前端同源）

## 功能

- 📰 首页：最新一期 + 分类（来自 `site-data.json`）
- 📋 周刊列表（来自 `issue_index.json`）
- 📖 文章详情（来自 `issue-<slug>.json`，Markdown 安全渲染）
- 🔄 下拉刷新
- 📤 分享功能

## 数据源

小程序不依赖后端 API，直接读取 GitHub Pages 上由 `youth-weekly generate`
（T-B 管线）产出的静态 JSON（与 Web 前端共用）：

| 文件 | 内容 |
|---|---|
| `issue_index.json` | 周刊索引（最新在前，仅已发布期次） |
| `issue-<slug>.json` | 单期全文（含 markdown content） |
| `site-data.json` | 站点元数据（categories 等，源自 config.yaml） |

基础地址：`https://xfengyin.github.io/youth-weekly`（`utils/config.js` 可改）

## 安全说明

- 详情页 Markdown → rich-text 渲染采用**先 HTML 转义、后格式变换**的顺序，
  正文中的 `<script>`、`<img onerror=...>` 等原始 HTML 会被转义为纯文本，
  无法注入节点属性；链接/图片仅保留可见文本，不注入 href。
- 详情页 slug 经 `^\d+$` 白名单校验后才拼接 URL，防止路径注入。

## 开发

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目目录 `wechat-miniprogram/`
3. 调试时可在详情 → 本地设置勾选「不校验合法域名」
4. 开始开发

## 上线前必做

小程序正式环境强制校验 HTTPS 域名白名单，未配置则所有网络请求与图片加载都会被拦截。
请在 [微信公众平台](https://mp.weixin.qq.com/) → 开发管理 → 开发设置 → 服务器域名 中配置：

| 域名类型 | 域名 | 用途 |
| --- | --- | --- |
| `request` 合法域名 | `https://xfengyin.github.io` | 拉取 `issue_index.json` / `issue-<slug>.json` / `site-data.json`（`utils/config.js`） |
| `downloadFile` 合法域名 | `https://xfengyin.github.io` | `<image>` 加载周刊封面等静态图片资源 |

注意事项：

- 正式域名要求 **HTTPS 且已完成 ICP 备案**。`github.io` 为 GitHub 提供的共享域名、
  通常无法完成备案，正式上线前建议将站点部署/CDN 到自有的已备案域名，并同步更新
  `utils/config.js` 的 `baseUrl` 与上表白名单。
- 配置修改后一般数分钟内生效；开发调试阶段可在开发者工具「详情 → 本地设置」
  勾选「不校验合法域名」。
- 本仓库 `project.config.json` 的 `setting.urlCheck` 默认 `true`（正式校验），
  上传前请勿关闭。

## 项目结构

```
wechat-miniprogram/
├── pages/
│   ├── index/          # 首页（最新周刊 + 分类）
│   ├── list/           # 周刊列表
│   └── detail/         # 文章详情（Markdown 安全渲染）
├── utils/
│   ├── config.js       # 数据源地址与路径
│   └── request.js      # wx.request Promise 封装 + slug 校验
├── images/             # tabBar 图标与空状态图
├── app.js              # 小程序入口
├── app.json            # 小程序配置
├── app.wxss            # 全局样式
├── project.config.json # 开发者工具项目配置（appid/libVersion 等）
└── sitemap.json        # 站点地图
```
