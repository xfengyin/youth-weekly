#!/usr/bin/env python3
"""
使用 OCP 架构的静态文件生成脚本
✅ 主入口永不修改，只扩展插件
"""

import sys
import logging
from pathlib import Path

# 支持直接执行时找到 src 模块
_script_dir = Path(__file__).parent
if str(_script_dir) not in sys.path:
    sys.path.insert(0, str(_script_dir))

from src.ocp import Registry
from src.config import get_exclude_plugins
from src.plugins import *  # 自动注册所有插件

logger = logging.getLogger(__name__)

ROOT_DIR = _script_dir.parent
DOCS_DIR = ROOT_DIR / "docs"
OUTPUT_DIR = ROOT_DIR / "scripts" / "dist"


def list_plugins():
    """列出所有可用插件"""
    logger.info("Available plugins:")
    for name, plugin in Registry.get_all().items():
        logger.info("  - %s: %s", name, plugin.description or 'No description')


def execute_plugins(plugins=None):
    """
    执行所有或指定的插件

    Args:
        plugins: 插件名称列表，None 表示执行所有
    """
    if plugins is None:
        plugins = Registry.list_names()

    # 从配置中读取排除列表
    exclude_list = get_exclude_plugins()

    results = {}
    for plugin_name in plugins:
        plugin = Registry.get(plugin_name)
        if not plugin:
            logger.warning("Plugin not found: %s", plugin_name)
            continue

        # 跳过配置中排除的插件
        if plugin_name in exclude_list:
            logger.info("Skipping excluded plugin: %s", plugin_name)
            continue

        logger.info("Executing plugin: %s", plugin_name)
        result = plugin.execute({
            'docs_dir': DOCS_DIR,
            'output_path': OUTPUT_DIR / f"{plugin_name}.json"
        })
        logger.info("Plugin %s completed", plugin_name)
        results[plugin_name] = result

    return results


def main():
    """主入口 - 永不修改"""
    # 配置日志
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    logger.info("=" * 50)
    logger.info("OCP Static Generator")
    logger.info("=" * 50)

    list_plugins()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    execute_plugins()

    logger.info("=" * 50)
    logger.info("Done!")


if __name__ == "__main__":
    main()
