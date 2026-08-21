#!/usr/bin/env python3
"""
每期独立 JSON 生成插件

产出 web/public/issue-<slug>.json(每期一份),供微信小程序/未来 API 直接消费。
动态文件数量(每期一个),故不声明静态 outputs,
而是在 execute 返回值的 "output_files" 中报告实际产物路径,
由 generate 命令汇总进 artifacts-manifest.json。
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from youth_weekly.core.config import ROOT_DIR
from youth_weekly.core.content import load_all_issues
from youth_weekly.core.utils import safe_int
from youth_weekly.plugin import BasePlugin, register

logger = logging.getLogger(__name__)


@register()
class IssueJsonPlugin(BasePlugin):
    """生成每期独立 JSON(web/public/issue-<slug>.json)"""

    name: str = "issue_json"
    version: str = "1.0.0"
    description: str = "生成每期独立 JSON 文件(web/public/issue-<slug>.json)"

    # 动态产物(每期一个文件),静态 outputs 留空,
    # 实际文件路径通过返回值 output_files 上报给 generate/manifest。
    outputs: dict[str, str] = {}

    def execute(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        执行每期 JSON 生成

        Args:
            params: 参数字典,支持:
                - docs_dir: 文档根目录(默认 ROOT_DIR/docs)
                - output_dir: 产物根目录(默认 ROOT_DIR;
                  内部固定附加 web/public 相对子路径,与 generate 的 --output 语义一致)
                - issues: 预加载的 issues 列表(可选)

        Returns:
            {"issue_files": [绝对路径...], "output_files": [相对 output_dir 路径...]}
        """
        params = params or {}
        docs_dir = Path(params.get("docs_dir", str(ROOT_DIR / "docs")))
        output_root = Path(params.get("output_dir", str(ROOT_DIR)))
        # 固定落点:web/public/issue-<slug>.json(与 search_index/issue_index 一致)
        target_dir = output_root / "web" / "public"
        target_dir.mkdir(parents=True, exist_ok=True)

        issues = params.get("issues") or load_all_issues(docs_dir, reverse=True)

        issue_files: list[str] = []
        for issue in issues:
            slug = str(issue.get("slug", ""))
            if not slug:
                logger.warning("issue_json: issue without slug skipped")
                continue
            issue_data: dict[str, Any] = {
                "issue": issue.get("issue", safe_int(slug)),
                "title": issue.get("title", ""),
                "date": issue.get("date", ""),
                "description": issue.get("description", ""),
                "content": issue.get("content", ""),
                "published": issue.get("published", True),
                "cover": issue.get("cover", ""),
                "slug": slug,
            }
            target = target_dir / f"issue-{slug}.json"
            with open(target, "w", encoding="utf-8") as f:
                json.dump(issue_data, f, ensure_ascii=False, indent=2, default=str)
            issue_files.append(str(target))
            logger.info("Generated issue JSON: %s", target)

        # 上报相对 output_dir 的产物路径(web/public/issue-<slug>.json),
        # generate 据此写入 manifest;直接调用时 output_dir 默认 ROOT_DIR,路径同样有效。
        output_files = [
            (
                str(Path(f).relative_to(output_root))
                if Path(f).is_relative_to(output_root)
                else f
            )
            for f in issue_files
        ]
        return {
            "issue_files": issue_files,
            "output_files": output_files,
            "count": len(issue_files),
        }


__all__ = ["IssueJsonPlugin"]
