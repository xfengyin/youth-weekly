#!/usr/bin/env python3
"""
业务插件集合 - 通过 @register 注册到 OCP 注册中心

✅ 符合 OCP 原则:新增功能只加新文件,不修改核心
"""

from __future__ import annotations

# 导入即注册,业务插件需在包内显式导入才能被注册
from . import example  # noqa: F401
from . import issue_index  # noqa: F401
from . import search_index  # noqa: F401
from . import stats  # noqa: F401

# 公共 API 重导出
from .example import ExamplePlugin, HelloWorldPlugin
from .issue_index import IssueIndexPlugin
from .search_index import SearchIndexPlugin
from .stats import StatsPlugin

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
