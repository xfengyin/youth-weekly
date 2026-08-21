# Youth Weekly Scripts

青年周刊 Python 工具集 - Python 3.12 + uv + OCP 插件架构

## 简介

本目录包含青年周刊周刊的 Python 自动化脚本和工具,采用以下企业级设计:

- **开闭原则 (OCP)** - 通过 `youth_weekly.plugin` 框架实现
- **Python 3.12** - 现代类型注解（`X | None`、`list[T]`、`from __future__ import annotations`）
- **uv** - 极快的 Python 包管理工具
- **Pydantic 2.0+** - 类型安全的配置管理
- **插件化** - SPI 架构,新增功能只需添加文件

## 目录结构

```
scripts/
├── src/
│   ├── youth_weekly/        # 核心包
│   │   ├── core/            # 核心模块(配置/采集/策展/生成/校验/日志/工具)
│   │   ├── plugin/          # OCP 框架(基类/注册/加载)
│   │   ├── plugins/         # 业务插件(索引/每期JSON/搜索/站点数据/RSS/统计/采集/生成)
│   │   └── cli.py           # CLI 入口
├── tests/                   # 测试套件(pytest,覆盖率 85%+)
├── pyproject.toml           # Python 项目配置
├── uv.toml                  # uv 行为配置
└── .python-version          # Python 版本锁定(3.12)
```

## 快速开始

### 安装依赖

```bash
# 创建虚拟环境并安装依赖(uv 推荐;开发依赖通过 group 安装)
uv sync --group dev

# 或使用传统 pip
pip install -e .
```

### CLI 使用

```bash
# 查看所有可用命令
uv run youth-weekly --help

# 列出已注册插件
uv run youth-weekly list

# 查看当前配置
uv run youth-weekly config

# 执行纯静态白名单插件(默认:issue_index issue_json rss search_index site_data stats)
# 注意:默认不会执行 collect(网络采集)/issue(新建期刊)等有副作用插件
uv run youth-weekly generate

# 校验周刊 frontmatter(Pydantic:title/date 必填、slug 纯数字、published 布尔、
# date 格式、cover 资产引用存在),失败返回非 0
uv run youth-weekly validate

# 仅执行指定插件(显式覆盖白名单,可包含有副作用插件)
uv run youth-weekly generate issue_index stats
uv run youth-weekly generate collect issue
```

生成产物路由(依据插件声明的 `outputs` 元数据):

| 插件 | 产物路径 |
|------|----------|
| search_index | `web/public/search-data.json` |
| issue_index | `web/public/issue_index.json` |
| issue_json | `web/public/issue-<slug>.json`(每期一个) |
| site_data | `web/public/site-data.json` |
| rss | `scripts/dist/rss.xml`(deploy 拷贝到站点根) |
| stats | `scripts/dist/stats.json` |

`generate` 还会写出 `scripts/dist/artifacts-manifest.json`,包含每个产物的
路径 / 大小 / SHA-256。任一插件失败或不存在,命令以非 0 退出(CI 可感知)。

`--output` 参数可把产物根目录重定向到其他位置(相对布局不变),用于测试;
部署路径不要使用该参数。

### 运行测试

```bash
# 运行所有测试
uv run pytest

# 带覆盖率
uv run pytest --cov=youth_weekly --cov-report=term

# 强制覆盖率下限 70%
uv run pytest --cov=youth_weekly --cov-fail-under=70
```

### 代码质量

```bash
# 格式化
uv run black src/youth_weekly/ tests/
uv run isort src/youth_weekly/ tests/

# 检查
uv run flake8 src/youth_weekly/ tests/
uv run mypy src/youth_weekly/

# 安全扫描
uv run bandit -r src/youth_weekly/ -ll
```

## 添加新插件 (OCP 范式)

```python
# src/youth_weekly/plugins/my_plugin.py
from youth_weekly.plugin import BasePlugin, register


@register()
class MyPlugin(BasePlugin):
    @property
    def name(self) -> str:
        return "my_plugin"

    @property
    def version(self) -> str:
        return "1.0.0"

    @property
    def description(self) -> str:
        return "My new plugin"

    def execute(self, params: dict | None = None) -> dict:
        # 业务逻辑
        return {"result": "ok"}
```

然后在 `src/youth_weekly/plugins/__init__.py` 中导入即可:

```python
from . import my_plugin  # noqa: F401
```

**无需修改任何其他文件**,OCP 框架会自动发现并执行。

如需让插件产物参与 `generate` 路由与 `artifacts-manifest.json`,可在类上声明
`outputs`(逻辑名 -> 相对仓库根的路径):

```python
class MyPlugin(BasePlugin):
    outputs: dict[str, str] = {"my_artifact": "web/public/my-artifact.json"}
```

若插件动态生成多个文件(如每期一个),`outputs` 可留空,并在 `execute`
返回值中通过 `output_files` 列表(相对仓库根或绝对路径)上报实际产物。

## Python 3.12 特性

- **现代类型注解** - `list[T]`、`dict[K, V]`、`X | None`
- **`from __future__ import annotations`** - 全模块启用延迟求值
- **`ParamSpec` / `TypeVar`** - 泛型装饰器支持

## License

MIT
