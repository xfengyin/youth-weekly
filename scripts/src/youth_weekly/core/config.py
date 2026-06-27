#!/usr/bin/env python3
"""
配置加载模块 - 使用 pydantic 进行类型校验
"""

from __future__ import annotations

import logging
import os
import threading
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


def _resolve_root_dir() -> Path:
    """
    解析项目根目录(按优先级):
    1. 环境变量 YOUTH_WEEKLY_ROOT
    2. 路径推算(向后兼容 fallback)
    """
    # 优先级 1: 环境变量
    env_root = os.environ.get("YOUTH_WEEKLY_ROOT")
    if env_root:
        root_path = Path(env_root).resolve()
        if root_path.exists():
            logger.debug("ROOT_DIR from env: %s", root_path)
            return root_path
        logger.warning("YOUTH_WEEKLY_ROOT path not exists: %s", root_path)

    # 优先级 2: 路径推算 fallback
    fallback_root = (
        Path(__file__).resolve().parent.parent.parent.parent.parent
    )
    logger.debug("ROOT_DIR from fallback: %s", fallback_root)
    return fallback_root


# 模块级 ROOT_DIR(可通过环境变量覆盖)
ROOT_DIR: Path = _resolve_root_dir()


class SiteConfig(BaseModel):
    """站点配置"""

    name: str = "青年周刊"
    description: str = "为年轻人打造的内容聚合周刊"
    url: str = "https://xfengyin.github.io/youth-weekly"
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
    content_sources: str = "scripts/content_sources.yaml"
    curated_content: str = "scripts/.curated_content.json"
    dedup_db: str = "scripts/.content_dedup.db"


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
    python_version: str = "3.12"
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
_config_lock: threading.Lock = threading.Lock()


def _get_config_path() -> Path:
    """
    获取配置文件路径(按优先级):
    1. 项目根目录的 config.yaml
    2. scripts 目录下的 config.yaml(向后兼容)
    3. 环境变量 YOUTH_WEEKLY_CONFIG 指向的路径
    """
    config_path = ROOT_DIR / "config.yaml"
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
    加载配置(线程安全单例,可通过 force_reload 强制重载)

    使用双重检查锁定(double-checked locking)确保多线程环境下
    不会重复加载配置。

    Returns:
        完整应用配置对象
    """
    global _config

    # 第一次检查(无锁,快速路径)
    if _config is not None and not force_reload:
        return _config

    with _config_lock:
        # 第二次检查(持锁,防止并发重复加载)
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
            # 配置文件缺失属于可降级场景，回退默认配置并告警
            logger.warning("Config file not found, using defaults")
            _config = AppConfig()
        except (yaml.YAMLError, ValidationError) as exc:
            # YAML 语法错误 / Pydantic 校验错误属于致命问题，必须抛出
            logger.error("Failed to load config: %s", exc)
            raise

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
    return str(get_config_value("site.url", "https://xfengyin.github.io/youth-weekly"))


def get_site_name() -> str:
    """获取站点名称"""
    return str(get_config_value("site.name", "青年周刊"))


def get_docs_dir() -> Path:
    """获取文档目录"""
    config = load_config()
    docs_path: str = config.paths.docs
    return ROOT_DIR / docs_path


def get_issues_dir() -> Path:
    """获取周刊目录"""
    config = load_config()
    issues_path: str = config.paths.issues
    return ROOT_DIR / issues_path


def get_output_dir() -> Path:
    """获取输出目录"""
    config = load_config()
    output_path: str = config.paths.output
    return ROOT_DIR / output_path


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


def get_content_sources_path() -> Path:
    """获取内容源配置文件路径"""
    config = load_config()
    sources_path: str = config.paths.content_sources
    return ROOT_DIR / sources_path


def get_curated_content_path() -> Path:
    """获取策展内容输出文件路径"""
    config = load_config()
    curated_path: str = config.paths.curated_content
    return ROOT_DIR / curated_path


def get_dedup_db_path() -> Path:
    """获取去重数据库文件路径"""
    config = load_config()
    dedup_path: str = config.paths.dedup_db
    return ROOT_DIR / dedup_path


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
    "get_issues_dir",
    "get_output_dir",
    "get_categories",
    "get_max_rss_items",
    "get_exclude_plugins",
    "get_content_sources_path",
    "get_curated_content_path",
    "get_dedup_db_path",
]
