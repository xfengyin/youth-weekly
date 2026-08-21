#!/usr/bin/env python3
"""
T-I Python 遗留健壮性修复测试:
- collect 插件源间 delay 生效(含每源覆盖)
- LLM 对坏 JSON/字段缺失重试
- LLM 不可用时降级不打 ERROR
- _generate_description 拼接前 3 个标题
- select_top_items 内部排序保证
- GitHub 采集器坏 JSON/畸形条目降级
- dedup DB 相对路径按 ROOT_DIR 解析
- _find_project_root 祖先标记查找
"""

from __future__ import annotations

import logging
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from youth_weekly.core.collectors import ContentItem, GitHubTrendingCollector
from youth_weekly.core.curator import ContentCurator
from youth_weekly.core.expander import ContentExpander
from youth_weekly.core.issue_generator import IssueGenerator
from youth_weekly.core.llm import LLMError, OpenAICompatibleProvider

# ------------------------------------------------ collect 源间 delay


class TestCollectDelay:
    def _run_collect(self, tmp_path, sources_yaml: str, out_name: str = "curated.json"):
        sources_path = tmp_path / "sources.yaml"
        sources_path.write_text(sources_yaml, encoding="utf-8")
        out = tmp_path / out_name
        sleeps: list[float] = []

        from youth_weekly.plugins.collect import CollectPlugin

        mock_item = MagicMock()
        mock_item.title = "t"
        mock_item.url = "http://x/1"
        mock_item.description = "d"
        mock_item.source = "A"
        mock_item.category = "tech"
        mock_item.score = 1

        with (
            patch("youth_weekly.plugins.collect.time.sleep", sleeps.append),
            patch("youth_weekly.plugins.collect.get_collector") as m,
        ):
            collector = MagicMock()
            collector.collect.return_value = [mock_item]
            m.return_value = collector
            plugin = CollectPlugin()
            result = plugin.execute(
                {"sources_path": str(sources_path), "output_path": str(out)}
            )
        return result, sleeps, m

    def test_delay_between_sources_applied(self, tmp_path):
        yaml_src = (
            "sources:\n"
            "  - name: A\n    type: rss\n    url: http://a\n    enabled: true\n"
            "  - name: B\n    type: rss\n    url: http://b\n    enabled: true\n"
            "collection:\n  delay_between_sources: 3\n"
            "dedup:\n  enabled: false\n"
        )
        result, sleeps, mock_get = self._run_collect(tmp_path, yaml_src)
        assert result["collected"] == 2
        # 两个源之间 sleep 一次,值为 3.0;首个源不等待
        assert sleeps == [3.0]
        # 每个源构造时传入其 delay
        assert [c.kwargs.get("delay") for c in mock_get.call_args_list] == [3.0, 3.0]

    def test_per_source_delay_zero_skips_sleep(self, tmp_path):
        yaml_src = (
            "sources:\n"
            "  - name: A\n    type: rss\n    url: http://a\n    enabled: true\n"
            "  - name: B\n    type: rss\n    url: http://b\n    enabled: true\n"
            "    delay: 0\n"
            "collection:\n  delay_between_sources: 2\n"
            "dedup:\n  enabled: false\n"
        )
        result, sleeps, mock_get = self._run_collect(tmp_path, yaml_src)
        assert result["collected"] == 2
        assert sleeps == []  # B 覆盖 delay=0 -> 不等待
        assert [c.kwargs.get("delay") for c in mock_get.call_args_list] == [2.0, 0.0]

    def test_per_source_delay_override(self, tmp_path):
        yaml_src = (
            "sources:\n"
            "  - name: A\n    type: rss\n    url: http://a\n    enabled: true\n"
            "  - name: B\n    type: rss\n    url: http://b\n    enabled: true\n"
            "    delay: 7\n"
            "collection:\n  delay_between_sources: 2\n"
            "dedup:\n  enabled: false\n"
        )
        result, sleeps, mock_get = self._run_collect(tmp_path, yaml_src)
        assert result["collected"] == 2
        assert sleeps == [7.0]  # 源级 delay 覆盖全局值
        assert [c.kwargs.get("delay") for c in mock_get.call_args_list] == [2.0, 7.0]


# ------------------------------------------------ LLM 异常重试


