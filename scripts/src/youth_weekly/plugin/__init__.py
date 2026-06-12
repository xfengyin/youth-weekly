#!/usr/bin/env python3
"""
OCP 插件框架 - 抽象、注册、加载
"""

from __future__ import annotations

from . import loader
from .base import BasePlugin
from .registry import Registry, register

__all__ = [
    "BasePlugin",
    "Registry",
    "register",
    "loader",
]
