#!/usr/bin/env python3
"""
向后兼容层 - 重新导出 youth_weekly.plugins.stats
"""
from __future__ import annotations

from youth_weekly.plugins.stats import StatsPlugin

__all__ = ["StatsPlugin"]
