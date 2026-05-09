#!/usr/bin/env python3
"""
使用 OCP 架构的静态文件生成脚本
✅ 主入口永不修改，只扩展插件
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src.ocp import Registry
from src.plugins import *  # 自动注册所有插件


ROOT_DIR = Path(__file__).parent.parent
DOCS_DIR = ROOT_DIR / "docs"
OUTPUT_DIR = ROOT_DIR / "scripts" / "dist"


def list_plugins():
    """列出所有可用插件"""
    print("Available plugins:")
    for name, plugin in Registry.get_all().items():
        print(f"  - {name}: {plugin.description or 'No description'}")


def execute_plugins(plugins=None):
    """
    执行所有或指定的插件

    Args:
        plugins: 插件名称列表，None 表示执行所有
    """
    if plugins is None:
        plugins = Registry.list_names()

    results = {}
    for plugin_name in plugins:
        plugin = Registry.get(plugin_name)
        if not plugin:
            print(f"⚠️  Plugin not found: {plugin_name}")
            continue

        # 只执行业务插件，跳过示例插件
        if plugin_name in ['example', 'hello_world']:
            continue

        print(f"\nExecuting plugin: {plugin_name}")
        result = plugin.execute({
            'docs_dir': DOCS_DIR,
            'output_path': OUTPUT_DIR / f"{plugin_name}.json"
        })
        print(f"✅ Plugin {plugin_name} completed")
        results[plugin_name] = result

    return results


def main():
    """主入口 - 永不修改"""
    print("=" * 50)
    print("OCP Static Generator")
    print("=" * 50)

    list_plugins()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    execute_plugins()

    print("\n" + "=" * 50)
    print("Done!")


if __name__ == "__main__":
    main()
