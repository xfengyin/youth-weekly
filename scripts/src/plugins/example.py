#!/usr/bin/env python3
"""
向后兼容层 - 重新导出 youth_weekly.plugins.example
"""
from __future__ import annotations

from youth_weekly.plugins.example import ExamplePlugin, HelloWorldPlugin

__all__ = ["ExamplePlugin", "HelloWorldPlugin"]
