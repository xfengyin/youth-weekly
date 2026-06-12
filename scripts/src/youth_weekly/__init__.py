#!/usr/bin/env python3
"""
青年周刊核心业务包
====================

企业级 Agent 工程化版本,所有代码遵循:
- 开闭原则 (OCP) - 通过 plugin 体系实现
- 依赖倒置 - 面向抽象接口
- 单一职责 - 模块功能单一
- 接口隔离 - 轻量细粒度接口
- 高可用 - 异常处理、重试、降级
- 可观测 - 统一日志、装饰器
- 配置驱动 - Pydantic Settings
- 插件化 - SPI 插件架构
- 幂等 - 防重复执行
- 安全 - 路径校验、XSS 防护
"""

from __future__ import annotations

__version__ = "2.0.0"
__author__ = "青年周刊编辑部"

# 公共 API
__all__ = [
    "core",
    "plugin",
    "plugins",
]