class TestLLMRetryOnBadResponse:
    def test_openai_retries_on_invalid_json(self):
        provider = OpenAICompatibleProvider(api_key="k", model="m", max_retries=2)
        resp = MagicMock()
        resp.raise_for_status.return_value = None
        resp.json.side_effect = ValueError("bad json")
        with (
            patch("youth_weekly.core.llm.time.sleep"),
            patch.object(provider.session, "post", return_value=resp) as post,
        ):
            with pytest.raises(LLMError):
                provider.chat("s", "u")
        assert post.call_count == 2  # 坏 JSON 也触发重试,而非直接冒泡

    def test_openai_retries_on_missing_field(self):
        provider = OpenAICompatibleProvider(api_key="k", model="m", max_retries=2)
        resp = MagicMock()
        resp.raise_for_status.return_value = None
        resp.json.return_value = {"choices": []}  # choices[0] -> IndexError
        with (
            patch("youth_weekly.core.llm.time.sleep"),
            patch.object(provider.session, "post", return_value=resp) as post,
        ):
            with pytest.raises(LLMError):
                provider.chat("s", "u")
        assert post.call_count == 2

    def test_openai_success_on_second_attempt(self):
        """第一次坏 JSON,第二次正常 -> 返回结果而非抛错"""
        provider = OpenAICompatibleProvider(api_key="k", model="m", max_retries=2)
        bad = MagicMock()
        bad.raise_for_status.return_value = None
        bad.json.side_effect = ValueError("bad json")
        good = MagicMock()
        good.raise_for_status.return_value = None
        good.json.return_value = {"choices": [{"message": {"content": "  ok  "}}]}
        with (
            patch("youth_weekly.core.llm.time.sleep"),
            patch.object(provider.session, "post", side_effect=[bad, good]) as post,
        ):
            result = provider.chat("s", "u")
        assert result.text == "ok"
        assert post.call_count == 2


# ------------------------------------------------ LLM 降级日志


class TestLLMUnavailableLogging:
    def test_no_error_log_when_disabled(self, caplog):
        expander = ContentExpander(llm_config={"enabled": False})
        item = ContentItem(title="x", url="u")
        with caplog.at_level(logging.ERROR):
            editorial = expander.generate_editorial(7, "2026-01-01", [item])
            article = expander.expand_article(item)
        assert "第 7 期" in editorial
        assert "x" in article
        # 预期降级不应出现任何 ERROR 级日志
        assert not [r for r in caplog.records if r.levelno >= logging.ERROR]


# ------------------------------------------------ 描述拼接 / TopN


class TestDescriptionAndTopN:
    def test_generate_description_joins_three_titles(self, tmp_path):
        gen = IssueGenerator(issues_dir=tmp_path / "issues")
        items = [
            ContentItem(title="标题A", url="u1"),
            ContentItem(title="标题B", url="u2"),
            ContentItem(title="标题C", url="u3"),
        ]
        desc = gen._generate_description(items)
        assert "标题A" in desc
        assert "标题B" in desc
        assert "标题C" in desc
        # 不再只拼第一个
        assert not desc.endswith("本期关注 标题A")

    def test_select_top_items_sorts_internally(self):
        curator = ContentCurator(dedup_enabled=False)
        scores = [2, 5, 1, 4, 3]
        items = [
            ContentItem(title=f"t{i}", url=f"u{i}", score=s)
            for i, s in enumerate(scores)
        ]
        top = curator.select_top_items(items, max_items=3)
        assert [i.score for i in top] == [5, 4, 3]
        assert len(items) == 5  # 输入未被修改
        curator.close()


# ------------------------------------------------ GitHub 采集健壮性


class TestGitHubRobustness:
    def test_invalid_json_returns_empty(self):
        collector = GitHubTrendingCollector(delay=0)
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.side_effect = ValueError("bad json")
        with patch.object(collector.session, "get", return_value=mock_response):
            result = collector.collect({"max_items": 5})
        assert result == []

    def test_malformed_entries_skipped(self):
        collector = GitHubTrendingCollector(delay=0)
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "items": [
                {"full_name": "a/b", "html_url": "http://x/1", "stargazers_count": 10},
                {"full_name": "no-url"},  # 缺 html_url -> 跳过
                "not-a-dict",  # 非 dict -> 跳过
                {"html_url": "http://x/4"},  # 缺 full_name -> 跳过
            ]
        }
        with patch.object(collector.session, "get", return_value=mock_response):
            result = collector.collect({"max_items": 10})
        assert len(result) == 1
        assert result[0].title == "a/b - ⭐ 10"


# ------------------------------------------------ dedup DB 路径


class TestCuratorDbPath:
    def test_relative_db_resolved_under_root(self, tmp_path, monkeypatch):
        import youth_weekly.core.curator as curator_mod

        monkeypatch.setattr(curator_mod, "ROOT_DIR", tmp_path)
        curator = ContentCurator(
            dedup_enabled=True, dedup_db_path="scripts/.test_dedup.db"
        )
        curator.deduplicate([ContentItem(title="a", url="http://x/1")])
        curator.close()
        assert (tmp_path / "scripts" / ".test_dedup.db").exists()


# ------------------------------------------------ ROOT_DIR 查找


class TestFindProjectRoot:
    def test_finds_ancestor_with_marker(self, tmp_path):
        from youth_weekly.core.config import _find_project_root

        repo = tmp_path / "repo"
        repo.mkdir()
        (repo / "config.yaml").write_text("{}", encoding="utf-8")
        deep = repo / "scripts" / "src" / "youth_weekly" / "core"
        deep.mkdir(parents=True)
        assert _find_project_root(deep) == repo

    def test_returns_none_without_marker(self, tmp_path):
        from youth_weekly.core.config import _find_project_root

        empty = tmp_path / "no-marker" / "a" / "b"
        empty.mkdir(parents=True)
        assert _find_project_root(empty) is None
