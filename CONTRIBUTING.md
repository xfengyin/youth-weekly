# 贡献指南

感谢你对青年周刊项目感兴趣！我们欢迎任何形式的贡献。

## 如何贡献

### 报告问题

- 使用 [GitHub Issues](https://github.com/xfengyin/youth-weekly/issues) 报告 bug
- 提供详细的复现步骤和环境信息
- 包含期望行为和实际行为

### 提交代码

1. **Fork 仓库**
2. **创建特性分支** (`git checkout -b feature/amazing-feature`)
3. **提交更改** (`git commit -m 'feat: add amazing feature'`)
4. **推送到分支** (`git push origin feature/amazing-feature`)
5. **创建 Pull Request**

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型：**
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具

**示例：**
```
feat(plugins): add RSS feed plugin
fix(ci): correct Python version in deploy workflow
docs(readme): update installation instructions
```

## 开发流程

### 环境要求

- Python 3.14+
- uv 包管理器
- Node.js 20+
- Git

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/xfengyin/youth-weekly.git
cd youth-weekly

# 2. 安装 Python 依赖
cd scripts
uv sync
uv run python -m youth_weekly.cli --help

# 3. 安装 Node 依赖
cd ../web
npm install
npm run dev

# 4. 运行测试
cd ../scripts
uv run pytest

# 5. 运行代码检查
uv run black src/ tests/
uv run flake8 src/ tests/
uv run mypy src/
```

### 添加新插件

遵循开闭原则 (OCP)：

```python
# scripts/src/youth_weekly/plugins/my_plugin.py
from youth_weekly.plugin import BasePlugin, register
from youth_weekly.core.logger import get_logger

logger = get_logger(__name__)

@register()
class MyPlugin(BasePlugin):
    @property
    def name(self) -> str:
        return "my_plugin"

    @property
    def description(self) -> str:
        return "我的自定义插件"

    def execute(self, params=None):
        logger.info("执行我的插件")
        return {"status": "ok"}
```

### 添加新周刊

1. 创建目录：`docs/issues/008/`
2. 创建 README.md，使用 front matter：

```markdown
---
issue: 8
title: "青年周刊 · 第八期"
date: 2026-06-01
published: true
cover: "./assets/cover.png"
description: "本期简介"
---

# 青年周刊 · 第八期

内容...
```

## 代码规范

- 遵循 PEP 8
- 使用类型提示
- 编写文档字符串
- 添加单元测试
- 保持测试覆盖率 >= 80%

## 社区

- GitHub Discussions
- Issues 区域
- Pull Requests

## 许可

提交代码即表示你同意你的贡献遵循 MIT 许可证。
