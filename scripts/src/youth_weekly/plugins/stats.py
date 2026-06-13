#!/usr/bin/env python3
"""
统计数据生成插件
✅ 符合 OCP 原则:新增插件不修改核心架构
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from youth_weekly.core.content import get_issue_count, load_all_issues
from youth_weekly.plugin import BasePlugin, register

logger = logging.getLogger(__name__)


@register()
class StatsPlugin(BasePlugin):
    """生成统计数据插件"""

    name: str = "stats"
    version: str = "1.0.0"
    description: str = "生成统计数据 JSON 文件"

    def execute(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        执行统计数据生成

        Args:
            params: 参数字典,支持:
                - docs_dir: 文档根目录
                - output_path: 输出文件路径
                - issues: 预加载的 issues 列表(可选)

        Returns:
            生成的统计数据
        """
        params = params or {}
        docs_dir = Path(params.get("docs_dir", ""))
        output_path = Path(params["output_path"]) if "output_path" in params else None

        issues = params.get("issues") or load_all_issues(docs_dir, reverse=True)
        dates = [issue.get("date", "") for issue in issues if issue.get("date")]

        stats: dict[str, Any] = {
            "total_issues": get_issue_count(docs_dir),
            "first_issue_date": min(dates) if dates else None,
            "last_issue_date": max(dates) if dates else None,
            "generated_at": datetime.now().isoformat(),
        }

        if output_path:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(stats, f, ensure_ascii=False, indent=2, default=str)
            logger.info("Generated stats: %s", output_path)

        return {"stats": stats}


__all__ = ["StatsPlugin"]
