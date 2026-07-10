#!/usr/bin/env python3
"""
企业级日志系统
================

特性:
- 统一日志格式(时间/级别/模块/消息)
- 彩色控制台输出(可关闭)
- 文件输出(可选)
- 执行时间装饰器
- 异常捕获装饰器
- 线程安全
- Python 3.14 现代类型注解
"""

from __future__ import annotations

import functools
import logging
import sys
import time
from pathlib import Path
from typing import Callable, ParamSpec, TypeVar

# 类型变量用于装饰器签名保留
P = ParamSpec("P")
R = TypeVar("R")

# ANSI 颜色码
_COLOR_MAP: dict[str, str] = {
    "DEBUG": "\033[36m",  # 青色
    "INFO": "\033[32m",  # 绿色
    "WARNING": "\033[33m",  # 黄色
    "ERROR": "\033[31m",  # 红色
    "CRITICAL": "\033[35m",  # 紫色
}
_RESET = "\033[0m"
_BOLD = "\033[1m"


class ColoredFormatter(logging.Formatter):
    """
    彩色日志格式化器

    在 TTY 环境下添加 ANSI 颜色,便于人眼快速定位日志级别。
    非 TTY 环境(如 CI/文件)自动降级为纯文本,避免污染日志。
    """

    def __init__(
        self,
        fmt: str | None = None,
        datefmt: str | None = None,
        use_color: bool | None = None,
    ) -> None:
        super().__init__(fmt=fmt, datefmt=datefmt)
        # 自动检测:有 stdout 时使用颜色
        self.use_color = use_color if use_color is not None else sys.stdout.isatty()

    def format(self, record: logging.LogRecord) -> str:
        """格式化日志记录,可选添加颜色"""
        message = super().format(record)
        if self.use_color and record.levelname in _COLOR_MAP:
            return f"{_COLOR_MAP[record.levelname]}{message}{_RESET}"
        return message


def setup_logger(
    name: str = "youth_weekly",
    level: int = logging.INFO,
    log_file: Path | None = None,
    console: bool = True,
    use_color: bool | None = None,
) -> logging.Logger:
    """
    初始化并配置一个 logger

    Args:
        name: logger 名称
        level: 日志级别
        log_file: 日志文件路径(可选)
        console: 是否输出到控制台
        use_color: 是否使用颜色(None 时自动检测)

    Returns:
        配置完成的 Logger 实例
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.propagate = False

    # 清理旧 handler 避免重复输出
    for handler in list(logger.handlers):
        logger.removeHandler(handler)

    fmt = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    datefmt = "%Y-%m-%d %H:%M:%S"

    if console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        console_handler.setFormatter(ColoredFormatter(fmt, datefmt, use_color))
        logger.addHandler(console_handler)

    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setLevel(level)
        # 文件不使用颜色
        file_handler.setFormatter(logging.Formatter(fmt, datefmt))
        logger.addHandler(file_handler)

    return logger


def get_logger(name: str | None = None) -> logging.Logger:
    """
    获取一个 logger(若不存在则按默认配置初始化)

    Args:
        name: 模块名(如 __name__),为空时使用根 logger

    Returns:
        Logger 实例
    """
    logger_name = name or "youth_weekly"
    logger = logging.getLogger(logger_name)
    if not logger.handlers:
        return setup_logger(logger_name)
    return logger


def log_execution_time(
    logger: logging.Logger | None = None,
    level: int = logging.INFO,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """
    装饰器:记录函数执行时间

    Usage:
        @log_execution_time()
        def my_func():
            ...
    """

    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        local_logger = logger or get_logger(func.__module__)

        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            start = time.perf_counter()
            try:
                result: R = func(*args, **kwargs)
                elapsed = (time.perf_counter() - start) * 1000
                local_logger.log(
                    level,
                    f"{func.__name__} completed in {elapsed:.2f}ms",
                )
                return result
            except Exception as exc:
                elapsed = (time.perf_counter() - start) * 1000
                local_logger.error(
                    f"{func.__name__} failed after {elapsed:.2f}ms: {exc}",
                )
                raise

        return wrapper

    return decorator


def log_exception(
    logger: logging.Logger | None = None,
    reraise: bool = True,
    level: int = logging.ERROR,
) -> Callable[[Callable[P, R | None]], Callable[P, R | None]]:
    """
    装饰器:捕获并记录异常

    Args:
        logger: 自定义 logger
        reraise: 是否重新抛出异常(默认 True)
        level: 异常日志级别
    """

    def decorator(func: Callable[P, R | None]) -> Callable[P, R | None]:
        local_logger = logger or get_logger(func.__module__)

        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R | None:
            try:
                return func(*args, **kwargs)
            except Exception as exc:
                local_logger.log(
                    level,
                    f"{func.__name__} raised {type(exc).__name__}: {exc}",
                    exc_info=True,
                )
                if reraise:
                    raise
                return None

        return wrapper

    return decorator


__all__ = [
    "ColoredFormatter",
    "setup_logger",
    "get_logger",
    "log_execution_time",
    "log_exception",
]
