#!/usr/bin/env python3
"""
周刊生成插件
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from youth_weekly.plugin.base import BasePlugin
from youth_weekly.plugin.registry import register
from youth_weekly.core.collectors import ContentItem
from youth_weekly.core.config import get_curated_content_path, get_issues_dir
from youth_weekly.core.issue_generator import IssueGenerator

logger = logging.getLogger(__name__)


@register()
class IssuePlugin(BasePlugin):
    """生成周刊"""

    name: str = "issue"
    version: str = "1.0.0"
    description: str = "从采集的内容生成新一期周刊"

    def execute(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        执行周刊生成

        Args:
            params: 参数字典，支持:
                - curated_path: 策展内容文件路径
                - issues_dir: 周刊输出目录

        Returns:
            生成结果数据
        """
        params = params or {}
        curated_path = Path(params.get("curated_path", str(get_curated_content_path())))
        issues_dir = Path(params.get("issues_dir", str(get_issues_dir())))

        if not curated_path.exists():
            logger.error("Curated content not found. Run 'collect' first.")
            return {"success": False, "error": "Curated content not found"}

        # 加载策展内容
        with open(curated_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        categorized = {}
        for cat_id, items in data.items():
            categorized[cat_id] = [
                ContentItem(
                    title=item["title"],
                    url=item["url"],
                    description=item.get("description", ""),
                    source=item.get("source", ""),
                    category=cat_id,
                    score=item.get("score", 0),
                )
                for item in items
            ]

        if not categorized:
            logger.error("No curated content available")
            return {"success": False, "error": "No curated content"}

        # 生成周刊
        generator = IssueGenerator(issues_dir=issues_dir)
        issue_dir = generator.generate(categorized)

        if issue_dir:
            logger.info("Issue generated successfully at %s", issue_dir)
            return {
                "success": True,
                "issue_dir": str(issue_dir),
                "issue_number": issue_dir.name,
            }
        else:
            logger.error("Failed to generate issue")
            return {"success": False, "error": "Generation failed"}


__all__ = ["IssuePlugin"]
