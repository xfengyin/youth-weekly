#!/usr/bin/env python3
"""
OCP 注册中心 - 统一管理所有实现
⚠️ 禁止修改此文件，除非需要调整注册机制
"""

import threading
import logging
from typing import Dict, Type, Optional, Any
from functools import wraps
from .base import BasePlugin

logger = logging.getLogger(__name__)


class Registry:
    """
    插件注册中心

    负责：
    1. 管理所有插件实现
    2. 提供插件查找和获取接口
    3. 自动发现已注册的插件
    """

    _plugins: Dict[str, Type[BasePlugin]] = {}
    _instances: Dict[str, BasePlugin] = {}
    _lock = threading.Lock()

    @classmethod
    def register(cls, name: Optional[str] = None):
        """
        插件注册装饰器

        Args:
            name: 插件名称，不指定则使用类的 name 属性

        Usage:
            @Registry.register()
            class MyPlugin(BasePlugin):
                @property
                def name(self):
                    return "my_plugin"

                def execute(self, params):
                    pass
        """

        def decorator(plugin_class: Type[BasePlugin]):
            plugin_name = name

            if not plugin_name:
                try:
                    temp_instance = plugin_class()
                    plugin_name = temp_instance.name
                except Exception:
                    raise ValueError(
                        f"Plugin {plugin_class.__name__} must have a name property "
                        "or be registered with an explicit name"
                    )

            with cls._lock:
                if plugin_name in cls._plugins:
                    logger.warning("Overwriting plugin: %s", plugin_name)

                cls._plugins[plugin_name] = plugin_class
            return plugin_class

        return decorator

    @classmethod
    def get(cls, name: str) -> Optional[BasePlugin]:
        """
        获取插件实例（单例模式）

        Args:
            name: 插件名称

        Returns:
            插件实例，未找到返回 None
        """
        with cls._lock:
            if name not in cls._plugins:
                return None

            if name not in cls._instances:
                cls._instances[name] = cls._plugins[name]()

            return cls._instances[name]

    @classmethod
    def get_all(cls) -> Dict[str, BasePlugin]:
        """
        获取所有已注册的插件实例

        Returns:
            {插件名: 插件实例} 的字典
        """
        with cls._lock:
            result = {}
            for name in cls._plugins:
                if name not in cls._instances:
                    cls._instances[name] = cls._plugins[name]()
                result[name] = cls._instances[name]
            return result

    @classmethod
    def list_names(cls) -> list:
        """列出所有已注册的插件名称"""
        with cls._lock:
            return list(cls._plugins.keys())

    @classmethod
    def exists(cls, name: str) -> bool:
        """检查插件是否已注册"""
        with cls._lock:
            return name in cls._plugins

    @classmethod
    def clear(cls):
        """清空注册中心（用于测试）"""
        with cls._lock:
            cls._plugins.clear()
            cls._instances.clear()


def register(name: Optional[str] = None):
    """
    便捷装饰器函数 - 用于注册插件

    与 Registry.register() 功能相同，更简洁的调用方式
    """
    return Registry.register(name)
