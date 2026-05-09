#!/usr/bin/env python3
"""
OCP 架构测试
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ocp import Registry
from src.plugins import *


def test_registry():
    """测试注册中心功能"""
    print("Testing registry...")

    # 检查插件是否已注册
    assert Registry.exists('issue_index'), "issue_index plugin should exist"
    assert Registry.exists('search_index'), "search_index plugin should exist"
    assert Registry.exists('stats'), "stats plugin should exist"
    assert Registry.exists('example'), "example plugin should exist"
    assert Registry.exists('hello_world'), "hello_world plugin should exist"

    # 列出所有插件
    names = Registry.list_names()
    print(f"Registered plugins: {names}")
    assert len(names) >= 4, "Should have at least 4 plugins"

    print("✅ Registry tests passed!")


def test_plugin_execution():
    """测试插件执行"""
    print("\nTesting plugin execution...")

    # 测试示例插件
    example = Registry.get('example')
    assert example is not None, "Example plugin should be found"

    result = example.execute({'message': 'Test', 'repeat': 2})
    assert result['status'] == 'success'
    assert result['message'] == 'TestTest'
    print(f"✅ Example plugin result: {result}")

    # 测试 Hello World 插件
    hello = Registry.get('hello_world')
    result = hello.execute()
    assert result['greeting'] == 'Hello, World!'
    print(f"✅ Hello World plugin result: {result}")

    print("✅ Plugin execution tests passed!")


def test_plugin_properties():
    """测试插件属性"""
    print("\nTesting plugin properties...")

    all_plugins = Registry.get_all()
    for name, plugin in all_plugins.items():
        assert plugin.name == name, f"Plugin name mismatch: {plugin.name} != {name}"
        print(f"  - {name}: {plugin.description or 'No description'}")

    print("✅ Plugin properties tests passed!")


if __name__ == "__main__":
    print("=" * 50)
    print("OCP Architecture Tests")
    print("=" * 50)

    test_registry()
    test_plugin_execution()
    test_plugin_properties()

    print("\n" + "=" * 50)
    print("✅ All tests passed!")
    print("=" * 50)
