# 开闭原则（OCP）通用落地指南

## 核心思想

> **对扩展开放，对修改关闭**

新增功能只新增代码，不修改原有稳定代码（主流程、核心逻辑、旧功能），降低风险、提升可维护性。

---

## 架构层次

| 层次 | 文件 | 职责 | 是否可修改 |
|------|------|------|-----------|
| 抽象层 | `src/ocp/base.py` | 定义统一接口规范 | ❌ 禁止修改 |
| 注册中心 | `src/ocp/registry.py` | 统一管理所有实现 | ❌ 禁止修改 |
| 实现层 | `src/plugins/*` | 具体功能逻辑（旧功能 + 新功能） | ✅ 只新增，不修改旧实现 |
| 主入口 | `generate_static_ocp.py` | 调用注册中心获取实现，执行业务 | ❌ 永久不变 |

---

## 快速开始

### 1. 基本使用

```python
from src.ocp import Registry
from src.plugins import *  # 自动注册所有插件

# 获取并执行插件
plugin = Registry.get('issue_index')
result = plugin.execute({
    'docs_dir': '/path/to/docs',
    'output_path': '/path/to/output/issues.json'
})

# 列出所有可用插件
print(Registry.list_names())

# 获取所有插件
all_plugins = Registry.get_all()
```

### 2. 运行 OCP 版本的脚本

```bash
cd scripts
python3 generate_static_ocp.py
```

---

## 如何添加新功能（符合 OCP）

### 📝 步骤：只新增文件，不修改旧代码

#### 步骤 1: 创建新插件文件

在 `src/plugins/` 目录下创建新文件，例如 `src/plugins/my_feature.py`

#### 步骤 2: 继承 BasePlugin 并实现

```python
from typing import Dict, Any, Optional
from src.ocp import BasePlugin, register


@register()
class MyFeaturePlugin(BasePlugin):
    """新功能插件描述"""

    @property
    def name(self) -> str:
        """插件唯一标识名称（必填）"""
        return "my_feature"

    @property
    def description(self) -> str:
        """插件描述（可选）"""
        return "这是我的新功能插件"

    def execute(self, params: Optional[Dict[str, Any]] = None) -> Any:
        """
        执行插件逻辑（必填）

        Args:
            params: 参数字典，由调用方传入

        Returns:
            执行结果
        """
        params = params or {}
        # 你的业务逻辑...
        return {'result': 'success'}
```

#### 步骤 3: 在 `src/plugins/__init__.py` 中导出（可选）

```python
from .my_feature import MyFeaturePlugin

__all__ = [
    # ... 现有插件
    'MyFeaturePlugin',
]
```

#### 步骤 4: 完成！无需修改其他文件

插件会自动注册，主入口会自动发现并可执行。

---

## 完整示例

### 示例：添加一个新的导出插件

假设我们需要添加一个 "导出为 CSV" 的功能：

**文件：`src/plugins/export_csv.py`（新增文件）**

```python
import csv
from pathlib import Path
from typing import Dict, Any, Optional
from src.ocp import BasePlugin, register
from src import load_all_issues


@register()
class ExportCSVPlugin(BasePlugin):
    """导出周刊索引为 CSV"""

    @property
    def name(self) -> str:
        return "export_csv"

    @property
    def description(self) -> str:
        return "导出周刊索引为 CSV 文件"

    def execute(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        params = params or {}
        docs_dir = Path(params.get('docs_dir', ''))
        output_path = Path(params.get('output_path', ''))

        issues = load_all_issues(docs_dir, reverse=True)

        if output_path:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=['issue', 'title', 'date', 'slug'])
                writer.writeheader()
                for issue in issues:
                    writer.writerow({
                        'issue': issue.get('issue', int(issue['slug'])),
                        'title': issue.get('title', ''),
                        'date': issue.get('date', ''),
                        'slug': issue['slug'],
                    })
            print(f"Generated CSV: {output_path}")

        return {'count': len(issues)}
```

**使用方式（无需修改主入口）：**

```python
from src.ocp import Registry
from src.plugins import *

plugin = Registry.get('export_csv')
plugin.execute({
    'docs_dir': '/path/to/docs',
    'output_path': '/path/to/output/issues.csv'
})
```

---

## 判断是否符合 OCP

✅ **符合条件：**
- 加新功能只新增文件/类/函数
- 主流程/Main 无任何变更
- 无 if/else 硬编码新增分支
- 不修改旧功能、不修改入口、不修改注册中心

❌ **不符合条件：**
- 修改 `src/ocp/` 下的文件
- 修改 `generate_static_ocp.py` 的主流程
- 在旧插件中增加新的 if/else 分支

---

## 一句话口诀

> **抽象定规范，注册管实现；入口只调用，新增不改原。**

---

## 项目文件结构

```
scripts/
├── src/
│   ├── ocp/
│   │   ├── __init__.py       # 导出模块
│   │   ├── base.py           # 抽象层（禁止修改）
│   │   └── registry.py       # 注册中心（禁止修改）
│   └── plugins/
│       ├── __init__.py       # 插件导出
│       ├── issue_index.py    # 插件实现1
│       ├── search_index.py   # 插件实现2
│       ├── stats.py          # 插件实现3
│       └── example.py        # 示例插件
└── generate_static_ocp.py    # 主入口（禁止修改）
```

---

## API 参考

### Registry 类

```python
Registry.register(name=None)
# 装饰器：注册插件

Registry.get(name)
# 获取插件实例（单例模式）

Registry.get_all()
# 获取所有已注册的插件实例 {name: plugin}

Registry.list_names()
# 列出所有插件名称

Registry.exists(name)
# 检查插件是否已注册
```

### BasePlugin 类

```python
class MyPlugin(BasePlugin):
    @property
    def name(self) -> str:
        # 返回插件唯一名称

    @property
    def description(self) -> str:
        # 返回插件描述（可选）

    def execute(self, params=None):
        # 执行逻辑（必填）

    def validate(self, params=None):
        # 参数验证（可选）
        return True
```
