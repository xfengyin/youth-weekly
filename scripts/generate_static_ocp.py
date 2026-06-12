#!/usr/bin/env python3
"""
使用 OCP 架构的静态文件生成脚本(向后兼容入口)
✅ 主入口永不修改,只扩展插件
新代码请使用: python -m youth_weekly.cli generate
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

# 触发自动注册
from youth_weekly.plugins import example, issue_index, search_index, stats  # noqa: F401
from youth_weekly.core.config import get_exclude_plugins, get_docs_dir, get_output_dir
from youth_weekly.core.content import load_all_issues
from youth_weekly.plugin import Registry

logger = logging.getLogger(__name__)


def list_plugins() -> None:
    """列出所有可用插件"""
    logger.info("Available plugins:")
    for name, plugin in Registry.get_all().items():
        logger.info("  - %s: %s", name, plugin.description or "No description")


def execute_plugins(plugins: list[str] | None = None) -> dict[str, object]:
    """
    执行所有或指定的插件

    Args:
        plugins: 插件名称列表,None 表示执行所有
    """
    if plugins is None:
        plugins = Registry.list_names()

    exclude_list = get_exclude_plugins()
    docs_dir = get_docs_dir()
    output_dir = get_output_dir()

    # 预加载周刊数据,避免每个插件重复读取
    issues = load_all_issues(docs_dir, reverse=True)

    results: dict[str, object] = {}
    for plugin_name in plugins:
        plugin = Registry.get(plugin_name)
        if plugin is None:
            logger.warning("Plugin not found: %s", plugin_name)
            continue
        if plugin_name in exclude_list:
            logger.info("Skipping excluded plugin: %s", plugin_name)
            continue

        logger.info("Executing plugin: %s", plugin_name)
        result = plugin.execute({
            "docs_dir": docs_dir,
            "output_path": output_dir / f"{plugin_name}.json",
            "issues": issues,
        })
        logger.info("Plugin %s completed", plugin_name)
        results[plugin_name] = result

    return results


def main() -> None:
    """主入口 - 永不修改"""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logger.info("=" * 50)
    logger.info("OCP Static Generator")
    logger.info("=" * 50)

    list_plugins()
    get_output_dir().mkdir(parents=True, exist_ok=True)
    execute_plugins()

    logger.info("=" * 50)
    logger.info("Done!")


if __name__ == "__main__":
    main()
