# 更新日志

所有重要的项目变更都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- v2.0.0: 完全移除旧版代码结构
- API 文档站点
- 国际化支持

## [1.0.0] - 2026-05-25

### 🎉 主要变更

#### 架构升级
- 升级到 Python 3.14（PEP 649/749 延迟注解求值）
- 集成 uv 包管理器（速度提升 10-100 倍）
- 重构为现代企业级架构
- 引入 Pydantic 进行类型化配置管理
- 完整的 OCP 开闭原则插件系统

#### 新增
- `src/youth_weekly/core/` - 核心模块（config, logger, content）
- `src/youth_weekly/plugin/` - 插件系统（base, registry, loader）
- `src/youth_weekly/plugins/` - 内置业务插件
- `src/youth_weekly/cli.py` - 命令行工具
- `pyproject.toml` - 现代项目配置
- `uv.toml` - uv 包管理器配置
- `.pre-commit-config.yaml` - pre-commit hooks
- 完整的测试套件（覆盖率 80%+）
- GitHub Actions CI 改进
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`

#### 改进
- 完整的中文文档
- 类型注解覆盖率 100%
- 企业级日志系统
- 安全的路径处理
- RSS Feed 生成

#### 修复
- Python 版本配置不一致（Issue #22）
- uv.toml 格式错误（Issue #26）

#### 移除
- 旧的扁平化代码结构（已迁移到 `src_deprecated/`）
- 重复的代码

### 📦 依赖

```
pydantic>=2.0
pyyaml>=6.0
markdown>=3.5
jinja2>=3.1
feedgen>=1.0
python-dateutil>=2.8
requests>=2.31
feedparser>=6.0
```

### 🛠️ 开发

```bash
# 安装
uv sync

# 运行测试
uv run pytest

# 代码检查
uv run black .
uv run flake8 .
uv run mypy src/
```

## [0.x] - 历史版本

早期版本采用扁平化代码结构，详见 git 历史。
