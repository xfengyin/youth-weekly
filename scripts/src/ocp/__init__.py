#!/usr/bin/env python3
"""
向后兼容层 - 重新导出 youth_weekly.plugin

历史代码中 `from src.ocp import ...` 仍可工作。
新代码请直接使用 `from youth_weekly.plugin import ...`。
"""
from __future__ import annotations

from youth_weekly.plugin import BasePlugin, Registry, register

__all__ = ["BasePlugin", "Registry", "register"]
