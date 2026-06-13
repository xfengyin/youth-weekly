#!/usr/bin/env python3
"""
示例插件 - 演示如何添加新功能
✅ 符合 OCP 原则:新增功能只加新文件
"""

from __future__ import annotations

import logging
from typing import Any

from youth_weekly.plugin import BasePlugin, register

logger = logging.getLogger(__name__)


@register()
class ExamplePlugin(BasePlugin):
    """示例插件 - 演示 OCP 架构的使用"""

    name: str = "example"
    version: str = "1.0.0"
    description: str = "示例插件,演示如何使用 OCP 架构"

    def execute(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        示例执行逻辑

        Args:
            params: 参数字典,支持:
                - message: 自定义消息
                - repeat: 重复次数

        Returns:
            处理结果
        """
        params = params or {}
        message = params.get("message", "Hello, OCP!")
        repeat = int(params.get("repeat", 1))

        result: dict[str, Any] = {
            "message": message * repeat,
            "status": "success",
            "plugin": self.name,
        }
        logger.info("Example plugin executed with message: %s", message)
        return result


@register()
class HelloWorldPlugin(BasePlugin):
    """Hello World 插件 - 最简单的实现示例"""

    name: str = "hello_world"
    version: str = "1.0.0"
    description: str = "Hello World 示例插件"

    def execute(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        return {
            "greeting": "Hello, World!",
            "plugin": self.name,
        }


__all__ = ["ExamplePlugin", "HelloWorldPlugin"]
