#!/usr/bin/env python3
"""
RSS 生成插件
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

from feedgen.feed import FeedGenerator

from youth_weekly.plugin.base import BasePlugin
from youth_weekly.plugin.registry import register
from youth_weekly.core.config import get_config
from youth_weekly.core.content import load_all_issues


@register()
class RssPlugin(BasePlugin):
    """生成 RSS feed"""

    name: str = "rss"
    version: str = "1.0.0"
    description: str = "生成 RSS feed 文件"

    def execute(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        执行 RSS 生成

        Args:
            params: 参数字典，支持:
                - docs_dir: 文档根目录
                - output_path: 输出文件路径

        Returns:
            生成的 RSS 数据
        """
        params = params or {}
        docs_dir = Path(params.get("docs_dir", "docs"))
        output_path = Path(params.get("output_path", "scripts/dist/rss.xml"))

        config = get_config()
        issues = load_all_issues(docs_dir, reverse=True)

        # 创建 feed
        fg = FeedGenerator()
        fg.title(config.site.name)
        fg.link(href=config.site.url)
        fg.description(config.site.description)
        fg.language(config.site.language)
        fg.author({"name": config.author.name, "email": config.author.email})
        fg.copyright(f"Copyright {datetime.now().year}, {config.author.name}")

        # 添加条目
        max_items = config.content.max_rss_items
        for issue in issues[:max_items]:
            fe = fg.add_entry()
            fe.title(issue.get("title", f"第{issue['slug']}期"))
            fe.link(href=f"{config.site.url}/issues/{issue['slug']}/")
            fe.id(f"{config.site.url}/issues/{issue['slug']}/")

            # 描述
            description = issue.get("description", "")
            if not description:
                content = issue.get("content", "")
                description = content[:200].replace("#", "").strip()
            fe.description(description)

            # 日期
            if issue.get("date"):
                try:
                    pub_date = datetime.strptime(issue["date"], "%Y-%m-%d")
                    fe.published(pub_date.isoformat() + "Z")
                except (ValueError, TypeError):
                    pass

        # 写入文件
        output_path.parent.mkdir(parents=True, exist_ok=True)
        fg.rss_file(str(output_path), pretty=True)

        return {
            "rss_path": str(output_path),
            "entry_count": min(len(issues), max_items),
        }


__all__ = ["RssPlugin"]
