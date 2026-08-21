# 更新日志

所有重要的项目变更都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- v2.0.0: 完全移除旧版代码结构
- API 文档站点
- 国际化支持

### 已变更（T-A 基础重构）
- 统一 Python 运行时为 3.12（pyproject/CI/.python-version/config.yaml 一致）
- 统一 Node 运行时要求为 >=20
- 新增 `.env.example` 与 GitHub Pages `_headers` 安全响应头
- 统一维护者联系邮箱为 contact@youth-weekly.com
- 修正 Makefile `USE_UV` 判断语义与 config.yaml 无效插件引用

### 已变更（T-B 管线重构）
- `generate` 默认只执行纯静态白名单（issue_index/issue_json/rss/search_index/site_data/stats），
  不再触发 collect（网络采集）/issue（新建期刊）等有副作用插件；显式传插件名可覆盖
- `generate` 任一插件失败或缺失返回非 0，CI/定时任务可感知失败
- 插件新增 `outputs` 元数据，`generate` 按声明路由产物：
  search-data.json / issue_index.json / issue-<slug>.json / site-data.json 落 web/public，
  rss.xml / stats.json / artifacts-manifest.json 落 scripts/dist（manifest 含 size+SHA-256）
- 新增 `youth-weekly validate`：Pydantic 校验 frontmatter（title/date 必填、slug 纯数字、
  published 布尔、date 格式、cover 本地引用存在），失败返回非 0
- 内容缓存签名改为（目录名, README mtime）元组集合，删除最新一期也能正确失效
- frontmatter date 统一归一化为 YYYY-MM-DD 字符串（修复未加引号日期与字符串混用导致
  stats 比较崩溃的问题）
- 移除未使用的运行时依赖 jinja2/markdown 与死模板 templates/newsletter.html；
  合并 optional-dependencies 与 dependency-groups 双轨（保留 PEP 735 group）
- 新增 pytest 覆盖管线重构（白名单/失败语义/产物路由/manifest/validate/缓存失效）

## [1.0.0] - 2026-05-25

### 🎉 主要变更

#### 架构升级
- 统一 Python 运行时为 3.12（现代类型注解 + uv；历史文档中的 3.14 表述为当时规划，实际落地为 3.12）
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
