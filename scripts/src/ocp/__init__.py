#!/usr/bin/env python3
"""
开闭原则（OCP）通用落地架构
核心思想：对扩展开放，对修改关闭
"""

from .registry import Registry, register
from .base import BasePlugin

__all__ = ['Registry', 'register', 'BasePlugin']
