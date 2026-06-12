#!/usr/bin/env python3
"""
采集器 / 策展 / 生成器测试
"""

from __future__ import annotations

import shutil
import sys
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

_SCRIPT_DIR = Path(__file__).parent.parent
if str(_SCRIPT_DIR / "src") not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR / "src"))


# ---------------- ContentItem ---------------- #


class TestContentItem:
    """测试内容项"""

    def test_fingerprint_stable(self):
        from youth_weekly.core.collectors import ContentItem

        item = ContentItem(title="t", url="https://example.com/a")
        assert item.fingerprint == item.fingerprint
        assert len(item.fingerprint) == 12

    def test_default_values(self):
        from youth_weekly.core.collectors import ContentItem

        item = ContentItem(title="t", url="u")
        assert item.description == ""
        assert item.score == 0
        assert item.extra == {}


# ---------------- BaseCollector ---------------- #


class TestBaseCollector:
    """测试基类采集器"""

    def test_retry_success(self):
        from youth_weekly.core.collectors import BaseCollector

        collector = BaseCollector(max_retries=2)
        mock_resp = MagicMock(status_code=200)
        with patch.object(collector.session, "get", return_value=mock_resp) as m:
            resp = collector._fetch_with_retry("http://x")
        assert resp is not None
        m.assert_called_once()

    def test_retry_eventually_fails(self):
        import requests

        from youth_weekly.core.collectors import BaseCollector

        collector = BaseCollector(max_retries=2)
        with patch.object(
            collector.session, "get", side_effect=requests.ConnectionError("boom")
        ):
            resp = collector._fetch_with_retry("http://x")
        assert resp is None


# ---------------- RSSCollector ---------------- #


class TestRSSCollector:
    """测试 RSS 采集器"""

    def test_collect_empty(self):
        from youth_weekly.core.collectors import RSSCollector

        collector = RSSCollector(delay=0)
        with patch("youth_weekly.core.collectors.feedparser.parse") as mock:
            mock.return_value = MagicMock(entries=[])
            result = collector.collect({"url": "http://x", "name": "t"})
        assert result == []

    def test_collect_with_items(self):
        from types import SimpleNamespace

        from youth_weekly.core.collectors import RSSCollector

        class _Entry:
            """提供 .get() 行为的条目 mock"""

            def __init__(self, **kw):
                self.__dict__.update(kw)

            def get(self, key, default=None):
                return getattr(self, key, default)

        collector = RSSCollector(delay=0)
        entry = _Entry(
            title="Title",
            link="http://x/1",
            summary="<p>desc</p>",
            description="",
            published_parsed=(2026, 1, 1, 0, 0, 0, 0, 0, 0),
        )
        with patch("youth_weekly.core.collectors.feedparser.parse") as mock:
            mock.return_value = SimpleNamespace(entries=[entry])
            result = collector.collect({"url": "http://x", "name": "t", "max_items": 5})
        assert len(result) == 1
        assert result[0].title == "Title"
        assert result[0].published_date == "2026-01-01"


# ---------------- ContentCurator ---------------- #


