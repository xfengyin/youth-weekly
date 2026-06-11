#!/usr/bin/env python3
"""
OCP 架构测试
"""

import sys
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 支持直接执行时找到 src 模块
_script_dir = Path(__file__).parent.parent
if str(_script_dir) not in sys.path:
    sys.path.insert(0, str(_script_dir))

from src.ocp import Registry
from src.plugins import *  # noqa: F401, F403


def test_registry():
    """测试注册中心功能"""
    logger.info("Testing registry...")

    # 检查插件是否已注册
    assert Registry.exists('issue_index'), "issue_index plugin should exist"
    assert Registry.exists('search_index'), "search_index plugin should exist"
    assert Registry.exists('stats'), "stats plugin should exist"
    assert Registry.exists('example'), "example plugin should exist"
    assert Registry.exists('hello_world'), "hello_world plugin should exist"

    # 列出所有插件
    names = Registry.list_names()
    logger.info("Registered plugins: %s", names)
    assert len(names) >= 4, "Should have at least 4 plugins"

    logger.info("Registry tests passed!")


def test_plugin_execution():
    """测试插件执行"""
    logger.info("\nTesting plugin execution...")

    # 测试示例插件
    example = Registry.get('example')
    assert example is not None, "Example plugin should be found"

    result = example.execute({'message': 'Test', 'repeat': 2})
    assert result['status'] == 'success'
    assert result['message'] == 'TestTest'
    logger.info("Example plugin result: %s", result)

    # 测试 Hello World 插件
    hello = Registry.get('hello_world')
    result = hello.execute()
    assert result['greeting'] == 'Hello, World!'
    logger.info("Hello World plugin result: %s", result)

    logger.info("Plugin execution tests passed!")


def test_plugin_properties():
    """测试插件属性"""
    logger.info("\nTesting plugin properties...")

    all_plugins = Registry.get_all()
    for name, plugin in all_plugins.items():
        assert plugin.name == name, f"Plugin name mismatch: {plugin.name} != {name}"
        logger.info("  - %s: %s", name, plugin.description or 'No description')

    logger.info("Plugin properties tests passed!")


if __name__ == "__main__":
    logger.info("=" * 50)
    logger.info("OCP Architecture Tests")
    logger.info("=" * 50)

    test_registry()
    test_plugin_execution()
    test_plugin_properties()

    logger.info("=" * 50)
    logger.info("All tests passed!")
    logger.info("=" * 50)
