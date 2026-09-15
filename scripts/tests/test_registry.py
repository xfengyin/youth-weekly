#!/usr/bin/env python3
"""
插件系统测试
"""

import pytest


class TestPluginRegistry:
    """测试插件注册中心"""

    def test_registry_exists(self):
        """测试插件存在性检查"""
        from youth_weekly.plugin import Registry

        # 至少 stats 插件应该被注册
        assert Registry.exists("stats")

    def test_registry_get(self):
        """测试获取插件"""
        from youth_weekly.plugin import Registry

        plugin = Registry.get("stats")
        assert plugin is not None
        assert plugin.name == "stats"

    def test_registry_get_nonexistent(self):
        """测试获取不存在的插件"""
        from youth_weekly.plugin import Registry

        result = Registry.get("nonexistent_plugin_xyz")
        assert result is None

    def test_registry_list(self):
        """测试列出插件"""
        from youth_weekly.plugin import Registry

        names = Registry.list_names()
        assert isinstance(names, list)
        assert "stats" in names

    def test_registry_metadata(self):
        """测试获取元数据"""
        from youth_weekly.plugin import Registry

        metadata = Registry.list_metadata()
        assert isinstance(metadata, list)
        stats_meta = next((m for m in metadata if m["name"] == "stats"), None)
        assert stats_meta is not None
        assert "description" in stats_meta
        assert "version" in stats_meta

    def test_execute_plugin_success(self):
        """测试成功执行插件"""
        from youth_weekly.plugin import BasePlugin, Registry, register

        @register(allow_override=True)
        class _TestSuccessPlugin(BasePlugin):
            name = "_test_success_plugin"

            def execute(self, params=None):
                return {"status": "success", "message": "Hello" * 3}

        try:
            result = Registry.execute_plugin("_test_success_plugin")
            assert result["status"] == "success"
            assert result["message"] == "HelloHelloHello"
        finally:
            Registry._plugins.pop("_test_success_plugin", None)
            Registry._instances.pop("_test_success_plugin", None)

    def test_execute_plugin_not_found(self):
        """测试执行不存在的插件"""
        from youth_weekly.plugin import Registry

        with pytest.raises(ValueError, match="Plugin not found"):
            Registry.execute_plugin("nonexistent_xyz")

    def test_execute_plugin_failure(self):
        """测试插件执行失败"""
        from youth_weekly.plugin import BasePlugin, Registry, register

        @register(allow_override=True)
        class FailingPlugin(BasePlugin):
            @property
            def name(self) -> str:
                return "_test_failing_plugin"

            def execute(self, params=None):
                raise RuntimeError("Intentional failure")

        try:
            with pytest.raises(RuntimeError, match="Plugin execution failed"):
                Registry.execute_plugin("_test_failing_plugin")
        finally:
            # 清理
            Registry._plugins.pop("_test_failing_plugin", None)
            Registry._instances.pop("_test_failing_plugin", None)
