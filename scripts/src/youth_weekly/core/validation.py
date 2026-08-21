#!/usr/bin/env python3
"""
周刊 frontmatter 校验模块

为 `youth-weekly validate` 提供基于 Pydantic 的结构校验:
- title / date 必填
- slug 必须为纯数字
- published 必须为布尔值
- cover 若为本地路径,对应文件必须存在(docs/issues/<slug>/assets/... 或 docs/assets/...)
- date 必须是 YYYY-MM-DD 格式

校验失败返回错误列表,不抛异常;由 CLI 以非 0 退出码汇总。
"""

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from pydantic import BaseModel, ConfigDict, ValidationError

from youth_weekly.core.config import ROOT_DIR

logger = logging.getLogger(__name__)


class IssueFrontmatter(BaseModel):
    """单期周刊 frontmatter 结构(必填字段由 Pydantic 强制)"""

    model_config = ConfigDict(extra="allow")

    issue: int | None = None
    title: str
    date: str
    description: str = ""
    cover: str | None = None
    # published 不在模型中强制(避免 Pydantic 隐式类型转换掩盖非布尔值),
    # 由 validate_issue 显式 isinstance 检查。


def _format_date_error(value: Any) -> str:
    return f"date 应为 YYYY-MM-DD 格式,当前: {value!r}"


def _resolve_cover_candidates(cover: str, slug: str, docs_dir: Path) -> list[Path]:
    """
    把 frontmatter 中的 cover 引用解析为候选本地路径。

    支持的写法:
    - "./assets/cover.png" / "assets/cover.png"   -> docs/issues/<slug>/assets/cover.png
    - "docs/assets/cover.png" / "/docs/assets/..." -> <ROOT_DIR>/docs/assets/...
    - 其他相对路径 -> 按 docs/issues/<slug>/<path> 与 docs/assets/<path> 双候选
    """
    p = cover
    if p.startswith("/"):
        p = p.lstrip("/")
    if p.startswith("./"):
        p = p[2:]

    issue_dir = docs_dir / "issues" / slug
    if p.startswith("docs/"):
        return [ROOT_DIR / p]
    if p.startswith("assets/"):
        return [issue_dir / p]
    return [issue_dir / p, docs_dir / "assets" / p]


def validate_issue(issue: dict[str, Any], docs_dir: Path) -> list[str]:
    """
    校验单期周刊数据(load_issue/load_all_issues 产出的字典)。

    Args:
        issue: 周刊数据字典(含 frontmatter + content + slug)
        docs_dir: 文档根目录(用于解析 cover 引用)

    Returns:
        错误描述列表;校验通过返回空列表
    """
    slug = str(issue.get("slug", ""))
    errors: list[str] = []

    # 1) Pydantic 结构校验:title/date 必填、类型正确
    frontmatter_fields = {
        k: v for k, v in issue.items() if k not in ("content", "slug")
    }
    pydantic_error_locs: set[str] = set()
    try:
        IssueFrontmatter.model_validate(frontmatter_fields)
    except ValidationError as exc:
        for err in exc.errors():
            loc = ".".join(str(part) for part in err["loc"]) or "<root>"
            errors.append(f"{slug}: {loc} {err['msg']}")
            pydantic_error_locs.add(loc)

    # 2) slug 纯数字
    if not slug.isdigit():
        errors.append(f"{slug or '<empty>'}: slug 必须为纯数字目录名")

    # 3) published 布尔类型(显式检查,不依赖 Pydantic 转换)
    published = issue.get("published", True)
    if not isinstance(published, bool):
        errors.append(f"{slug}: published 应为布尔值,当前: {published!r}")

    # 4) title/date 必填且不能为空串(Pydantic 只保证类型,不拒绝空串)
    title = issue.get("title")
    if "title" not in pydantic_error_locs and (
        not isinstance(title, str) or not title.strip()
    ):
        errors.append(f"{slug}: title 必填且不能为空")
    date = issue.get("date")
    if "date" not in pydantic_error_locs and (
        not isinstance(date, str) or not date.strip()
    ):
        errors.append(f"{slug}: date 必填且不能为空")

    # 5) date 格式(即使 Pydantic 通过,仍需 YYYY-MM-DD 语义校验)
    if isinstance(date, str) and date.strip():
        try:
            datetime.strptime(date.strip(), "%Y-%m-%d")
        except ValueError:
            errors.append(f"{slug}: {_format_date_error(date)}")

    # 5) cover 本地引用必须存在
    cover = issue.get("cover")
    if (
        cover
        and isinstance(cover, str)
        and not cover.startswith(("http://", "https://"))
    ):
        candidates = _resolve_cover_candidates(cover, slug, docs_dir)
        if not any(candidate.is_file() for candidate in candidates):
            errors.append(
                f"{slug}: cover 引用的文件不存在: {cover}"
                f"(已尝试: {', '.join(str(c) for c in candidates)})"
            )

    return errors


def validate_issues(
    issues: list[dict[str, Any]],
    docs_dir: Path,
) -> list[str]:
    """
    校验全部周刊,汇总所有错误。

    Args:
        issues: 周刊数据字典列表
        docs_dir: 文档根目录

    Returns:
        所有期次的错误列表(含期号前缀),通过则为空列表
    """
    all_errors: list[str] = []
    for issue in issues:
        all_errors.extend(validate_issue(issue, docs_dir))
    return all_errors


__all__ = ["IssueFrontmatter", "validate_issue", "validate_issues"]
