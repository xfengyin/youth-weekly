#!/usr/bin/env python3
"""
杂志化内容扩展服务

把采集到的链接/摘要扩展成与现有 6 期风格一致的杂志文章。
通过 LLM 生成刊首语和每篇文章的深度导读,保持统一的青年周刊语调。
"""

from __future__ import annotations

import logging
from typing import Any

from youth_weekly.core.collectors import ContentItem
from youth_weekly.core.llm import LLMProvider, LLMUnavailableError, create_llm_provider

logger = logging.getLogger(__name__)


# 分类到固定板块的映射(与 config.yaml 的 categories 对齐)
CATEGORY_TO_SECTION: dict[str, tuple[str, str]] = {
    "tech": ("科技新势力", "AI 工具、编程技巧、效率软件、前沿技术推荐"),
    "dev": ("好工具", "生产力工具、开发利器、生活助手推荐"),
    "ai": ("科技新势力", "AI 前沿技术与应用"),
    "research": ("科技新势力", "技术趋势与研究"),
    "oss": ("好工具", "开源精选与工具推荐"),
    "anime": ("二次元次元壁", "ACG 资讯、动漫评论、原创推荐"),
    "gaming": ("游戏研究所", "游戏评测、攻略心得、行业动态"),
    "stories": ("青春故事会", "成长故事、职场指南、学习心得"),
    "tools": ("好工具", "生产力工具、生活助手推荐"),
    "watching": ("在看什么", "影视、书籍、播客推荐"),
    "gallery": ("一周图鉴", "本周精选视觉内容"),
    "jobs": ("谁在招人", "本周招聘信息精选"),
}


DEFAULT_EDITORIAL_SYSTEM = """你是《青年周刊》的主编。请根据本周收集到的内容,撰写一段温暖、有洞察力的刊首语。
语气像《青年文摘》+《看天下》,面向年轻人,避免说教,字数 300-500 字。
结构要求:
1. 开头用一句简短有力的感叹或问候抓住读者。
2. 用 2-3 个段落分别点出本周科技、工具/成长等板块最值得关注的亮点(不要罗列链接)。
3. 结尾邀请读者阅读、分享或投稿。
4. 落款为"——《青年周刊》编辑部"。
输出格式为 Markdown,只输出刊首语正文,不要加标题。"""

DEFAULT_ARTICLE_SYSTEM = """你是《青年周刊》的专栏编辑。请根据提供的文章标题、链接和摘要,
把它改写成一篇适合年轻读者的杂志式导读,严格模仿已有期刊风格。
要求:
1. 起一个吸引人且贴合原意的小标题(带 emoji),放在最前面,用 ### 级别。
2. 正文 200-400 字,必须包含:核心亮点(可用 bullet 列表)、适用人群/场景、一句总结。
3. 保留原文链接,在文末用 "[阅读原文](url)" 的形式给出,并标注来源如"— via *来源*"(如果来源为空则省略)。
4. 语气轻松、有信息量,像朋友推荐好东西;中文表达自然,避免翻译腔。
5. 只输出 Markdown 内容,不要输出解释性文字或 "以下是改写内容" 等废话。"""


class ContentExpander:
    """内容杂志化扩展器"""

    def __init__(
        self,
        llm_config: dict[str, Any] | None = None,
        provider: LLMProvider | None = None,
    ) -> None:
        """
        初始化扩展器

        Args:
            llm_config: LLM 配置字典;若传入 provider 则忽略此项。
            provider: 可选的 LLMProvider 实例(主要用于测试注入)。
        """
        self.llm_config = llm_config or {}
        self._provider = provider

    def _get_provider(self) -> LLMProvider:
        """懒加载 LLM 提供者"""
        if self._provider is None:
            if not self.llm_config.get("enabled", True):
                raise LLMUnavailableError("LLM expansion is disabled")
            self._provider = create_llm_provider(self.llm_config)
        return self._provider

    def is_available(self) -> bool:
        """扩展器是否可用"""
        if not self.llm_config.get("enabled", True):
            return False
        try:
            return self._get_provider().is_available()
        except LLMUnavailableError:
            return False

    def generate_editorial(
        self, issue_number: int, date: str, items: list[ContentItem]
    ) -> str:
        """
        生成刊首语

        Args:
            issue_number: 期号
            date: 发布日期
            items: 本周精选内容条目

        Returns:
            刊首语 Markdown 正文
        """
        if not items:
            return self._fallback_editorial(issue_number, date)

        prompt = self._build_editorial_prompt(issue_number, date, items)
        system = self.llm_config.get("prompts", {}).get(
            "editorial", DEFAULT_EDITORIAL_SYSTEM
        )
        try:
            response = self._get_provider().chat(system, prompt)
            return response.text
        except Exception as exc:
            logger.error("Failed to generate editorial: %s", exc)
            return self._fallback_editorial(issue_number, date)

    def expand_article(self, item: ContentItem) -> str:
        """
        把单条内容扩展成杂志式文章

        Args:
            item: 内容条目

        Returns:
            Markdown 文章正文
        """
        prompt = self._build_article_prompt(item)
        system = self.llm_config.get("prompts", {}).get(
            "article", DEFAULT_ARTICLE_SYSTEM
        )
        try:
            response = self._get_provider().chat(system, prompt)
            return response.text
        except Exception as exc:
            logger.error("Failed to expand article %s: %s", item.title, exc)
            return self._fallback_article(item)

    def _build_editorial_prompt(
        self, issue_number: int, date: str, items: list[ContentItem]
    ) -> str:
        """构建刊首语 prompt"""
        lines = [
            f"第 {issue_number} 期",
            f"发布日期: {date}",
            "本周精选内容:",
        ]
        for i, item in enumerate(items[:10], 1):
            cat = CATEGORY_TO_SECTION.get(item.category, (item.category, ""))[0]
            lines.append(
                f"{i}. [{cat}] {item.title} - {item.description or '暂无摘要'}"
            )
        return "\n".join(lines)

    def _build_article_prompt(self, item: ContentItem) -> str:
        """构建文章扩展 prompt"""
        return (
            f"标题: {item.title}\n"
            f"链接: {item.url}\n"
            f"来源: {item.source}\n"
            f"摘要: {item.description or '暂无摘要'}\n"
            f"分类: {CATEGORY_TO_SECTION.get(item.category, (item.category, ''))[0]}"
        )

    def _fallback_editorial(self, issue_number: int, date: str) -> str:
        """刊首语降级文案"""
        return (
            f"**欢迎来到《青年周刊》第 {issue_number} 期！**\n\n"
            f"本期发布于 {date}。我们为你整理了本周值得关注的科技、工具和成长内容,"
            "希望这些精选能给你带来新的启发。阅读愉快！\n\n"
            "——《青年周刊》编辑部"
        )

    def _fallback_article(self, item: ContentItem) -> str:
        """文章降级文案"""
        parts = [f"### {item.title}", ""]
        if item.description:
            parts.append(item.description)
        parts.append("")
        parts.append(f"[阅读原文]({item.url})")
        return "\n".join(parts)


__all__ = ["ContentExpander", "CATEGORY_TO_SECTION"]
