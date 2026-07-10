#!/usr/bin/env python3
"""
周刊生成模块 - 从策展内容生成新一期周刊

支持两种模式:
1. LLM 杂志化扩展(推荐):调用大模型把链接改写成杂志式文章,匹配前 6 期风格。
2. 降级模式:LLM 不可用时,输出简洁的链接聚合列表。
"""

from __future__ import annotations

import logging
import threading
from datetime import datetime, timedelta
from pathlib import Path

import yaml

from youth_weekly.core.collectors import ContentItem
from youth_weekly.core.config import ROOT_DIR, get_llm_config
from youth_weekly.core.expander import CATEGORY_TO_SECTION, ContentExpander

logger = logging.getLogger(__name__)

# 周刊存放目录
ISSUES_DIR = ROOT_DIR / "docs" / "issues"

# 期号计算锁（保证扫描+计算原子性）
_cache_lock = threading.Lock()


# 九大固定板块顺序(与现有 6 期一致)
SECTION_ORDER: list[tuple[str, str]] = [
    ("editorial", "刊首语"),
    ("tech", "科技新势力"),
    ("anime", "二次元次元壁"),
    ("gaming", "游戏研究所"),
    ("stories", "青春故事会"),
    ("tools", "好工具"),
    ("watching", "在看什么"),
    ("gallery", "一周图鉴"),
    ("jobs", "谁在招人"),
]


def get_next_issue_number(issues_dir: Path | None = None) -> int:
    """
    获取下一期期号(模块级函数,供外部调用)

    Args:
        issues_dir: 周刊存放目录,默认使用 ISSUES_DIR

    Returns:
        下一期期号
    """
    target_dir = issues_dir or ISSUES_DIR
    return IssueGenerator(issues_dir=target_dir).get_next_issue_number()


