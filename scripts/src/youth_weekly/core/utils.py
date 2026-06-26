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
    except (ValueError, TypeError):
        return default


def safe_float(s: str | float | None, default: float = 0.0) -> float:
    """
    安全地将字符串或数值转为浮点数,转换失败时返回默认值

    Args:
        s: 待转换的字符串或数值
        default: 转换失败时的默认值

    Returns:
        转换后的浮点数或默认值
    """
    if s is None:
        return default
    try:
        return float(s)
    except (ValueError, TypeError):
        return default


def safe_str(value: object | None, default: str = "") -> str:
    """
    安全地将任意对象转为字符串,None 返回默认值

    Args:
        value: 待转换的对象
        default: 值为 None 时的默认值

    Returns:
        转换后的字符串或默认值
    """
    if value is None:
        return default
    return str(value)


def safe_bool(s: str | bool | None, default: bool = False) -> bool:
    """
    安全地将字符串转为布尔值

    Args:
        s: 待转换的字符串或布尔值
        default: 转换失败时的默认值

    Returns:
        转换后的布尔值或默认值
    """
    if s is None:
        return default
    if isinstance(s, bool):
        return s
    if isinstance(s, str):
        return s.lower() in ("true", "1", "yes", "on")
    return default


__all__ = ["safe_int", "safe_float", "safe_str", "safe_bool"]
