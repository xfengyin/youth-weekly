#!/usr/bin/env python3
"""
向后兼容层 - 重新导出 youth_weekly.core.content 与 utils
"""
from __future__ import annotations

from youth_weekly.core.content import (
    ContentLoadError,
    get_issue_count,
    get_latest_issue,
    get_next_issue_number,
    load_all_issues,
    load_issue,
    safe_resolve_path,
)
from youth_weekly.core.utils import safe_int

__all__ = [
    "ContentLoadError",
    "load_issue",
    "load_all_issues",
    "get_latest_issue",
    "get_issue_count",
    "get_next_issue_number",
    "safe_resolve_path",
    "safe_int",
]
