#!/usr/bin/env python3
"""
向后兼容层 - 重新导出 youth_weekly.plugins.issue_index
"""
from __future__ import annotations

from youth_weekly.plugins.issue_index import IssueIndexPlugin

__all__ = ["IssueIndexPlugin"]
