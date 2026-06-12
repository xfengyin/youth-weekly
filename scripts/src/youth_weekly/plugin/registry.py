#!/usr/bin/env python3
"""
OCP 注册中心 - 统一管理所有实现
⚠️ 禁止修改此文件,除非需要调整注册机制
"""

from __future__ import annotations

import logging
import threading
from typing import Any, Callable, Type, TypeVar

from .base import BasePlugin

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BasePlugin)


class Registry:
    """
    插件注册中心(线程安全单例)

    职责:
    1. 管理所有插件实现
    2. 提供插件查找和获取接口
    3. 自动发现已注册的插件
    4. 支持插件元数据查询
    5. 统一执行入口(带异常处理)
    """

    _plugins: dict[str, Type[BasePlugin]] = {}
    _instances: dict[str, BasePlugin] = {}
    _lock = threading.RLock()

    # ---------------- 注册 ---------------- #

    @classmethod
    def register(
        cls, name: str | None = None, allow_override: bool = False
    ) -> Callable[[Type[BasePlugin]], Type[BasePlugin]]:
        """
        插件注册装饰器

        Args:
            name: 插件名称,不指定则使用类的 name 属性
            allow_override: 是否允许覆盖已注册的同名插件,默认 False(抛出异常)

        Usage:
            @Registry.register()
            class MyPlugin(BasePlugin):
                @property
                def name(self):
                    return "my_plugin"

                def execute(self, params):
                    pass
        """

        def decorator(plugin_class: Type[BasePlugin]) -> Type[BasePlugin]:
            plugin_name = name

            if not plugin_name:
                try:
                    temp_instance = plugin_class()
                    plugin_name = temp_instance.name
                except Exception as exc:
                    raise ValueError(
                        f"Plugin {plugin_class.__name__} must have a name "
                        f"property or be registered with an explicit name: {exc}"
                    ) from exc

            with cls._lock:
                if plugin_name in cls._plugins:
                    if allow_override:
                        logger.warning("Overwriting plugin: %s", plugin_name)
                        cls._instances.pop(plugin_name, None)
                    else:
                        raise ValueError(
                            f"Plugin '{plugin_name}' is already registered. "
                            "Use allow_override=True to replace it."
                        )
                cls._plugins[plugin_name] = plugin_class
            logger.debug(
                "Registered plugin: %s -> %s", plugin_name, plugin_class.__name__
            )
            return plugin_class

        return decorator

    # ---------------- 查询 ---------------- #

    @classmethod
    def get(cls, name: str) -> BasePlugin | None:
        """
        获取插件实例(单例模式)

        Args:
            name: 插件名称

        Returns:
            插件实例,未找到返回 None
        """
        with cls._lock:
            if name not in cls._plugins:
                return None

            if name not in cls._instances:
                cls._instances[name] = cls._plugins[name]()

            return cls._instances[name]

    @classmethod
    def get_all(cls) -> dict[str, BasePlugin]:
        """获取所有已注册的插件实例"""
        with cls._lock:
            result: dict[str, BasePlugin] = {}
            for name in cls._plugins:
                if name not in cls._instances:
                    cls._instances[name] = cls._plugins[name]()
                result[name] = cls._instances[name]
            return result

    @classmethod
    def list_names(cls) -> list[str]:
        """列出所有已注册的插件名称"""
        with cls._lock:
            return list(cls._plugins.keys())

    @classmethod
    def list_metadata(cls) -> list[dict[str, Any]]:
        """列出所有插件的元数据"""
        with cls._lock:
            return [p.to_metadata() for p in cls.get_all().values()]

    @classmethod
    def exists(cls, name: str) -> bool:
        """检查插件是否已注册"""
        with cls._lock:
            return name in cls._plugins

    # ---------------- 执行 ---------------- #

    @classmethod
    def execute_plugin(cls, name: str, params: dict[str, Any] | None = None) -> Any:
        """
        统一执行入口(带异常处理与日志)

        Args:
            name: 插件名称
            params: 参数

        Returns:
            插件执行结果

        Raises:
            ValueError: 插件不存在
            RuntimeError: 插件执行失败(包装后)
        """
        plugin = cls.get(name)
        if plugin is None:
            raise ValueError(f"Plugin not found: {name}")

        try:
            logger.info("Executing plugin: %s", name)
            result = plugin.execute(params or {})
            logger.info("Plugin %s executed successfully", name)
            return result
        except Exception as exc:
            logger.error("Plugin %s execution failed: %s", name, exc, exc_info=True)
            raise RuntimeError(f"Plugin execution failed [{name}]: {exc}") from exc

    # ---------------- 维护 ---------------- #

    @classmethod
    def clear(cls) -> None:
        """清空注册中心(仅用于测试)"""
        with cls._lock:
            cls._plugins.clear()
            cls._instances.clear()


def register(
    name: str | None = None, allow_override: bool = False
) -> Callable[[Type[BasePlugin]], Type[BasePlugin]]:
    """
    便捷装饰器函数 - 用于注册插件

    与 Registry.register() 功能相同,更简洁的调用方式
    """
    return Registry.register(name, allow_override)


__all__ = ["Registry", "register"]
