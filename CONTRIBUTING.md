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

如果您发现了问题或有改进建议，请通过 [GitHub Issues](https://github.com/your-username/youth-weekly/issues) 提交。

提交问题时，请包含：
- 问题的清晰描述
- 复现步骤（如适用）
- 期望的行为
- 实际的行为
- 截图（如适用）
- 环境信息（操作系统、浏览器版本等）

### 提交内容

《青年周刊》接受以下内容投稿：
- **科技新势力**：AI工具、编程技巧、效率软件推荐
- **二次元次元壁**：ACG资讯、动漫评论、原创插画
- **游戏研究所**：游戏评测、攻略心得、行业动态
- **青春故事会**：成长故事、职场经验、学习心得
- **好工具**：生产力工具、生活助手推荐
- **在看什么**：影视、书籍、播客推荐及评论

投稿方式：
1. Fork 本仓库
2. 在 `docs/content/` 目录下创建新文件
3. 按照 [内容格式规范](#内容投稿规范) 编写内容
4. 提交 Pull Request

### 改进代码

1. Fork 本仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 开发指南

### 环境要求

- Node.js 18+
- Python 3.9+ (用于自动化脚本)
- Git

### 本地开发

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

### 项目结构

```
youth-weekly/
├── docs/               # 周刊内容
│   ├── issues/         # 各期周刊
│   └── content/        # 投稿内容
├── web/                # Next.js 前端
│   ├── src/
│   └── public/
├── scripts/            # 自动化脚本
├── .github/            # GitHub 配置
└── README.md
```

## 内容投稿规范

### Markdown 格式

所有内容使用 Markdown 格式编写，文件扩展名为 `.md`。

### 文章头部

每篇文章需要包含 YAML Front Matter：

```yaml
---
title: 文章标题
author: 作者名称
date: 2024-01-15
category: 科技新势力  # 可选分类
tags: [AI, 工具]      # 可选标签
---
```

### 内容要求

1. **原创性**：优先原创内容，转载需注明来源并获授权
2. **质量**：内容需有价值、有深度，避免抄袭
3. **语言**：使用中文，表达清晰流畅
4. **长度**：单篇文章建议 500-3000 字
5. **图片**：如有配图，请放置在 `docs/assets/images/` 目录

### 图片规范

- 格式：JPG 或 PNG
- 大小：单张不超过 2MB
- 命名：`article-name-001.jpg` 格式
- 版权：使用开源或自有版权图片

## 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `content`: 内容更新

示例：
```
feat: 添加暗黑模式切换
docs: 更新 README 安装说明
content: 添加第3期科技新势力板块
```

## 许可

通过向本项目提交内容，您同意您的贡献将在 [MIT 许可证](./LICENSE) 下发布。

---

如有任何问题，欢迎通过 Issue 或邮件联系我们！
