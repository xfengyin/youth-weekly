#!/usr/bin/env python3
"""
插件系统测试
"""

import sys
from pathlib import Path

import pytest

# 支持直接执行时找到 src 模块
_script_dir = Path(__file__).parent.parent
if str(_script_dir / "src") not in sys.path:
    sys.path.insert(0, str(_script_dir / "src"))


class TestPluginRegistry:
    """测试插件注册中心"""

    def test_registry_exists(self):
        """测试插件存在性检查"""
        from youth_weekly.plugin import Registry

        # 至少 example 插件应该被注册
        assert Registry.exists("example")

    def test_registry_get(self):
        """测试获取插件"""
        from youth_weekly.plugin import Registry

        plugin = Registry.get("example")
        assert plugin is not None
        assert plugin.name == "example"

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
        assert "example" in names

    def test_registry_metadata(self):
        """测试获取元数据"""
        from youth_weekly.plugin import Registry

        metadata = Registry.list_metadata()
        assert isinstance(metadata, list)
        example_meta = next((m for m in metadata if m["name"] == "example"), None)
        assert example_meta is not None
        assert "description" in example_meta
        assert "version" in example_meta

    def test_execute_plugin_success(self):
        """测试成功执行插件"""
        from youth_weekly.plugin import Registry

        result = Registry.execute_plugin("example", {"message": "Hello", "repeat": 3})
        assert result["status"] == "success"
        assert result["message"] == "HelloHelloHello"

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


class TestPluginDiscovery:
    """测试插件发现和加载"""

    def test_discover_plugins(self, tmp_path):
        """测试插件发现"""
        from youth_weekly.plugin.loader import discover_plugins

        # 创建测试插件目录
        plugin_dir = tmp_path / "plugins"
        plugin_dir.mkdir()
        (plugin_dir / "test_plugin.py").write_text("# test plugin")

        files = discover_plugins(plugin_dir)
        assert len(files) == 1

    def test_discover_plugins_excludes_init(self, tmp_path):
        """测试排除 __init__.py"""
        from youth_weekly.plugin.loader import discover_plugins

        plugin_dir = tmp_path / "plugins"
        plugin_dir.mkdir()
        (plugin_dir / "__init__.py").write_text("# init")
        (plugin_dir / "real_plugin.py").write_text("# plugin")

        files = discover_plugins(plugin_dir)
        assert len(files) == 1
        assert "real_plugin" in str(files[0])

    def test_discover_plugins_nonexistent(self, tmp_path):
        """测试不存在的目录"""
        from youth_weekly.plugin.loader import discover_plugins

        files = discover_plugins(tmp_path / "nonexistent")
        assert files == []


class TestPluginExecution:
    """测试插件执行功能"""

    def test_example_plugin(self):
        """测试示例插件"""
        from youth_weekly.plugin import Registry

        plugin = Registry.get("example")
        result = plugin.execute({"message": "Test", "repeat": 1})
        assert result["plugin"] == "example"
        assert result["status"] == "success"

    def test_hello_world_plugin(self):
        """测试 Hello World 插件"""
        from youth_weekly.plugin import Registry

        plugin = Registry.get("hello_world")
        result = plugin.execute()
        assert result["greeting"] == "Hello, World!"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
