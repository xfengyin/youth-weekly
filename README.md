<div align="center">

# 🌟 青年周刊 Youth Weekly

**为年轻人打造的开源内容聚合周刊**

[![CI Status](https://github.com/xfengyin/youth-weekly/actions/workflows/ci.yml/badge.svg)](https://github.com/xfengyin/youth-weekly/actions)
[![License](https://img.shields.io/github/license/xfengyin/youth-weekly)](./LICENSE)
[![RSS](https://img.shields.io/badge/RSS-Subscribe-orange)](https://xfengyin.github.io/youth-weekly/rss.xml)
[![Issues](https://img.shields.io/github/issues/xfengyin/youth-weekly)](https://github.com/xfengyin/youth-weekly/issues)

[🌐 在线访问](https://xfengyin.github.io/youth-weekly/) •
[📮 订阅](#-订阅) •
[✍️ 投稿](#-投稿) •
[💻 开发](#-本地开发) •
[🤝 贡献](#-参与贡献)

</div>

---

## 📖 关于

《青年周刊》是一份融合「青年文摘 + 看天下 + 知音漫客 + 大众游戏报」特色的综合性青年内容聚合平台。参考阮一峰老师《科技爱好者周刊》的开源模式，致力于为年轻人提供有价值、有趣、有深度的内容。

### 🎯 九大内容板块

| 板块 | 图标 | 内容方向 |
|------|:----:|---------|
| **科技新势力** | 🚀 | AI 工具、编程技巧、效率软件、前沿技术 |
| **二次元次元壁** | 🎨 | ACG 资讯、动漫评论、原创插画、漫展动态 |
| **游戏研究所** | 🎮 | 游戏评测、攻略心得、行业动态、独立游戏 |
| **青春故事会** | 📖 | 成长故事、职场经验、学习心得、读者投稿 |
| **好工具** | 🛠️ | 生产力工具、开发利器、生活助手推荐 |
| **在看什么** | 👀 | 影视、书籍、播客推荐及深度评论 |
| **一周图鉴** | 📷 | 视觉内容精选，用图片记录精彩瞬间 |
| **谁在招人** | 💼 | 招聘信息、实习机会、职场动态 |
| **编读往来** | 📬 | 读者反馈、话题讨论、下期预告 |

---

## 📰 最新一期

### 第 6 期 · 第六期（2026-05-11）

> 时间过得真快！转眼已经到了第6期《青年周刊》。本周我们带来了AI音乐创作革命、5G-A商用加速，以及毕业季特别策划。

**本期亮点：**
- 🎵 **Suno AI 3.0** — 音乐创作革命，声音克隆与长音频生成
- 📡 **5G-A 商用加速** — 万兆时代到来
- 🎓 **毕业季特别策划** — 职场生存指南与面试技巧
- 🎮 **《黑神话：悟空》** — 最终前瞻，离发售还有3个月

📖 [阅读第6期全文](./docs/issues/006/README.md)

---

## 📮 订阅

### RSS 订阅

```
https://xfengyin.github.io/youth-weekly/rss.xml
```

推荐阅读器：[Feedly](https://feedly.com) · [Inoreader](https://www.inoreader.com) · [Reeder](https://reederapp.com/)

### 邮件订阅

每周一直接收送到您的邮箱。

👉 [立即订阅](https://xfengyin.github.io/youth-weekly/subscribe/)

---

## ✍️ 投稿

我们欢迎各种类型的原创内容投稿！

### 投稿方式

1. **GitHub Issue** — [提交内容投稿](https://github.com/xfengyin/youth-weekly/issues/new?template=content_submission.md)
2. **Pull Request** — Fork 后在 `docs/issues/` 目录提交 Markdown 文件
3. **邮件** — 发送至 youth-weekly@xfengyin.com

### 内容要求

- 原创或已获授权的内容
- Markdown 格式，500-3000 字
- 配图需注明来源
- 符合九大板块主题

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 💻 本地开发

### 环境要求

- **Node.js** 18+（推荐 20+）
- **Python** 3.9+（推荐 3.11+）
- **Git** 2.40+

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/xfengyin/youth-weekly.git
cd youth-weekly

# 安装前端依赖
cd web
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看网站。

### 项目结构

```
youth-weekly/
├── 📁 docs/                    # 周刊内容
│   ├── issues/001/             # 第 1 期完整内容
│   │   ├── README.md           # 周刊正文
│   │   └── assets/             # 图片资源
│   └── README.md               # 内容索引
│
├── 📁 web/                     # Next.js 前端
│   ├── src/app/                # 页面与组件
│   │   ├── page.tsx            # 首页
│   │   ├── issues/             # 周刊列表与详情
│   │   ├── categories/         # 分类页面
│   │   ├── search/             # 全文搜索
│   │   ├── subscribe/          # 订阅页面
│   │   ├── archive/            # 归档页面
│   │   ├── components/         # 公共组件
│   │   │   ├── Header.tsx      # 导航栏
│   │   │   ├── Footer.tsx      # 页脚
│   │   │   └── ThemeProvider.tsx # 主题切换
│   │   └── lib/content.ts      # 内容处理工具
│   ├── public/manifest.json    # PWA 配置
│   └── package.json
│
├── 📁 scripts/                 # 自动化脚本
│   ├── generate_static_ocp.py  # 生成静态数据
│   ├── generate_rss.py         # 生成 RSS Feed
│   ├── generate_newsletter.py  # 生成邮件内容
│   └── check_new_issue.py      # 检查新周刊
│
├── 📁 wechat-miniprogram/      # 微信小程序
│   ├── pages/                  # 页面（首页/列表/详情）
│   ├── components/             # 小程序组件
│   └── utils/                  # 工具函数
│
├── 📁 .github/                 # GitHub 配置
│   ├── ISSUE_TEMPLATE/         # Issue 模板
│   │   ├── bug_report.md       # Bug 报告
│   │   ├── content_submission.md # 内容投稿
│   │   └── feature_request.md  # 功能建议
│   ├── workflows/              # CI/CD 工作流
│   │   ├── ci.yml              # 持续集成
│   │   ├── deploy.yml          # 自动部署
│   │   └── weekly-publish.yml  # 周刊定时发布
│   └── pull_request_template.md
│
├── README.md                   # 项目主文档
├── CONTRIBUTING.md             # 贡献指南
├── CHANGELOG.md                # 更新日志
├── CODE_OF_CONDUCT.md          # 行为准则
├── LICENSE                     # MIT 许可证
└── .editorconfig               # 编辑器配置
```

### 构建生产版本

```bash
cd web
npm run build
```

### 运行自动化脚本

```bash
cd scripts
pip install -r requirements.txt

# 生成静态数据文件
python generate_static_ocp.py

# 生成 RSS Feed
python generate_rss.py

# 生成邮件内容
python generate_newsletter.py

# 检查新周刊
python check_new_issue.py
```

### 微信小程序开发

```bash
# 使用微信开发者工具打开
# 项目目录：wechat-miniprogram/
```

详见 [wechat-miniprogram/README.md](./wechat-miniprogram/README.md)

---

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Next.js 16 + React 19 | SSG 静态导出 |
| **类型系统** | TypeScript 5 | 全量类型覆盖 |
| **样式方案** | Tailwind CSS | 原子化 CSS |
| **内容处理** | gray-matter + remark | Markdown 解析 |
| **全文搜索** | Fuse.js | 客户端模糊搜索 |
| **图标库** | Lucide React | 轻量图标方案 |
| **小程序** | 原生微信小程序 | 无框架依赖 |
| **自动化** | Python 3.11 | 脚本工具链 |
| **CI/CD** | GitHub Actions | 自动构建部署 |
| **部署** | GitHub Pages | 静态托管 |

---

## 🗓️ 发布节奏

| 时间 | 事件 | 说明 |
|------|------|------|
| **每周一 08:00** | 自动部署 | GitHub Actions 触发 |
| **每周一 21:00** | 发布检查 | 检测新内容并发布 |
| **随时** | 手动触发 | 通过 GitHub Actions 手动部署 |

---

## 🤝 参与贡献

我们欢迎各种形式的贡献：

| 贡献类型 | 方式 | 链接 |
|---------|------|------|
| 🐛 报告 Bug | 提交 Issue | [Bug Report](https://github.com/xfengyin/youth-weekly/issues/new?template=bug_report.md) |
| 💡 功能建议 | 提交 Issue | [Feature Request](https://github.com/xfengyin/youth-weekly/issues/new?template=feature_request.md) |
| 📝 内容投稿 | Issue 或 PR | [Content Submission](https://github.com/xfengyin/youth-weekly/issues/new?template=content_submission.md) |
| 🔧 代码改进 | Pull Request | [PR Template](./.github/pull_request_template.md) |
| 📚 文档完善 | Pull Request | 修正错误、补充说明 |

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 📄 许可证

- **代码** — [MIT License](./LICENSE)
- **内容** — [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## 🙏 致谢

- 灵感来源于 [阮一峰的科技爱好者周刊](https://github.com/ruanyf/weekly)
- 前端框架由 [Next.js](https://nextjs.org/) 强力驱动
- 感谢所有贡献者和读者的支持

---

## ⭐ Star History

如果这个项目对你有帮助，欢迎点个 Star！

[![Star History Chart](https://api.star-history.com/svg?repos=xfengyin/youth-weekly&type=Date)](https://star-history.com/#xfengyin/youth-weekly&Date)

---

<div align="center">

**用 ❤️ 为年轻人创作**

[🌐 访问网站](https://xfengyin.github.io/youth-weekly/) ·
[📦 GitHub](https://github.com/xfengyin/youth-weekly) ·
[📮 订阅 RSS](https://xfengyin.github.io/youth-weekly/rss.xml)

</div>
