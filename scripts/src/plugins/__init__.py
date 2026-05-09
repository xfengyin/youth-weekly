#!/usr/bin/env python3
"""
插件实现层 - 所有功能实现放在这里
✅ 只新增，不修改旧实现
"""

from .issue_index import IssueIndexPlugin
from .search_index import SearchIndexPlugin
from .stats import StatsPlugin
from .example import ExamplePlugin, HelloWorldPlugin

__all__ = [
    'IssueIndexPlugin',
    'SearchIndexPlugin',
    'StatsPlugin',
    'ExamplePlugin',
    'HelloWorldPlugin',
]
