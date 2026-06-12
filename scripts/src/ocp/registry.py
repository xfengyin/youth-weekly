#!/usr/bin/env python3
"""
向后兼容层 - 重新导出 youth_weekly.plugin.registry
"""
from __future__ import annotations

from youth_weekly.plugin.registry import Registry, register

__all__ = ["Registry", "register"]
