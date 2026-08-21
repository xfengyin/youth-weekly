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

from youth_weekly.core.config import ROOT_DIR
from youth_weekly.core.content import load_all_issues
from youth_weekly.plugin import BasePlugin, register

logger = logging.getLogger(__name__)


@register()
class StatsPlugin(BasePlugin):
    """生成统计数据插件"""

    name: str = "stats"
    version: str = "1.0.0"
    description: str = "生成统计数据 JSON 文件"

    # 产物路由:统计产物输出到 scripts/dist/stats.json
    outputs: dict[str, str] = {"stats": "scripts/dist/stats.json"}

    def execute(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        执行统计数据生成

        Args:
            params: 参数字典,支持:
                - docs_dir: 文档根目录(默认 ROOT_DIR/docs)
                - output_path: 输出文件路径(默认不写文件)
                - issues: 预加载的 issues 列表(可选)

        Returns:
            生成的统计数据
        """
        params = params or {}
        docs_dir = Path(params.get("docs_dir", str(ROOT_DIR / "docs")))
        output_path = Path(params["output_path"]) if "output_path" in params else None

        issues = params.get("issues") or load_all_issues(docs_dir, reverse=True)
        dates = [issue.get("date", "") for issue in issues if issue.get("date")]

        # 复用已传入的 issues 计算总数(与 get_issue_count 语义一致:仅计已发布),
        # 避免以不同缓存 key 再触发一次全量加载
        total_issues = sum(1 for issue in issues if issue.get("published", True))
        stats: dict[str, Any] = {
            "total_issues": total_issues,
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
