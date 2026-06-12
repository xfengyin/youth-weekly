#!/usr/bin/env python3
"""
配置加载模块 - 使用 pydantic 进行类型校验
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field

# 项目根目录 (scripts/src/youth_weekly/core/config.py -> 4 级 -> ROOT)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent


def _project_root() -> Path:
    """获取项目根目录(可被测试 monkeypatch)"""
    return ROOT_DIR


logger = logging.getLogger(__name__)


class SiteConfig(BaseModel):
    """站点配置"""

    name: str = "青年周刊"
    description: str = "为年轻人打造的内容聚合周刊"
    url: str = "https://youth-weekly.github.io"
    email: str = "contact@youth-weekly.com"
    language: str = "zh-CN"


class AuthorConfig(BaseModel):
    """作者配置"""

    name: str = "青年周刊编辑部"
    email: str = "youth-weekly@example.com"
    github: str = "https://github.com/xfengyin/youth-weekly"


class PathsConfig(BaseModel):
    """路径配置"""

    docs: str = "docs"
    issues: str = "docs/issues"
    assets: str = "docs/assets"
    output: str = "scripts/dist"


class CategoryConfig(BaseModel):
    """分类配置"""

    id: str
    name: str
    icon: str


class ContentConfig(BaseModel):
    """内容配置"""

    max_excerpt_length: int = 500
    max_search_excerpt: int = 200
    max_rss_items: int = 20
    newsletter_highlights_length: int = 1000


class RssConfig(BaseModel):
    """RSS 配置"""

    title: str = "青年周刊"
    description: str = (
        "为年轻人打造的内容聚合周刊 - 融合科技、二次元、游戏、成长等多个领域"
    )
    subtitle: str = "每周精选科技、二次元、游戏、成长内容"


class BuildConfig(BaseModel):
    """构建配置"""

    node_version: str = "20"
    python_version: str = "3.14"
    output_dir: str = "web/out"


class OcpConfig(BaseModel):
    """OCP 插件配置"""

    exclude_plugins: list[str] = Field(default_factory=list)


class AppConfig(BaseModel):
    """顶层应用配置"""

    site: SiteConfig = Field(default_factory=SiteConfig)
    author: AuthorConfig = Field(default_factory=AuthorConfig)
    paths: PathsConfig = Field(default_factory=PathsConfig)
    categories: list[CategoryConfig] = Field(default_factory=list)
    content: ContentConfig = Field(default_factory=ContentConfig)
    rss: RssConfig = Field(default_factory=RssConfig)
    build: BuildConfig = Field(default_factory=BuildConfig)
    ocp: OcpConfig = Field(default_factory=OcpConfig)

    model_config: dict[str, object] = {  # type: ignore[assignment,misc]
        "env_prefix": "YOUTH_WEEKLY_",
        "env_nested_delimiter": "__",
    }


_config: AppConfig | None = None


def _get_config_path() -> Path:
    """
    获取配置文件路径(按优先级):
    1. 项目根目录的 config.yaml
    2. scripts 目录下的 config.yaml(向后兼容)
    3. 环境变量 YOUTH_WEEKLY_CONFIG 指向的路径
    """
    root_dir = _project_root()
    config_path = root_dir / "config.yaml"
    if config_path.exists():
        return config_path

    scripts_dir = Path(__file__).resolve().parent.parent.parent.parent
    scripts_config_path = scripts_dir / "config.yaml"
    if scripts_config_path.exists():
        return scripts_config_path

    env_config_path = os.environ.get("YOUTH_WEEKLY_CONFIG")
    if env_config_path and Path(env_config_path).exists():
        return Path(env_config_path)

    raise FileNotFoundError(f"config.yaml not found at {config_path}")


def load_config(force_reload: bool = False) -> AppConfig:
    """
    加载配置(单例,可通过 force_reload 强制重载)

    Returns:
        完整应用配置对象
    """
    global _config

    if _config is not None and not force_reload:
        return _config

    try:
        config_path = _get_config_path()
        logger.info("Loading config from %s", config_path)
        with open(config_path, "r", encoding="utf-8") as f:
            raw_config = yaml.safe_load(f)
        _config = AppConfig.model_validate(raw_config or {})
        logger.info("Config loaded successfully")
    except FileNotFoundError:
        logger.warning("Config file not found, using defaults")
        _config = AppConfig()
    except Exception as exc:
        logger.error("Failed to load config: %s", exc)
        _config = AppConfig()

    return _config


def get_config() -> AppConfig:
    """获取完整配置对象(便捷函数)"""
    return load_config()


def get_config_value(key: str, default: Any = None) -> Any:
    """
    通过点分路径获取配置值(向后兼容)

    Args:
        key: 点分配置键,如 'site.url'
        default: 默认值

    Returns:
        配置值
    """
    config = load_config()
    value: Any = config
    for k in key.split("."):
        if hasattr(value, k):
            value = getattr(value, k)
        else:
            return default
        if value is None:
            return default
    return value if not isinstance(value, BaseModel) else value.model_dump()


def get_site_url() -> str:
    """获取站点 URL"""
    return str(get_config_value("site.url", "https://youth-weekly.github.io"))


def get_site_name() -> str:
    """获取站点名称"""
    return str(get_config_value("site.name", "青年周刊"))


def get_docs_dir() -> Path:
    """获取文档目录"""
    root_dir = _project_root()
    config = load_config()
    docs_path: str = config.paths.docs
    return root_dir / docs_path


def get_output_dir() -> Path:
    """获取输出目录"""
    root_dir = _project_root()
    config = load_config()
    output_path: str = config.paths.output
    return root_dir / output_path


def get_categories() -> list[dict[str, str]]:
    """获取分类列表"""
    return [c.model_dump() for c in load_config().categories]


def get_max_rss_items() -> int:
    """获取 RSS 最大条目数"""
    return int(get_config_value("content.max_rss_items", 20))


def get_exclude_plugins() -> list[str]:
    """获取需要排除的插件列表"""
    value = get_config_value("ocp.exclude_plugins", [])
    return list(value) if value else []


__all__ = [
    "ROOT_DIR",
    "AppConfig",
    "SiteConfig",
    "AuthorConfig",
    "PathsConfig",
    "CategoryConfig",
    "ContentConfig",
    "RssConfig",
    "BuildConfig",
    "OcpConfig",
    "load_config",
    "get_config",
    "get_config_value",
    "get_site_url",
    "get_site_name",
    "get_docs_dir",
    "get_output_dir",
    "get_categories",
    "get_max_rss_items",
    "get_exclude_plugins",
]
