#!/usr/bin/env python3
"""
业务插件集合 - 通过 @register 注册到 OCP 注册中心

✅ 符合 OCP 原则:新增功能只加新文件,不修改核心
"""

from __future__ import annotations

# 导入即注册,业务插件需在包内显式导入才能被注册
from . import collect  # noqa: F401
from . import example  # noqa: F401
from . import issue  # noqa: F401
from . import issue_index  # noqa: F401
from . import issue_json  # noqa: F401
from . import rss  # noqa: F401
from . import search_index  # noqa: F401
from . import site_data  # noqa: F401
from . import stats  # noqa: F401
from .collect import CollectPlugin

# 公共 API 重导出
from .example import ExamplePlugin, HelloWorldPlugin
from .issue import IssuePlugin
from .issue_index import IssueIndexPlugin
from .issue_json import IssueJsonPlugin
from .rss import RssPlugin
from .search_index import SearchIndexPlugin
from .site_data import SiteDataPlugin
from .stats import StatsPlugin

__all__ = [
    "ExamplePlugin",
    "HelloWorldPlugin",
    "IssueIndexPlugin",
    "IssueJsonPlugin",
    "SearchIndexPlugin",
    "SiteDataPlugin",
    "StatsPlugin",
    "RssPlugin",
    "CollectPlugin",
    "IssuePlugin",
    "example",
    "issue_index",
    "issue_json",
    "search_index",
    "site_data",
    "stats",
    "rss",
    "collect",
    "issue",
]
