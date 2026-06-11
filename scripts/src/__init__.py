#!/usr/bin/env python3
"""
共享内容加载模块
提供统一的周刊内容读取接口
"""
import os
import logging
import yaml
from pathlib import Path
from typing import Optional, List
from datetime import date, datetime

logger = logging.getLogger(__name__)


class ContentLoadError(Exception):
    """内容加载错误"""
    pass


def _serialize_value(value):
    """序列化 YAML 值，确保日期等类型可被 JSON 序列化"""
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, set):
        return sorted(list(value))
    if isinstance(value, bytes):
        return value.decode('utf-8', errors='replace')
    if isinstance(value, dict):
        return {k: _serialize_value(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialize_value(v) for v in value]
    if not isinstance(value, (str, int, float, bool, type(None))):
        return str(value)
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

    # 安全校验：防止路径遍历
    if docs_dir is not None:
        resolved = safe_resolve_path(docs_dir, f"issues/{issue_dir.name}")
        if resolved is None:
            logger.warning("Path traversal attempt detected: %s", issue_dir)
            return None

    readme_path = issue_dir / "README.md"
    if not readme_path.exists():
        return None

    try:
        content = readme_path.read_text(encoding='utf-8')
    except Exception as e:
        logger.warning("Failed to read %s: %s", readme_path, e)
        return None

    if not content.startswith('---'):
        return None

    # 查找 frontmatter 的结束分隔符（从第四个字符开始查找）
    end_pos = content.find('\n---', 3)
    if end_pos == -1:
        return None

    try:
        front_matter = yaml.safe_load(content[3:end_pos])
        if not isinstance(front_matter, dict):
            return None

        front_matter = _serialize_value(front_matter)

        # 跳过 '\n---' 获取正文内容
        body = content[end_pos + 4:].strip()

        return {
            **front_matter,
            'content': body,
            'slug': issue_dir.name
        }
    except yaml.YAMLError as e:
        logger.warning("YAML parse error in %s: %s", issue_dir, e)
        return None
    except Exception as e:
        logger.warning("Unexpected error loading %s: %s", issue_dir, e)
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

        base_str = str(base_resolved) + os.sep
        if not str(target_path).startswith(base_str) and target_path != base_resolved:
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
        logger.warning("Issues directory not found: %s", issues_dir)
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
