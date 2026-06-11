# 贡献指南

感谢您对《青年周刊》项目的关注！我们欢迎各种形式的贡献。

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
  - [报告问题](#报告问题)
  - [提交内容](#提交内容)
  - [改进代码](#改进代码)
- [开发指南](#开发指南)
- [内容投稿规范](#内容投稿规范)
- [提交信息规范](#提交信息规范)

## 行为准则

请参与本项目时遵守我们的 [行为准则](./CODE_OF_CONDUCT.md)。

## 如何贡献

### 报告问题

如果您发现了问题或有改进建议，请通过 [GitHub Issues](https://github.com/xfengyin/youth-weekly/issues) 提交。

提交问题时，请包含：
- 问题的清晰描述
- 复现步骤（如适用）
- 期望的行为
- 实际的行为

### 提交内容

我们欢迎以下类型的内容投稿：

| 板块 | 内容方向 | 字数要求 |
|------|---------|---------|
| 🚀 科技新势力 | AI 工具、编程技巧、效率软件 | 500-2000 字 |
| 🎨 二次元次元壁 | ACG 资讯、动漫评论、原创插画 | 500-3000 字 |
| 🎮 游戏研究所 | 游戏评测、攻略心得、行业动态 | 500-2000 字 |
| 📖 青春故事会 | 成长故事、职场经验、学习心得 | 800-3000 字 |
| 🛠️ 好工具 | 生产力工具、开发利器推荐 | 300-1000 字 |
| 👀 在看什么 | 影视、书籍、播客推荐及评论 | 300-1500 字 |
| 📷 一周图鉴 | 视觉内容精选（需附图） | 图 + 100 字描述 |
| 💼 谁在招人 | 招聘信息、实习机会 | 格式化信息 |

**投稿方式：**
1. **GitHub Issue** — [提交内容投稿](https://github.com/xfengyin/youth-weekly/issues/new?template=content_submission.md)
2. **Pull Request** — Fork 后在 `docs/issues/` 目录提交 Markdown 文件
3. **邮件** — 发送至 youth-weekly@xfengyin.com

### 改进代码

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '✨ Add some amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

> 💡 如需开发或扩展后端插件，请先阅读 [OCP 插件开发指南](./docs/OCP_GUIDE.md)。

## 开发指南

### 环境搭建

```bash
# 克隆仓库
git clone https://github.com/xfengyin/youth-weekly.git
cd youth-weekly

# 前端开发
cd web
npm install
npm run dev

# 自动化脚本
cd scripts
pip install -r requirements.txt
```

### 配置说明

项目使用 `config.yaml` 统一管理配置项（站点信息、分类、插件排除等）。
如需自定义站点 URL、分类列表等，修改根目录的 `config.yaml` 文件即可。
配置由 pydantic 验证，支持通过环境变量覆盖（如 `YOUTH_WEEKLY_SITE__URL=https://my-site.com`）。

### 代码规范

- **前端**：ESLint + TypeScript 严格模式
- **Python**：PEP 8 + 类型注解
- **Markdown**：markdownlint 规范
- **提交信息**：Conventional Commits

### 目录约定

```
docs/issues/{期号}/        # 周刊内容
web/src/app/               # 页面代码
web/src/app/components/    # 组件代码
scripts/                   # 自动化脚本
wechat-miniprogram/        # 微信小程序
```

## 内容投稿规范

### Markdown 格式

```markdown
---
title: "文章标题"
author: "作者名"
category: "科技新势力"
tags: ["AI", "编程", "工具"]
date: "2026-04-09"
---

# 文章标题

正文内容...
```

### 图片规范

- 放置在 `docs/issues/{期号}/assets/` 目录
- 文件名使用英文小写 + 连字符
- 格式：JPG/PNG/WebP
- 尺寸：宽度不超过 1200px
- 需注明来源或使用无版权图片

## 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加全文搜索功能` |
| `fix` | 修复 Bug | `fix: 修复暗黑模式切换异常` |
| `docs` | 文档更新 | `docs: 更新贡献指南` |
| `style` | 样式调整 | `style: 优化移动端响应式布局` |
| `content` | 内容更新 | `content: 添加第2期周刊内容` |
| `refactor` | 代码重构 | `refactor: 优化内容加载逻辑` |
| `ci` | CI/CD 变更 | `ci: 更新部署工作流` |
| `chore` | 杂项 | `chore: 更新依赖版本` |

---

感谢您的贡献！每一个 PR 都让《青年周刊》变得更好 🎉
