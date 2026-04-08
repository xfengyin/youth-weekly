# 青年周刊 (Youth Weekly)

<p align="center">
  <img src="./docs/assets/logo.png" alt="青年周刊 Logo" width="120">
</p>

<p align="center">
  <strong>为年轻人打造的内容聚合周刊</strong>
</p>

<p align="center">
  <a href="https://github.com/your-username/youth-weekly/actions">
    <img src="https://github.com/your-username/youth-weekly/workflows/CI/badge.svg" alt="CI Status">
  </a>
  <a href="https://github.com/your-username/youth-weekly/releases">
    <img src="https://img.shields.io/github/v/release/your-username/youth-weekly" alt="Latest Release">
  </a>
  <a href="https://github.com/your-username/youth-weekly/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/your-username/youth-weekly" alt="License">
  </a>
  <a href="https://youth-weekly.github.io/rss.xml">
    <img src="https://img.shields.io/badge/RSS-Subscribe-orange" alt="RSS">
  </a>
</p>

<p align="center">
  <a href="https://youth-weekly.github.io">🌐 在线访问</a> •
  <a href="#-订阅">📮 订阅</a> •
  <a href="#-投稿">✍️ 投稿</a> •
  <a href="#-本地开发">💻 开发</a>
</p>

---

## 📖 关于青年周刊

《青年周刊》是一份融合「青年文摘 + 看天下 + 知音漫客 + 大众游戏报」特色的综合性青年内容聚合平台。我们参考了阮一峰老师《科技爱好者周刊》的开源模式，致力于为年轻人提供有价值、有趣、有深度的内容。

### ✨ 特色

- 🚀 **科技新势力** - AI工具、编程技巧、效率软件
- 🎨 **二次元次元壁** - ACG资讯、动漫评论、原创插画  
- 🎮 **游戏研究所** - 游戏评测、攻略心得、行业动态
- 📖 **青春故事会** - 成长故事、职场经验、学习心得
- 🛠️ **好工具** - 生产力工具、生活助手推荐
- 👀 **在看什么** - 影视、书籍、播客推荐
- 📷 **一周图鉴** - 视觉内容精选
- 💼 **谁在招人** - 招聘信息、实习机会

---

## 📮 订阅

### 邮件订阅

每周一直接收送到您的邮箱。

👉 [立即订阅](https://youth-weekly.github.io/subscribe/)

### RSS 订阅

```
https://youth-weekly.github.io/rss.xml
```

推荐使用 [Feedly](https://feedly.com)、[Inoreader](https://www.inoreader.com) 或 [Reeder](https://reederapp.com/) 阅读。

---

## ✍️ 投稿

我们欢迎各种类型的原创内容投稿！

### 投稿方式

1. **GitHub Issue** - [提交内容](https://github.com/your-username/youth-weekly/issues/new?template=content_submission.md)
2. **Pull Request** - Fork 后提交 Markdown 文件
3. **邮件** - youth-weekly@example.com

### 内容要求

- 原创或已获授权的内容
- Markdown 格式
- 500-3000 字
- 配图需注明来源

详细投稿指南请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 💻 本地开发

### 环境要求

- Node.js 18+
- Python 3.9+
- Git

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/your-username/youth-weekly.git
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
├── docs/                 # 周刊内容
│   └── issues/          # 各期周刊
├── web/                  # Next.js 前端
│   ├── src/             # 源代码
│   └── public/          # 静态资源
├── scripts/              # 自动化脚本
├── .github/              # GitHub 配置
└── README.md            # 本文件
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

# 生成静态文件
python generate_static.py

# 生成 RSS
python generate_rss.py

# 生成邮件内容
python generate_newsletter.py
```

---

## 🛠️ 技术栈

- **前端**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **构建**: 静态导出，支持 PWA
- **内容**: Markdown + YAML Front Matter
- **部署**: GitHub Pages / Vercel
- **CI/CD**: GitHub Actions

---

## 🗓️ 发布计划

- **每周一早上 8:00** - 自动部署更新
- **每周一晚上 9:00** - 检查并发布新内容（如有）

---

## 🤝 参与贡献

我们欢迎各种形式的贡献：

- 🐛 提交 Bug 报告
- 💡 提出新功能建议
- 📝 投稿内容
- 🔧 改进代码
- 📚 完善文档

请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

---

## 📄 许可

- 代码采用 [MIT License](./LICENSE)
- 内容采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## 🙏 致谢

- 灵感来源于 [阮一峰的科技爱好者周刊](https://github.com/ruanyf/weekly)
- 感谢所有贡献者和读者的支持

---

<p align="center">
  <strong>用 ❤️ 为年轻人创作</strong>
</p>

<p align="center">
  <a href="https://youth-weekly.github.io">访问网站</a> |
  <a href="https://github.com/your-username/youth-weekly">GitHub</a>
</p>
