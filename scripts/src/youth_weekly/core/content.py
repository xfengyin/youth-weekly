#!/usr/bin/env python3
"""
共享内容加载模块
提供统一的周刊内容读取接口
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from pathlib import Path
from threading import RLock
from typing import Any

import yaml

logger = logging.getLogger(__name__)

# 缓存统计信息
_cache_stats: dict[str, int] = {"hits": 0, "misses": 0}

# 自实现的 mtime 感知缓存(替代 lru_cache,因为 lru_cache 无法感知文件变更)
# key: (docs_dir, reverse, include_unpublished)
# value: (mtime_signature, result)
# mtime_signature: 按名称排序的 (子目录名, README.md mtime) 元组,
# 目录新增/删除/重命名、README 新增/修改/删除都会改变签名(删除"最新一期"也会失效)。
_cache: dict[tuple[Any, ...], tuple[tuple[tuple[str, float], ...], list[dict]]] = {}
_cache_lock = RLock()

# 目录存在但没有 README 的子目录使用该哨兵 mtime
_NO_README_MTIME: float = 0.0


def _issues_dir_signature(issues_dir: Path) -> tuple[tuple[str, float], ...]:
    """
    计算 issues 目录的指纹。

    对每个直接子目录记录 (子目录名, README.md mtime) 并整体排序:
    - 修改任意 README.md -> 对应 mtime 变化 -> 签名变化
    - 新增/删除/重命名任意子目录 -> 元组集合变化 -> 签名变化
    - 删除 README.md -> mtime 降级为哨兵 0.0 -> 签名变化

    相比"最大 mtime"方案,删除最新一期(其 mtime 恰为最大值)也能正确失效。
    """
    if not issues_dir.exists():
        return ()
    signature: list[tuple[str, float]] = []
    for child in sorted(issues_dir.iterdir()):
        if not child.is_dir():
            continue
        readme = child / "README.md"
        if readme.exists():
            try:
                signature.append((child.name, readme.stat().st_mtime))
                continue
            except OSError:
                # 权限不足或文件已删除,降级为哨兵,签名仍会变化
                pass
        signature.append((child.name, _NO_README_MTIME))
    return tuple(signature)


def safe_resolve_path(base_dir: Path, target_name: str) -> Path | None:
    """
    安全路径解析,防止路径遍历攻击

    Args:
        base_dir: 基础目录
        target_name: 目标名称

    Returns:
        安全的绝对路径,校验失败返回 None
    """
    try:
        base_resolved = base_dir.resolve()
        target_path = (base_dir / target_name).resolve()

        # 使用标准库 is_relative_to 替代手写字符串前缀匹配,杜绝边界绕过
        if not target_path.is_relative_to(base_resolved):
            logger.warning("Path traversal blocked: %s", target_path)
            return None

        return target_path
    except Exception:
        return None


def load_issue(issue_dir: Path, docs_dir: Path | None = None) -> dict | None:
    """
    加载单期周刊

    Args:
        issue_dir: 周刊目录路径
        docs_dir: 文档根目录(用于安全校验)

    Returns:
        周刊数据字典,失败返回 None
    """
    if not issue_dir.is_dir():
        return None

    # 安全校验:防止路径遍历
    if docs_dir is not None:
        resolved = safe_resolve_path(docs_dir, f"issues/{issue_dir.name}")
        if resolved is None:
            logger.warning("Path traversal attempt detected: %s", issue_dir)
            return None

    readme_path = issue_dir / "README.md"
    if not readme_path.exists():
        return None

    try:
        content = readme_path.read_text(encoding="utf-8")
    except Exception as exc:
        logger.warning("Failed to read %s: %s", readme_path, exc)
        return None

    if not content.startswith("---"):
        return None

    # 查找 frontmatter 的结束分隔符(从第四个字符开始查找)
    end_pos = content.find("\n---", 3)
    if end_pos == -1:
        return None

    try:
        front_matter: object = yaml.safe_load(content[3:end_pos])
    except yaml.YAMLError as exc:
        logger.warning("YAML parse error in %s: %s", issue_dir, exc)
        return None
    except Exception as exc:
        logger.warning("Unexpected error loading frontmatter in %s: %s", issue_dir, exc)
        return None

    if not isinstance(front_matter, dict):
        return None

    # 显式标注类型避免 mypy 把 front_matter 推断为 object
    body = content[content.find("\n---", 3) + 4 :].strip()
    result: dict = dict(front_matter)  # type: ignore[arg-type]

    # 归一化 date:frontmatter 中未加引号的日期会被 YAML 解析为 date/datetime 对象,
    # 与加引号的字符串混用会导致下游比较/校验失败,统一转为 YYYY-MM-DD 字符串。
    raw_date: object = result.get("date")
    if isinstance(raw_date, (date, datetime)):
        result["date"] = raw_date.strftime("%Y-%m-%d")

    return {
        **result,
        "content": body,
        "slug": issue_dir.name,
    }


def _load_all_issues_uncached(
    docs_dir: Path,
    reverse: bool,
    include_unpublished: bool,
) -> list[dict]:
    """实际加载所有周刊(无缓存)"""
    issues_dir = docs_dir / "issues"

    if not issues_dir.exists():
        logger.warning("Issues directory not found: %s", issues_dir)
        return []

    issues: list[dict] = []
    sorted_dirs = sorted(
        (p for p in issues_dir.iterdir() if p.is_dir() and p.name.isdigit()),
        key=lambda p: p.name,
        reverse=reverse,
    )

    for issue_dir in sorted_dirs:
        issue = load_issue(issue_dir, docs_dir)
        if issue is None:
            continue

        if not include_unpublished and not issue.get("published", True):
            continue

        issues.append(issue)

    return issues


def load_all_issues(
    docs_dir: Path,
    reverse: bool = True,
    include_unpublished: bool = False,
) -> list[dict]:
    """
    加载所有周刊(带 mtime 感知的自动失效缓存)

    缓存策略:
    - 以 (docs_dir, reverse, include_unpublished) 为 key
    - 用 (子目录名, README.md mtime) 元组集合作为失效签名
    - 任何子目录新增/删除/重命名或 README 新增/修改/删除都会使签名变化,
      下次调用自动重建缓存(删除"最新一期"也会正确失效)
    - 也可通过 clear_cache() 显式失效

    Args:
        docs_dir: 文档根目录
        reverse: 是否降序排列(默认 True,最新在前)
        include_unpublished: 是否包含未发布内容

    Returns:
        周刊列表
    """
    issues_dir = docs_dir / "issues"
    signature = _issues_dir_signature(issues_dir)
    key = (str(docs_dir.resolve()), reverse, include_unpublished)

    with _cache_lock:
        cached = _cache.get(key)
        if cached is not None and cached[0] == signature:
            _cache_stats["hits"] += 1
            return cached[1]
        _cache_stats["misses"] += 1

    # 缓存未命中,执行实际加载(放锁外避免长时间持有)
    result = _load_all_issues_uncached(docs_dir, reverse, include_unpublished)

    with _cache_lock:
        # 使用 maxsize=32 的简单容量控制,避免长跑进程内存膨胀
        if len(_cache) >= 32:
            # 简单驱逐:清空最早插入的一半条目
            for k in list(_cache.keys())[:16]:
                _cache.pop(k, None)
        _cache[key] = (signature, result)

    return result


def clear_cache() -> None:
    """清除 load_all_issues 的缓存(用于测试或显式强制刷新)"""
    with _cache_lock:
        _cache.clear()
    logger.debug("load_all_issues cache cleared")


def get_cache_info() -> dict[str, int]:
    """获取缓存命中/未命中统计"""
    with _cache_lock:
        return {
            "hits": _cache_stats["hits"],
            "misses": _cache_stats["misses"],
            "size": len(_cache),
            "maxsize": 32,
        }


def get_latest_issue(docs_dir: Path) -> dict | None:
    """
    获取最新一期周刊

    Args:
        docs_dir: 文档根目录

    Returns:
        最新周刊数据,未找到返回 None
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


__all__ = [
    "safe_resolve_path",
    "load_issue",
    "load_all_issues",
    "clear_cache",
    "get_cache_info",
    "get_latest_issue",
    "get_issue_count",
]
