#!/usr/bin/env python3
"""
搜索索引生成插件
✅ 符合 OCP 原则:新增插件不修改核心架构
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from youth_weekly.core.content import load_all_issues
from youth_weekly.core.utils import safe_int
from youth_weekly.plugin import BasePlugin, register

logger = logging.getLogger(__name__)


@register()
class SearchIndexPlugin(BasePlugin):
    """生成搜索索引插件"""

    @property
    def name(self) -> str:
        return "search_index"

    @property
    def version(self) -> str:
        return "1.0.0"

    @property
    def description(self) -> str:
        return "生成搜索索引 JSON 文件"

    def execute(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        执行搜索索引生成

        Args:
            params: 参数字典,支持:
                - docs_dir: 文档根目录
                - output_path: 输出文件路径
                - issues: 预加载的 issues 列表(可选)

        Returns:
            生成的搜索索引数据
        """
        params = params or {}
        docs_dir = Path(params.get("docs_dir", ""))
        output_path = Path(params["output_path"]) if "output_path" in params else None

        issues = params.get("issues") or load_all_issues(docs_dir, reverse=True)

        search_index: list[dict[str, Any]] = []
        for issue in issues:
            content = issue.get("content", "")
            excerpt_raw = content[:500].replace("#", "").strip()
            excerpt = excerpt_raw + "..." if len(content) > 500 else excerpt_raw

            search_index.append(
                {
                    "issue": issue.get("issue", safe_int(issue["slug"])),
                    "title": issue.get("title", ""),
                    "date": issue.get("date", ""),
                    "slug": issue["slug"],
                    "excerpt": excerpt,
                }
            )

        if output_path:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(search_index, f, ensure_ascii=False, indent=2, default=str)
            logger.info("Generated search index: %s", output_path)

        return {"search_index": search_index}


__all__ = ["SearchIndexPlugin"]
