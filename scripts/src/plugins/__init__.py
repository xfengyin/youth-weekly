#!/usr/bin/env python3
"""
向后兼容层 - 重新导出 youth_weekly.plugins

历史代码中 `from src.plugins import ...` 仍可工作。
新代码请直接使用 `from youth_weekly.plugins import ...`。
"""
from __future__ import annotations

# 导入即注册到 OCP Registry
from youth_weekly.plugins import (
    ExamplePlugin,
    HelloWorldPlugin,
    IssueIndexPlugin,
    SearchIndexPlugin,
    StatsPlugin,
    example,
    issue_index,
    search_index,
    stats,
)

__all__ = [
    "ExamplePlugin",
    "HelloWorldPlugin",
    "IssueIndexPlugin",
    "SearchIndexPlugin",
    "StatsPlugin",
    "example",
    "issue_index",
    "search_index",
    "stats",
]
