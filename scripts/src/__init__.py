#!/usr/bin/env python3
"""
共享内容加载模块
提供统一的周刊内容读取接口
"""
import yaml
from pathlib import Path
from typing import Optional, List
from datetime import date, datetime


class ContentLoadError(Exception):
    """内容加载错误"""
    pass


def _serialize_value(value):
    """序列化 YAML 值，确保日期等类型可被 JSON 序列化"""
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _serialize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_serialize_value(v) for v in value]
    return value


def load_issue(issue_dir: Path, docs_dir: Optional[Path] = None) -> Optional[dict]:
    """
    加载单期周刊

    Args:
        issue_dir: 周刊目录路径
        docs_dir: 文档根目录（用于安全校验）

    Returns:
        周刊数据字典，失败返回 None
    """
    if not issue_dir.is_dir():
        return None

    readme_path = issue_dir / "README.md"
    if not readme_path.exists():
        return None

    try:
        content = readme_path.read_text(encoding='utf-8')
    except Exception as e:
        print(f"⚠️ Failed to read {readme_path}: {e}")
        return None

    if not content.startswith('---'):
        return None

    try:
        parts = content.split('---', 2)
        if len(parts) < 3:
            return None

        front_matter = yaml.safe_load(parts[1])
        if not isinstance(front_matter, dict):
            return None

        front_matter = _serialize_value(front_matter)

        return {
            **front_matter,
            'content': parts[2].strip(),
            'slug': issue_dir.name
        }
    except yaml.YAMLError as e:
        print(f"⚠️ YAML parse error in {issue_dir}: {e}")
        return None
    except Exception as e:
        print(f"⚠️ Unexpected error loading {issue_dir}: {e}")
        return None


def safe_resolve_path(base_dir: Path, target_name: str) -> Optional[Path]:
    """
    安全路径解析，防止路径遍历攻击

    Args:
        base_dir: 基础目录
        target_name: 目标名称

    Returns:
        安全的绝对路径，校验失败返回 None
    """
    try:
        base_resolved = base_dir.resolve()
        target_path = (base_dir / target_name).resolve()

        if not str(target_path).startswith(str(base_resolved)):
            return None

        return target_path
    except Exception:
        return None


def load_all_issues(
    docs_dir: Path,
    reverse: bool = True,
    include_unpublished: bool = False
) -> List[dict]:
    """
    加载所有周刊

    Args:
        docs_dir: 文档根目录
        reverse: 是否降序排列（默认 True，最新在前）
        include_unpublished: 是否包含未发布内容

    Returns:
        周刊列表
    """
    issues_dir = docs_dir / "issues"

    if not issues_dir.exists():
        print(f"⚠️ Issues directory not found: {issues_dir}")
        return []

    issues = []
    sorted_dirs = sorted(
        issues_dir.iterdir(),
        key=lambda p: p.name,
        reverse=reverse
    )

    for issue_dir in sorted_dirs:
        if not issue_dir.is_dir():
            continue

        if not issue_dir.name.isdigit():
            continue

        issue = load_issue(issue_dir, docs_dir)
        if issue is None:
            continue

        if not include_unpublished and not issue.get('published', True):
            continue

        issues.append(issue)

    return issues


def get_latest_issue(docs_dir: Path) -> Optional[dict]:
    """
    获取最新一期周刊

    Args:
        docs_dir: 文档根目录

    Returns:
        最新周刊数据，未找到返回 None
    """
    issues = load_all_issues(docs_dir, reverse=True)
    return issues[0] if issues else None


def get_issue_count(docs_dir: Path) -> int:
    """
    获取已发布的周刊数量

    Args:
        docs_dir: 文档根目录

    Returns:
        周刊数量
    """
    return len(load_all_issues(docs_dir, reverse=False))