class TestContentCurator:
    """测试策展器"""

    def setup_method(self):
        self.tmp = Path(tempfile.mkdtemp())

    def teardown_method(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_dedup_disabled(self):
        from youth_weekly.core.collectors import ContentItem
        from youth_weekly.core.curator import ContentCurator

        curator = ContentCurator(dedup_enabled=False)
        items = [ContentItem(title="t", url=f"http://x/{i}") for i in range(3)]
        result = curator.deduplicate(items)
        assert len(result) == 3
        curator.close()

    def test_dedup_enabled(self):
        from youth_weekly.core.collectors import ContentItem
        from youth_weekly.core.curator import ContentCurator

        db = self.tmp / "d.db"
        curator = ContentCurator(dedup_enabled=True, dedup_db_path=str(db))
        items = [
            ContentItem(title="a", url="http://x/1"),
            ContentItem(title="a", url="http://x/1"),  # dup
            ContentItem(title="b", url="http://x/2"),
        ]
        result = curator.deduplicate(items)
        assert len(result) == 2
        curator.close()

    def test_score_items(self):
        from youth_weekly.core.collectors import ContentItem
        from youth_weekly.core.curator import ContentCurator

        curator = ContentCurator(dedup_enabled=False)
        items = [
            ContentItem(
                title="AI 革命性突破",
                url="u1",
                description="a " * 30,
                source="Hacker News",
            ),
            ContentItem(title="普通新闻", url="u2", description="", source="Other"),
        ]
        scored = curator.score_items(items)
        assert scored[0].score >= scored[1].score
        curator.close()

    def test_categorize(self):
        from youth_weekly.core.collectors import ContentItem
        from youth_weekly.core.curator import ContentCurator

        curator = ContentCurator(dedup_enabled=False)
        items = [
            ContentItem(title="t1", url="u1", category="tech"),
            ContentItem(title="Python 新版本", url="u2", category="dev"),
            ContentItem(title="random", url="u3"),
        ]
        cat_config = {"tech": {}, "dev": {}, "ai": {}, "research": {}, "oss": {}}
        result = curator.categorize(items, cat_config)
        assert "tech" in result
        assert "dev" in result
        assert "uncategorized" in result
        curator.close()

    def test_select_top_items(self):
        from youth_weekly.core.collectors import ContentItem
        from youth_weekly.core.curator import ContentCurator

        curator = ContentCurator(dedup_enabled=False)
        items = [ContentItem(title=f"t{i}", url=f"u{i}", score=i) for i in range(5)]
        top = curator.select_top_items(items, max_items=3)
        assert len(top) == 3
        curator.close()


# ---------------- IssueGenerator ---------------- #


class TestIssueGenerator:
    """测试周刊生成器"""

    def setup_method(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.issues = self.tmp / "issues"
        self.issues.mkdir()

    def teardown_method(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_generate_first_issue(self):
        from youth_weekly.core.collectors import ContentItem
        from youth_weekly.core.issue_generator import IssueGenerator

        gen = IssueGenerator(issues_dir=self.issues)
        items = {
            "tech": [ContentItem(title="A", url="u1", source="HN")],
        }
        path = gen.generate(items)
        assert path is not None
        assert (path / "README.md").exists()
        content = (path / "README.md").read_text(encoding="utf-8")
        assert "青年周刊" in content
        assert "A" in content

    def test_generate_empty_returns_none(self):
        from youth_weekly.core.issue_generator import IssueGenerator

        gen = IssueGenerator(issues_dir=self.issues)
        assert gen.generate({}) is None

    def test_incremental_numbering(self):
        from youth_weekly.core.issue_generator import IssueGenerator

        (self.issues / "005").mkdir()
        gen = IssueGenerator(issues_dir=self.issues)
        assert gen._get_next_issue_number() == 6


# ---------------- PluginLoader ---------------- #


class TestPluginLoader:
    """测试插件加载器"""

    def test_discover_excludes_init(self, tmp_path):
        from youth_weekly.plugin.loader import discover_plugins

        (tmp_path / "__init__.py").write_text("# init")
        (tmp_path / "real.py").write_text("# real")
        files = discover_plugins(tmp_path)
        assert len(files) == 1
        assert "real" in str(files[0])

    def test_discover_nonexistent_dir(self, tmp_path):
        from youth_weekly.plugin.loader import discover_plugins

        assert discover_plugins(tmp_path / "nope") == []

    def test_load_plugin_file(self, tmp_path):
        from youth_weekly.plugin.loader import load_plugin_file

        f = tmp_path / "dummy.py"
        f.write_text("X = 1\n")
        assert load_plugin_file(f) is True

    def test_load_nonexistent(self, tmp_path):
        from youth_weekly.plugin.loader import load_plugin_file

        assert load_plugin_file(tmp_path / "nope.py") is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
