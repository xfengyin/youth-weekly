#!/usr/bin/env python3
"""
插件加载器 - 自动发现目录中的插件文件
"""

from __future__ import annotations

import importlib
import importlib.util
import logging
import sys
from pathlib import Path
from typing import Final

logger = logging.getLogger(__name__)

# 默认排除的文件名
_EXCLUDED_FILES: Final[frozenset[str]] = frozenset(
    {
        "__init__.py",
        "base.py",
        "registry.py",
        "loader.py",
    }
)


def discover_plugins(plugin_dir: Path) -> list[Path]:
    """
    发现目录下所有插件文件(.py)

    Args:
        plugin_dir: 插件目录

    Returns:
        插件文件路径列表
    """
    if not plugin_dir.is_dir():
        logger.warning("Plugin directory not found: %s", plugin_dir)
        return []

    plugins: list[Path] = []
    for file in sorted(plugin_dir.glob("*.py")):
        if file.name in _EXCLUDED_FILES:
            continue
        plugins.append(file)

    logger.info("Discovered %d plugin files in %s", len(plugins), plugin_dir)
    return plugins


def load_plugin_file(plugin_path: Path) -> bool:
    """
    动态加载一个插件文件

    Args:
        plugin_path: 插件 .py 文件路径

    Returns:
        是否成功加载
    """
    if not plugin_path.is_file():
        return False

    module_name = f"_dynamic_plugin_{plugin_path.stem}"
    spec = importlib.util.spec_from_file_location(module_name, plugin_path)
    if spec is None or spec.loader is None:
        logger.error("Failed to create module spec for %s", plugin_path)
        return False

    try:
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        logger.info("Loaded plugin: %s", plugin_path.name)
        return True
    except Exception as exc:
        logger.error("Failed to load plugin %s: %s", plugin_path, exc)
        return False


def load_plugins_from_dir(plugin_dir: Path) -> int:
    """
    从目录加载所有插件

    Args:
        plugin_dir: 插件目录

    Returns:
        成功加载的插件数量
    """
    files = discover_plugins(plugin_dir)
    return sum(load_plugin_file(f) for f in files)


__all__ = [
    "discover_plugins",
    "load_plugin_file",
    "load_plugins_from_dir",
]
