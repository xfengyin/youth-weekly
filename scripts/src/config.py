#!/usr/bin/env python3
"""
配置加载模块
"""
import os
import yaml
from pathlib import Path
from typing import Optional, Any


_config: Optional[dict] = None


def get_config_path() -> Path:
    """获取配置文件路径"""
    root_dir = Path(__file__).parent.parent
    config_path = root_dir / "config.yaml"

    if config_path.exists():
        return config_path

    env_config_path = os.environ.get('YOUTH_WEEKLY_CONFIG')
    if env_config_path and Path(env_config_path).exists():
        return Path(env_config_path)

    raise FileNotFoundError(f"config.yaml not found at {config_path}")


def load_config(force_reload: bool = False) -> dict:
    """加载配置"""
    global _config

    if _config is not None and not force_reload:
        return _config

    config_path = get_config_path()

    with open(config_path, 'r', encoding='utf-8') as f:
        _config = yaml.safe_load(f)

    return _config


def get_config(key: str, default: Any = None) -> Any:
    """获取配置项"""
    config = load_config()

    keys = key.split('.')
    value = config

    for k in keys:
        if isinstance(value, dict):
            value = value.get(k)
        else:
            return default

        if value is None:
            return default

    return value


def get_site_url() -> str:
    """获取站点 URL"""
    return get_config('site.url', 'https://youth-weekly.github.io')


def get_site_name() -> str:
    """获取站点名称"""
    return get_config('site.name', '青年周刊')


def get_docs_dir() -> Path:
    """获取文档目录"""
    root_dir = Path(__file__).parent.parent
    docs_path = get_config('paths.docs', 'docs')
    return root_dir / docs_path


def get_output_dir() -> Path:
    """获取输出目录"""
    root_dir = Path(__file__).parent.parent
    output_path = get_config('paths.output', 'scripts/dist')
    return root_dir / output_path


def get_categories() -> list:
    """获取分类列表"""
    return get_config('categories', [])


def get_max_rss_items() -> int:
    """获取 RSS 最大条目数"""
    return get_config('content.max_rss_items', 20)