class IssueGenerator:
    """周刊生成器"""

    def __init__(self, issues_dir: Path | None = None) -> None:
        self.issues_dir = issues_dir or ISSUES_DIR
        self.issues_dir.mkdir(parents=True, exist_ok=True)

    def generate(
        self,
        categorized_items: dict[str, list[ContentItem]],
    ) -> Path | None:
        """
        生成新一期周刊

        Args:
            categorized_items: 分类后的内容条目

        Returns:
            生成的周刊目录路径,失败返回 None
        """
        if not categorized_items:
            logger.error("No items to generate issue")
            return None

        # 1. 确定期号
        issue_number = self.get_next_issue_number()
        issue_slug = f"{issue_number:03d}"
        issue_dir = self.issues_dir / issue_slug
        issue_dir.mkdir(parents=True, exist_ok=True)

        assets_dir = issue_dir / "assets"
        assets_dir.mkdir(parents=True, exist_ok=True)

        logger.info("Generating issue #%s at %s", issue_slug, issue_dir)

        # 2. 准备内容扩展器
        llm_config = get_llm_config()
        expander = ContentExpander(llm_config=llm_config)
        use_llm = expander.is_available()
        logger.info("LLM expansion enabled: %s", use_llm)

        # 3. 展平精选条目,用于生成刊首语和描述
        flat_items = self._flatten_items(categorized_items)

        # 4. 生成 frontmatter
        now = datetime.now()
        publish_date = now.strftime("%Y-%m-%d")
        frontmatter = self._build_frontmatter(issue_number, publish_date, flat_items)

        # 5. 生成正文
        body = self._build_body(
            issue_number,
            publish_date,
            categorized_items,
            flat_items,
            expander,
            use_llm,
        )

        # 6. 写入文件
        readme_path = issue_dir / "README.md"
        yaml_dump = yaml.dump(frontmatter, allow_unicode=True, default_flow_style=False)
        content = f"---\n{yaml_dump}---\n\n{body}\n"

        readme_path.write_text(content, encoding="utf-8")
        logger.info("Written README.md for issue #%s", issue_slug)

        return issue_dir

    def get_next_issue_number(self) -> int:
        """
        获取下一期期号(扫描目录实时计算,持锁保证原子性)

        Returns:
            下一期期号
        """
        with _cache_lock:
            max_num = 0
            if self.issues_dir.exists():
                for d in self.issues_dir.iterdir():
                    if d.is_dir() and d.name.isdigit():
                        max_num = max(max_num, int(d.name))
            return max_num + 1

    def _build_frontmatter(
        self,
        issue_number: int,
        publish_date: str,
        items: list[ContentItem],
    ) -> dict[str, object]:
        """构建 frontmatter,与现有 6 期格式一致"""
        description = self._generate_description(items)
        return {
            "issue": issue_number,
            "title": f"青年周刊 · 第 {issue_number} 期",
            "date": publish_date,
            "published": False,
            "cover": "./assets/cover.png",
            "description": description,
        }

    def _generate_description(self, items: list[ContentItem]) -> str:
        """根据前几条内容生成本期描述"""
        if not items:
            return "本期青年周刊为你精选了科技、工具与成长内容。"
        titles = [item.title for item in items[:3]]
        return f"本期关注 {titles[0]}"

    def _build_body(
        self,
        issue_number: int,
        publish_date: str,
        categorized_items: dict[str, list[ContentItem]],
        flat_items: list[ContentItem],
        expander: ContentExpander,
        use_llm: bool,
    ) -> str:
        """构建周刊正文"""
        sections: list[str] = []

        # 标题头
        sections.append(f"# 青年周刊 · 第 {issue_number} 期")
        sections.append("")
        sections.append(f"> {publish_date} | 第{issue_number}期 | 每周更新")
        sections.append("")
        sections.append("---")
        sections.append("")

        # 目录
        sections.extend(self._build_toc())

        # 刊首语(基于全部精选内容)
        editorial = expander.generate_editorial(
            issue_number, publish_date, flat_items
        )
        sections.extend(self._build_editorial_section(editorial))

        # 按固定板块顺序输出(保持与前6期结构一致,空板块显示占位提示)
        for section_id, section_name in SECTION_ORDER:
            if section_id == "editorial":
                continue
            section_items = self._collect_section_items(section_id, categorized_items)
            if section_items:
                sections.extend(
                    self._build_section(
                        section_name, section_id, section_items, expander, use_llm
                    )
                )
            else:
                sections.extend(self._build_empty_section(section_name, section_id))

        # 编读往来 / 结尾
        sections.extend(self._build_footer(issue_number, publish_date))

        return "\n".join(sections)

    def _build_toc(self) -> list[str]:
        """构建目录"""
        lines = ["## 本期目录", ""]
        for i, (section_id, section_name) in enumerate(SECTION_ORDER, 1):
            anchor = f"#{section_name}"
            lines.append(f"{i}. [{section_name}]({anchor})")
        lines.append("")
        lines.append("---")
        lines.append("")
        return lines

    def _build_editorial_section(self, editorial: str) -> list[str]:
        """构建刊首语板块"""
        lines = ["## 刊首语", ""]
        lines.extend(editorial.splitlines())
        lines.append("")
        lines.append("---")
        lines.append("")
        return lines

    def _collect_section_items(
        self,
        section_id: str,
        categorized_items: dict[str, list[ContentItem]],
    ) -> list[ContentItem]:
        """收集某个固定板块对应的内容条目"""
        if section_id == "editorial":
            return []

        result: list[ContentItem] = []
        # 直接匹配
        if section_id in categorized_items:
            result.extend(categorized_items[section_id])

        # 通过 CATEGORY_TO_SECTION 反向映射补充
        for cat_id, items in categorized_items.items():
            mapped_id = self._category_to_section_id(cat_id)
            if mapped_id == section_id and cat_id != section_id:
                result.extend(items)

        # 去重(同一篇文章可能被多个规则命中)
        seen: set[str] = set()
        unique: list[ContentItem] = []
        for item in result:
            fp = item.fingerprint
            if fp not in seen:
                seen.add(fp)
                unique.append(item)

        # 单板块上限,保持阅读节奏与前 6 期一致
        section_max_items: dict[str, int] = {
            "tech": 5,
            "anime": 5,
            "gaming": 5,
            "stories": 5,
            "tools": 5,
            "watching": 5,
            "gallery": 5,
            "jobs": 5,
        }
        max_items = section_max_items.get(section_id, 5)
        return unique[:max_items]

    def _category_to_section_id(self, category: str) -> str:
        """把采集分类映射到固定板块 ID"""
        section_name, _ = CATEGORY_TO_SECTION.get(category, (category, ""))
        for sid, sname in SECTION_ORDER:
            if sname == section_name:
                return sid
        return category

    def _build_empty_section(
        self, section_name: str, section_id: str
    ) -> list[str]:
        """为没有采集到内容的固定板块生成占位,保持结构完整"""
        lines = [f"## {section_name}", ""]
        tagline = self._section_tagline(section_id)
        if tagline:
            lines.append(f"> {tagline}")
            lines.append("")
        lines.append("本期该板块暂无精选内容,欢迎通过 GitHub Issues 投稿推荐。")
        lines.append("")
        lines.append("---")
        lines.append("")
        return lines

    def _build_section(
        self,
        section_name: str,
        section_id: str,
        items: list[ContentItem],
        expander: ContentExpander,
        use_llm: bool,
    ) -> list[str]:
        """构建单个板块"""
        lines = [f"## {section_name}", ""]
        lines.append(f"> {self._section_tagline(section_id)}")
        lines.append("")

        for item in items:
            if use_llm:
                article = expander.expand_article(item)
                lines.extend(article.splitlines())
            else:
                lines.extend(self._format_item(item))
            lines.append("")
            lines.append("---")
            lines.append("")

        return lines

    def _section_tagline(self, section_id: str) -> str:
        """板块副标题"""
        taglines: dict[str, str] = {
            "tech": "AI 工具、编程技巧、效率软件、前沿技术",
            "anime": "ACG 资讯、动漫评论、原创推荐",
            "gaming": "游戏评测、攻略心得、行业动态",
            "stories": "成长故事、职场指南、学习心得",
            "tools": "生产力工具、生活助手推荐",
            "watching": "影视、书籍、播客推荐",
            "gallery": "本周精选视觉内容",
            "jobs": "本周招聘信息精选",
        }
        return taglines.get(section_id, "")

    def _format_item(self, item: ContentItem) -> list[str]:
        """降级模式下单条内容格式化"""
        lines: list[str] = [f"### {item.title}", ""]
        if item.description:
            lines.append(item.description)
            lines.append("")
        lines.append(f"[阅读原文]({item.url})")
        if item.source:
            lines.append("")
            lines.append(f"— via *{item.source}*")
        return lines

    def _build_footer(self, issue_number: int, publish_date: str) -> list[str]:
        """构建结尾"""
        next_date = (
            datetime.strptime(publish_date, "%Y-%m-%d") + timedelta(days=7)
        ).strftime("%Y-%m-%d")
        lines = [
            "## 编读往来",
            "",
            f"**下期预告:** 第 {issue_number + 1} 期将于 {next_date} 发布",
            "",
            "**本期话题:** 你对本期哪个内容最感兴趣?欢迎在评论区分享!",
            "",
            "---",
            "",
            '> "保持好奇,保持年轻。"',
            "",
            "**往期回顾:**",
        ]
        for i in range(max(1, issue_number - 4), issue_number):
            slug = f"{i:03d}"
            lines.append(
                f"- [第{i}期](https://github.com/xfengyin/youth-weekly/blob/main/"
                f"docs/issues/{slug}/README.md)"
            )
        lines.append("")
        return lines

    def _flatten_items(
        self, categorized_items: dict[str, list[ContentItem]]
    ) -> list[ContentItem]:
        """展平所有条目并去重"""
        seen: set[str] = set()
        result: list[ContentItem] = []
        for items in categorized_items.values():
            for item in items:
                if item.fingerprint not in seen:
                    seen.add(item.fingerprint)
                    result.append(item)
        return result


__all__ = ["ISSUES_DIR", "get_next_issue_number", "IssueGenerator"]
