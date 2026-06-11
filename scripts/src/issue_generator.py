#!/usr/bin/env python3
"""
周刊生成模块 - 从策展内容生成新一期周刊
"""
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import yaml

from .collectors import ContentItem
from .config import ROOT_DIR

logger = logging.getLogger(__name__)

# 周刊存放目录
ISSUES_DIR = ROOT_DIR / "docs" / "issues"


def get_next_issue_number() -> int:
    """获取下一期期号（模块级函数，供外部调用）"""
    gen = IssueGenerator()
    return gen._get_next_issue_number()


class IssueGenerator:
    """周刊生成器"""

    def __init__(self, issues_dir: Optional[Path] = None):
        self.issues_dir = issues_dir or ISSUES_DIR
        self.issues_dir.mkdir(parents=True, exist_ok=True)

    def generate(
        self,
        categorized_items: dict[str, list[ContentItem]],
    ) -> Optional[Path]:
        """
        生成新一期周刊

        Args:
            categorized_items: 分类后的内容条目

        Returns:
            生成的周刊目录路径，失败返回 None
        """
        if not categorized_items:
            logger.error("No items to generate issue")
            return None

        # 1. 确定期号
        issue_number = self._get_next_issue_number()
        issue_slug = f"{issue_number:03d}"
        issue_dir = self.issues_dir / issue_slug
        issue_dir.mkdir(parents=True, exist_ok=True)

        assets_dir = issue_dir / "assets"
        assets_dir.mkdir(parents=True, exist_ok=True)

        logger.info("Generating issue #%s at %s", issue_slug, issue_dir)

        # 2. 生成 frontmatter
        frontmatter = self._build_frontmatter(issue_number, categorized_items)

        # 3. 生成正文
        body = self._build_body(categorized_items)

        # 4. 写入文件
        readme_path = issue_dir / "README.md"
        content = f"---\n{yaml.dump(frontmatter, allow_unicode=True, default_flow_style=False)}---\n\n{body}\n"

        readme_path.write_text(content, encoding="utf-8")
        logger.info("Written README.md for issue #%s", issue_slug)

        return issue_dir

    def _get_next_issue_number(self) -> int:
        """获取下一期期号"""
        max_num = 0
        if self.issues_dir.exists():
            for d in self.issues_dir.iterdir():
                if d.is_dir() and d.name.isdigit():
                    max_num = max(max_num, int(d.name))
        return max_num + 1

    def _build_frontmatter(
        self,
        issue_number: int,
        categorized_items: dict[str, list[ContentItem]],
    ) -> dict:
        """构建 frontmatter"""
        now = datetime.now()
        publish_date = now.strftime("%Y-%m-%d")
        week_start = now - timedelta(days=now.weekday())
        week_end = week_start + timedelta(days=6)
        date_range = f"{week_start.strftime('%m.%d')}-{week_end.strftime('%m.%d')}"

        total_items = sum(len(items) for items in categorized_items.values())

        return {
            "title": f"青年周刊 第 {issue_number} 期",
            "slug": f"{issue_number:03d}",
            "number": issue_number,
            "date": publish_date,
            "date_range": date_range,
            "published": False,
            "featured_count": total_items,
            "categories": list(categorized_items.keys()),
            "draft": True,
        }

    def _build_body(
        self,
        categorized_items: dict[str, list[ContentItem]],
    ) -> str:
        """构建周刊正文"""
        sections = []

        section_titles = {
            "tech": "🚀 科技新势力",
            "dev": "🛠️ 开发者工具",
            "ai": "🤖 AI 前沿",
            "research": "🔬 技术趋势",
            "oss": "📦 开源精选",
            "uncategorized": "📌 其他推荐",
        }

        for cat_id, items in categorized_items.items():
            if not items:
                continue

            title = section_titles.get(cat_id, cat_id)
            sections.append(f"## {title}\n")

            for i, item in enumerate(items, 1):
                sections.append(
                    self._format_item(i, item)
                )

            sections.append("")  # 空行分隔

        return "\n".join(sections)

    def _format_item(self, index: int, item: ContentItem) -> str:
        """格式化单个条目"""
        parts = [f"{index}. **{item.title}**"]

        if item.url:
            parts[-1] = f"{index}. [{item.title}]({item.url})"

        if item.description:
            desc = self._truncate(item.description, 150)
            parts.append(f"   > {desc}")

        if item.source:
            parts.append(f"   — via *{item.source}*")

        return "\n".join(parts)

    def _truncate(self, text: str, max_len: int) -> str:
        """截断文本"""
        if len(text) <= max_len:
            return text
        # 避免截断到一半
        truncated = text[:max_len]
        last_space = truncated.rfind(" ")
        if last_space > max_len * 0.7:
            truncated = truncated[:last_space]
        return truncated + "..."
