# Youth Weekly Scripts

青年周刊 Python 工具集 - Python 3.14 + uv + OCP 插件架构

## 简介

本目录包含青年周刊周刊的 Python 自动化脚本和工具,采用以下企业级设计:

- **开闭原则 (OCP)** - 通过 `youth_weekly.plugin` 框架实现
- **Python 3.14** - 使用最新的 PEP 649/749 延迟注解等现代语言特性
- **uv** - 极快的 Python 包管理工具
- **Pydantic 2.0+** - 类型安全的配置管理
- **插件化** - SPI 架构,新增功能只需添加文件

## 目录结构

```
scripts/
├── src/
│   ├── youth_weekly/        # 核心包
│   │   ├── core/            # 核心模块(配置/采集/策展/生成/日志/工具)
│   │   ├── plugin/          # OCP 框架(基类/注册/加载)
│   │   ├── plugins/         # 业务插件(索引/搜索/统计/示例)
│   │   └── cli.py           # CLI 入口
│   ├── ocp/                 # 兼容层(重新导出 youth_weekly.plugin)
│   ├── plugins/             # 兼容层(重新导出 youth_weekly.plugins)
│   └── __init__.py          # 兼容层(重新导出 youth_weekly.core)
├── tests/                   # 测试套件(82+ 用例,覆盖率 75%+)
├── templates/               # Jinja2 模板
├── pyproject.toml           # Python 项目配置
├── uv.toml                  # uv 行为配置
└── .python-version          # Python 版本锁定(3.14)
```

## 快速开始

### 安装依赖

```bash
# 创建虚拟环境并安装依赖(uv 推荐)
uv sync

# 或使用传统 pip
pip install -e ".[dev]"
```

### CLI 使用

```bash
# 查看所有可用命令
uv run youth-weekly --help

# 列出已注册插件
uv run youth-weekly list

# 查看当前配置
uv run youth-weekly config

# 执行所有 OCP 插件(生成静态文件)
uv run youth-weekly generate

# 仅执行指定插件
uv run youth-weekly generate issue_index stats
```

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

## Python 3.14 特性

- **PEP 649/749 延迟注解求值** - 类型注解仅在需要时求值
- **现代类型注解** - `list[T]`、`dict[K, V]`、`X | None`
- **`from __future__ import annotations`** - 全模块启用延迟求值
- **`ParamSpec` / `TypeVar`** - 泛型装饰器支持

## License

MIT
