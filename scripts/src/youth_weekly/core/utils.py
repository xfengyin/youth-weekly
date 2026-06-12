#!/usr/bin/env python3
"""
共享工具函数
"""

from __future__ import annotations


def safe_int(s: str | None, default: int = 0) -> int:
    """
    安全地将字符串转为整数,转换失败时返回默认值

    Args:
        s: 待转换的字符串
        default: 转换失败时的默认值

    Returns:
        转换后的整数或默认值
    """
    if s is None:
        return default
    try:
        return int(s)
    except ValueError, TypeError:
        return default


__all__ = ["safe_int"]
