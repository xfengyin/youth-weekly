#!/usr/bin/env python3
"""测试 pydantic 配置系统"""

import os
import shutil
import sys
import tempfile
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import (
    AppConfig,
    AuthorConfig,
    BuildConfig,
    CategoryConfig,
    ContentConfig,
    OcpConfig,
    PathsConfig,
    RssConfig,
    SiteConfig,
    get_config_value,
    get_exclude_plugins,
    get_max_rss_items,
    get_site_name,
    get_site_url,
    load_config,
)


class TestPydanticModels:
    """测试 pydantic 配置模型"""

    def test_site_config_defaults(self):
        config = SiteConfig()
        assert config.name == "青年周刊"
        assert config.url == "https://youth-weekly.github.io"
        assert config.language == "zh-CN"

    def test_app_config_defaults(self):
        config = AppConfig()
        assert config.site.name == "青年周刊"
        assert config.content.max_rss_items == 20
        assert config.content.max_excerpt_length == 500
        assert config.ocp.exclude_plugins == []

    def test_app_config_from_dict(self):
        raw = {
            "site": {"name": "测试周刊", "url": "https://test.com"},
            "content": {"max_rss_items": 10},
            "ocp": {"exclude_plugins": ["test"]},
        }
        config = AppConfig.model_validate(raw)
        assert config.site.name == "测试周刊"
        assert config.site.url == "https://test.com"
        assert config.content.max_rss_items == 10
        assert config.ocp.exclude_plugins == ["test"]

    def test_category_config(self):
        cat = CategoryConfig(id="tech", name="科技", icon="🚀")
        assert cat.id == "tech"


class TestConfigFunctions:
    """测试配置加载函数"""

    def test_get_site_url(self):
        url = get_site_url()
        assert url.startswith("http")

    def test_get_site_name(self):
        name = get_site_name()
        assert name == "青年周刊"

    def test_get_max_rss_items(self):
        count = get_max_rss_items()
        assert isinstance(count, int)
        assert count > 0

    def test_get_exclude_plugins(self):
        excluded = get_exclude_plugins()
        assert isinstance(excluded, list)

    def test_get_config_value_dot_path(self):
        value = get_config_value("site.name")
        assert value == "青年周刊"

    def test_get_config_value_default(self):
        value = get_config_value("nonexistent.key", "fallback")
        assert value == "fallback"

    def test_get_config_value_nested(self):
        value = get_config_value("content.max_rss_items")
        assert value == 20


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
