#!/usr/bin/env python3
"""
pytest 配置 - 确保测试时插件被加载
"""

from __future__ import annotations

# 导入所有插件模块，触发 @register 装饰器
from youth_weekly.plugins import (
    collect,
    example,
    issue,
    issue_index,
    rss,
    search_index,
    stats,
)

__all__ = [
    "collect",
    "example",
    "issue",
    "issue_index",
    "rss",
    "search_index",
    "stats",
]
