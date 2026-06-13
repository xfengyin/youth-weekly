#!/usr/bin/env python3
"""
周刊索引生成插件
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
class IssueIndexPlugin(BasePlugin):
    """生成周刊索引 JSON 插件"""

    name: str = "issue_index"
    version: str = "1.0.0"
    description: str = "生成周刊索引 JSON 文件"

    def execute(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        执行周刊索引生成

        Args:
            params: 参数字典,支持:
                - docs_dir: 文档根目录
                - output_path: 输出文件路径
                - issues: 预加载的 issues 列表(可选)

        Returns:
            生成的周刊数据
        """
        params = params or {}
        docs_dir = Path(params.get("docs_dir", ""))
        output_path = Path(params["output_path"]) if "output_path" in params else None

        issues = params.get("issues") or load_all_issues(docs_dir, reverse=True)

        issues_data: list[dict[str, Any]] = [
            {
                "issue": issue.get("issue", safe_int(issue["slug"])),
                "title": issue.get("title", f"第{issue['slug']}期"),
                "date": issue.get("date", ""),
                "description": issue.get("description", ""),
                "slug": issue["slug"],
                "cover": issue.get("cover", ""),
            }
            for issue in issues
        ]

        if output_path:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(issues_data, f, ensure_ascii=False, indent=2, default=str)
            logger.info("Generated issues index: %s", output_path)

        return {"issues": issues_data}


__all__ = ["IssueIndexPlugin"]
