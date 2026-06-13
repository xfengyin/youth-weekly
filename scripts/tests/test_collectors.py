"""测试内容采集器模块"""

from unittest.mock import MagicMock, patch


from youth_weekly.core.collectors import (
    ContentItem,
    RSSCollector,
    HackerNewsCollector,
    GitHubTrendingCollector,
    get_collector,
    register_collector,
    COLLECTOR_MAP,
)


class TestContentItem:
    """测试 ContentItem 数据类"""

    def test_fingerprint_generation(self):
        """测试内容指纹生成"""
        item = ContentItem(title="Test", url="https://example.com/1")
        assert len(item.fingerprint) == 12
        # 相同 URL 应该生成相同指纹
        item2 = ContentItem(title="Different", url="https://example.com/1")
        assert item.fingerprint == item2.fingerprint

    def test_different_urls_different_fingerprints(self):
        """测试不同 URL 生成不同指纹"""
        item1 = ContentItem(title="Test", url="https://example.com/1")
        item2 = ContentItem(title="Test", url="https://example.com/2")
        assert item1.fingerprint != item2.fingerprint


class TestRSSCollector:
    """测试 RSS 采集器"""

    @patch("youth_weekly.core.collectors.feedparser.parse")
    def test_collect_success(self, mock_parse):
        """测试成功采集 RSS"""
        # 模拟 feedparser 返回的数据
        mock_feed = MagicMock()
        mock_entry = MagicMock()
        mock_entry.get.side_effect = lambda key, default="": {
            "title": "Test Article",
            "link": "https://example.com/article",
            "summary": "<p>Test description</p>",
            "description": "",
        }.get(key, default)
        mock_entry.published_parsed = None
        mock_feed.entries = [mock_entry]
        mock_parse.return_value = mock_feed

        collector = RSSCollector(delay=0)
        result = collector.collect(
            {
                "url": "https://example.com/rss",
                "max_items": 10,
                "category": "tech",
                "name": "Test Feed",
            }
        )

        assert len(result) == 1
        assert result[0].title == "Test Article"
        assert result[0].url == "https://example.com/article"
        assert result[0].category == "tech"

    @patch("youth_weekly.core.collectors.feedparser.parse")
    def test_collect_with_published_date(self, mock_parse):
        """测试带发布日期的 RSS"""
        mock_feed = MagicMock()
        mock_entry = MagicMock()
        mock_entry.get.side_effect = lambda key, default="": {
            "title": "Test",
            "link": "https://example.com",
            "summary": "",
            "description": "",
        }.get(key, default)
        # 模拟 time.struct_time
        mock_entry.published_parsed = (2024, 1, 15, 0, 0, 0, 0, 0, 0)
        mock_feed.entries = [mock_entry]
        mock_parse.return_value = mock_feed

        collector = RSSCollector(delay=0)
        result = collector.collect({"url": "https://example.com/rss"})

        assert len(result) == 1
        assert result[0].published_date == "2024-01-15"

    @patch("youth_weekly.core.collectors.feedparser.parse")
    def test_collect_empty_feed(self, mock_parse):
        """测试空 RSS 源"""
        mock_feed = MagicMock()
        mock_feed.entries = []
        mock_parse.return_value = mock_feed

        collector = RSSCollector(delay=0)
        result = collector.collect({"url": "https://example.com/rss"})

        assert result == []

    @patch("youth_weekly.core.collectors.feedparser.parse")
    def test_collect_parse_error(self, mock_parse):
        """测试 RSS 解析错误"""
        mock_parse.side_effect = Exception("Parse error")

        collector = RSSCollector(delay=0)
        result = collector.collect({"url": "https://example.com/rss"})

        assert result == []


class TestHackerNewsCollector:
    """测试 Hacker News 采集器"""

    @patch("youth_weekly.core.collectors.feedparser.parse")
    def test_collect_with_score_filter(self, mock_parse):
        """测试分数过滤"""
        mock_feed = MagicMock()

        # 高分条目
        high_score_entry = MagicMock()
        high_score_entry.get.side_effect = lambda key, default="": {
            "title": "High Score Article",
            "link": "https://example.com/high",
            "description": "100 points by user",
            "summary": "Test summary",
        }.get(key, default)

        # 低分条目
        low_score_entry = MagicMock()
        low_score_entry.get.side_effect = lambda key, default="": {
            "title": "Low Score Article",
            "link": "https://example.com/low",
            "description": "10 points by user",
            "summary": "",
        }.get(key, default)

        mock_feed.entries = [high_score_entry, low_score_entry]
        mock_parse.return_value = mock_feed

        collector = HackerNewsCollector(delay=0)
        result = collector.collect(
            {
                "min_score": 50,
                "max_items": 10,
            }
        )

        assert len(result) == 1
        assert result[0].title == "High Score Article"
        assert result[0].score == 100

    @patch("youth_weekly.core.collectors.feedparser.parse")
    def test_collect_max_items_limit(self, mock_parse):
        """测试最大条目数限制"""
        mock_feed = MagicMock()
        entries = []
        for i in range(20):
            entry = MagicMock()
            entry.get.side_effect = lambda key, default="", idx=i: {
                "title": f"Article {idx}",
                "link": f"https://example.com/{idx}",
                "description": "100 points",
                "summary": "",
            }.get(key, default)
            entries.append(entry)
        mock_feed.entries = entries
        mock_parse.return_value = mock_feed

        collector = HackerNewsCollector(delay=0)
        result = collector.collect(
            {
                "min_score": 50,
                "max_items": 5,
            }
        )

        assert len(result) == 5


class TestGitHubTrendingCollector:
    """测试 GitHub Trending 采集器"""

    @patch("youth_weekly.core.collectors.requests.Session.get")
    def test_collect_success(self, mock_get):
        """测试成功采集 GitHub Trending"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "items": [
                {
                    "full_name": "user/repo",
                    "html_url": "https://github.com/user/repo",
                    "description": "Test repository",
                    "stargazers_count": 1000,
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        collector = GitHubTrendingCollector(delay=0)
        result = collector.collect(
            {
                "max_items": 10,
                "name": "GitHub Trending",
                "category": "dev",
            }
        )

        assert len(result) == 1
        assert "user/repo" in result[0].title
        assert result[0].score == 1000

    @patch("youth_weekly.core.collectors.requests.Session.get")
    def test_collect_api_error(self, mock_get):
        """测试 GitHub API 错误"""
        from requests.exceptions import RequestException

        mock_get.side_effect = RequestException("API error")

        collector = GitHubTrendingCollector(delay=0)
        result = collector.collect({"max_items": 10})

        assert result == []


class TestCollectorFactory:
    """测试采集器工厂函数"""

    def test_get_collector_known_types(self):
        """测试获取已知类型的采集器"""
        assert get_collector("rss") is not None
        assert get_collector("hackernews") is not None
        assert get_collector("github_trending") is not None

    def test_get_collector_unknown_type(self):
        """测试获取未知类型的采集器"""
        result = get_collector("unknown_collector")
        assert result is None

    def test_register_collector(self):
        """测试动态注册采集器"""

        class CustomCollector:
            pass

        register_collector("custom", CustomCollector)
        assert "custom" in COLLECTOR_MAP
        assert COLLECTOR_MAP["custom"] == CustomCollector

        # 清理
        del COLLECTOR_MAP["custom"]
