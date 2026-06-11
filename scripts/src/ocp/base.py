#!/usr/bin/env python3
"""
OCP 抽象层 - 定义统一接口规范
⚠️ 禁止修改此文件，除非需要调整核心接口定义
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, TypedDict


class PluginParams(TypedDict, total=False):
    """插件参数类型定义"""
    docs_dir: str
    output_path: str
    issues: List[Dict[str, Any]]


class BasePlugin(ABC):
    """
    插件基类 - 所有功能实现必须继承此类

    实现类要求：
    1. 必须实现 execute() 方法
    2. 必须定义 name 属性
    3. 通过 @register() 装饰器注册到注册中心
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """插件唯一标识名称"""
        pass

    @property
    def description(self) -> str:
        """插件描述（可选）"""
        return ""

    @abstractmethod
    def execute(self, params: Optional[Dict[str, Any]] = None) -> Any:
        """
        执行插件逻辑

        Args:
            params: 参数字典，由调用方传入

        Returns:
            执行结果
        """
        pass

    def validate(self, params: Optional[Dict[str, Any]] = None) -> bool:
        """
        验证参数（可选实现）

        Args:
            params: 参数字典

        Returns:
            是否通过验证
        """
        return True
