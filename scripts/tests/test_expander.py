#!/usr/bin/env python3
"""测试内容杂志化扩展器"""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from youth_weekly.core.collectors import ContentItem
from youth_weekly.core.expander import CATEGORY_TO_SECTION, ContentExpander
from youth_weekly.core.llm import LLMResponse


class TestContentExpander:
    """测试 ContentExpander"""

    def test_is_available_false_when_disabled(self):
        expander = ContentExpander(llm_config={"enabled": False})
        assert expander.is_available() is False

    def test_is_available_false_without_key(self):
        expander = ContentExpander(
            llm_config={"enabled": True, "provider": "openai", "model": "x"}
        )
        assert expander.is_available() is False

    def test_generate_editorial_with_mock_provider(self):
        mock_provider = MagicMock()
        mock_provider.chat.return_value = LLMResponse(text="本周科技热点纷呈。")
        expander = ContentExpander(provider=mock_provider)
        items = [ContentItem(title="AI 新突破", url="u1", category="tech")]
        result = expander.generate_editorial(7, "2026-07-09", items)
        assert "本周科技热点纷呈" in result
        mock_provider.chat.assert_called_once()

    def test_generate_editorial_fallback_on_error(self):
        mock_provider = MagicMock()
        mock_provider.chat.side_effect = RuntimeError("boom")
        expander = ContentExpander(provider=mock_provider)
        result = expander.generate_editorial(7, "2026-07-09", [])
        assert "第 7 期" in result

    def test_expand_article_with_mock_provider(self):
        mock_provider = MagicMock()
        mock_provider.chat.return_value = LLMResponse(text="### 标题\n内容。")
        expander = ContentExpander(provider=mock_provider)
        item = ContentItem(title="AI 新突破", url="u1", description="摘要", source="HN")
        result = expander.expand_article(item)
        assert "### 标题" in result

    def test_expand_article_fallback_on_error(self):
        mock_provider = MagicMock()
        mock_provider.chat.side_effect = RuntimeError("boom")
        expander = ContentExpander(provider=mock_provider)
        item = ContentItem(title="AI 新突破", url="u1", description="摘要")
        result = expander.expand_article(item)
        assert "AI 新突破" in result
        assert "[阅读原文](u1)" in result


class TestCategoryMapping:
    """测试分类映射"""

    def test_common_categories_mapped(self):
        assert CATEGORY_TO_SECTION["tech"][0] == "科技新势力"
        assert CATEGORY_TO_SECTION["dev"][0] == "好工具"
        assert CATEGORY_TO_SECTION["anime"][0] == "二次元次元壁"
        assert CATEGORY_TO_SECTION["gaming"][0] == "游戏研究所"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
