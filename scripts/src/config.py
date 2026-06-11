#!/usr/bin/env python3
"""
配置加载模块 - 使用 pydantic 进行类型校验
"""
import os
import yaml
import logging
from pathlib import Path
from typing import Optional, List

from pydantic import BaseModel, Field


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
    description: str = "为年轻人打造的内容聚合周刊 - 融合科技、二次元、游戏、成长等多个领域"
    subtitle: str = "每周精选科技、二次元、游戏、成长内容"


class BuildConfig(BaseModel):
    """构建配置"""
    node_version: str = "20"
    python_version: str = "3.11"
    output_dir: str = "web/out"


class OcpConfig(BaseModel):
    """OCP 插件配置"""
    exclude_plugins: List[str] = Field(default_factory=list)


class AppConfig(BaseModel):
    """顶层应用配置"""
    site: SiteConfig = Field(default_factory=SiteConfig)
    author: AuthorConfig = Field(default_factory=AuthorConfig)
    paths: PathsConfig = Field(default_factory=PathsConfig)
    categories: List[CategoryConfig] = Field(default_factory=list)
    content: ContentConfig = Field(default_factory=ContentConfig)
    rss: RssConfig = Field(default_factory=RssConfig)
    build: BuildConfig = Field(default_factory=BuildConfig)
    ocp: OcpConfig = Field(default_factory=OcpConfig)

    model_config = {
        "env_prefix": "YOUTH_WEEKLY_",
        "env_nested_delimiter": "__",
    }


_config: Optional[AppConfig] = None


def _get_config_path() -> Path:
    """获取配置文件路径"""
    # 从 scripts/src/config.py 向上两级到项目根目录
    root_dir = Path(__file__).resolve().parent.parent.parent
    config_path = root_dir / "config.yaml"

    if config_path.exists():
        return config_path

    # 也尝试 scripts 目录（向后兼容）
    scripts_dir = Path(__file__).parent.parent
    scripts_config_path = scripts_dir / "config.yaml"
    if scripts_config_path.exists():
        return scripts_config_path

    env_config_path = os.environ.get('YOUTH_WEEKLY_CONFIG')
    if env_config_path and Path(env_config_path).exists():
        return Path(env_config_path)

    raise FileNotFoundError(f"config.yaml not found at {config_path}")


def load_config(force_reload: bool = False) -> AppConfig:
    """加载配置"""
    global _config

    if _config is not None and not force_reload:
        return _config

    try:
        config_path = _get_config_path()
        logger.info("Loading config from %s", config_path)

        with open(config_path, 'r', encoding='utf-8') as f:
            raw_config = yaml.safe_load(f)

        _config = AppConfig.model_validate(raw_config)
        logger.info("Config loaded successfully")
    except FileNotFoundError:
        logger.warning("Config file not found, using defaults")
        _config = AppConfig()
    except Exception as e:
        logger.error("Failed to load config: %s", e)
        _config = AppConfig()

    return _config


def get_config() -> AppConfig:
    """获取完整配置对象"""
    return load_config()


def get_config_value(key: str, default=None):
    """
    通过点分路径获取配置值（向后兼容）

    Args:
        key: 点分配置键，如 'site.url'
        default: 默认值

    Returns:
        配置值
    """
    config = load_config()
    keys = key.split('.')
    value = config

    for k in keys:
        if hasattr(value, k):
            value = getattr(value, k)
        else:
            return default

        if value is None:
            return default

    return value if not isinstance(value, BaseModel) else value.model_dump()


def get_site_url() -> str:
    """获取站点 URL"""
    return get_config_value('site.url', 'https://youth-weekly.github.io')


def get_site_name() -> str:
    """获取站点名称"""
    return get_config_value('site.name', '青年周刊')


def get_docs_dir() -> Path:
    """获取文档目录"""
    root_dir = Path(__file__).resolve().parent.parent.parent
    config = load_config()
    docs_path = config.paths.docs
    return root_dir / docs_path


def get_output_dir() -> Path:
    """获取输出目录"""
    root_dir = Path(__file__).resolve().parent.parent.parent
    config = load_config()
    output_path = config.paths.output
    return root_dir / output_path


def get_categories() -> list:
    """获取分类列表"""
    config = load_config()
    return [c.model_dump() for c in config.categories]


def get_max_rss_items() -> int:
    """获取 RSS 最大条目数"""
    return get_config_value('content.max_rss_items', 20)


def get_exclude_plugins() -> list:
    """获取需要排除的插件列表"""
    return get_config_value('ocp.exclude_plugins', [])
