#!/usr/bin/env python3
"""
共享工具函数
"""


def safe_int(s: str | None, default: int = 0) -> int:
    """安全地将字符串转为整数，转换失败时返回默认值"""
    if s is None:
        return default
    try:
        return int(s)
    except (ValueError, TypeError):
        return default
