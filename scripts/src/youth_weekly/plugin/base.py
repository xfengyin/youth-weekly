#!/usr/bin/env python3
"""
OCP 抽象层 - 定义统一接口规范
⚠️ 禁止修改此文件,除非需要调整核心接口定义
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BasePlugin(ABC):
    """
    插件基类 - 所有功能实现必须继承此类

    设计原则:
    1. 必须实现 execute() 方法
    2. 必须定义 name 属性
    3. 通过 @register() 装饰器注册到注册中心
    4. 可选实现 version/description/validate
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """插件唯一标识名称"""
        ...

    @property
    def version(self) -> str:
        """插件版本号(SemVer)"""
        return "1.0.0"

    @property
    def description(self) -> str:
        """插件描述(可选)"""
        return ""

    @abstractmethod
    def execute(self, params: dict[str, Any] | None = None) -> Any:
        """
        执行插件逻辑

        Args:
            params: 参数字典,由调用方传入

        Returns:
            执行结果
        """
        ...

    def validate(self, params: dict[str, Any] | None = None) -> bool:
        """
        验证参数(可选实现)

        Args:
            params: 参数字典

        Returns:
            是否通过验证
        """
        return True

    def to_metadata(self) -> dict[str, Any]:
        """导出元数据(用于发现/列表展示)"""
        return {
            "name": self.name,
            "version": self.version,
            "description": self.description,
        }


__all__ = ["BasePlugin"]
