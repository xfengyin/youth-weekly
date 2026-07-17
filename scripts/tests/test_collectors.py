"""测试内容采集器模块"""

from unittest.mock import MagicMock, patch

from youth_weekly.core.collectors import (
    COLLECTOR_MAP,
    ContentItem,
    GitHubTrendingCollector,
    HackerNewsCollector,
    RSSCollector,
    get_collector,
    register_collector,
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

    @patch("youth_weekly.core.collectors.RSSCollector._fetch_with_retry")
    @patch("youth_weekly.core.collectors.feedparser.parse")
    def test_collect_success(self, mock_parse, mock_fetch):
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
        mock_fetch.return_value = MagicMock(content=b"<rss></rss>")

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

    @patch("youth_weekly.core.collectors.RSSCollector._fetch_with_retry")
    @patch("youth_weekly.core.collectors.feedparser.parse")
    def test_collect_with_published_date(self, mock_parse, mock_fetch):
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
        mock_fetch.return_value = MagicMock(content=b"<rss></rss>")

        collector = RSSCollector(delay=0)
        result = collector.collect({"url": "https://example.com/rss"})

        assert len(result) == 1
        assert result[0].published_date == "2024-01-15"

    @patch("youth_weekly.core.collectors.RSSCollector._fetch_with_retry")
    @patch("youth_weekly.core.collectors.feedparser.parse")
    def test_collect_empty_feed(self, mock_parse, mock_fetch):
        """测试空 RSS 源"""
        mock_feed = MagicMock()
        mock_feed.entries = []
        mock_parse.return_value = mock_feed
        mock_fetch.return_value = MagicMock(content=b"<rss></rss>")

        collector = RSSCollector(delay=0)
        result = collector.collect({"url": "https://example.com/rss"})

        assert result == []

    @patch("youth_weekly.core.collectors.RSSCollector._fetch_with_retry")
    @patch("youth_weekly.core.collectors.feedparser.parse")
    def test_collect_parse_error(self, mock_parse, mock_fetch):
        """测试 RSS 解析错误"""
        mock_parse.side_effect = Exception("Parse error")
        mock_fetch.return_value = MagicMock(content=b"<rss></rss>")

        collector = RSSCollector(delay=0)
        result = collector.collect({"url": "https://example.com/rss"})

        assert result == []


class TestHackerNewsCollector:
    """测试 Hacker News 采集器"""

    @patch("youth_weekly.core.collectors.HackerNewsCollector._fetch_with_retry")
    @patch("youth_weekly.core.collectors.feedparser.parse")
    def test_collect_with_score_filter(self, mock_parse, mock_fetch):
        """测试分数过滤"""
        mock_fetch.return_value = MagicMock(content=b"<rss></rss>")
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

    @patch("youth_weekly.core.collectors.HackerNewsCollector._fetch_with_retry")
    @patch("youth_weekly.core.collectors.feedparser.parse")
    def test_collect_max_items_limit(self, mock_parse, mock_fetch):
        """测试最大条目数限制"""
        mock_fetch.return_value = MagicMock(content=b"<rss></rss>")
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


class TestResponseSizeLimit:
    """测试响应大小限制(P0 安全修复)"""

    def test_fetch_respects_max_size(self):
        """超限时 _fetch_with_retry 应返回 None"""
        from youth_weekly.core.collectors import BaseCollector

        class _Stub(BaseCollector):
            def collect(self, source_config):
                return []

        collector = _Stub(delay=0, max_retries=1)

        # 构造一个会分块返回数据的伪响应
        resp = MagicMock()
        # 第一次 iter_content 给出 5MB 数据,触发超限检查
        big_chunk = b"x" * (5 * 1024 * 1024)
        resp.iter_content.return_value = [big_chunk]
        resp.raise_for_status.return_value = None
        resp.close = MagicMock()

        with patch.object(collector.session, "get", return_value=resp):
            result = collector._fetch_with_retry("http://x", max_size=4 * 1024 * 1024)

        assert result is None
        resp.close.assert_called_once()

    def test_fetch_within_limit_returns_response(self):
        """未超限时正常返回 Response"""
        from youth_weekly.core.collectors import BaseCollector

        class _Stub(BaseCollector):
            def collect(self, source_config):
                return []

        collector = _Stub(delay=0, max_retries=1)

        resp = MagicMock()
        resp.iter_content.return_value = [b"ok"]
        resp.raise_for_status.return_value = None

        with patch.object(collector.session, "get", return_value=resp):
            result = collector._fetch_with_retry("http://x", max_size=1024)

        assert result is resp
        # 验证小响应被缓存到 _content
        assert resp._content == b"ok"


class TestGitHubAuthentication:
    """测试 GitHub API 认证(P1)"""

    def test_no_token_means_anonymous(self, monkeypatch):
        """未配置 token 时降级为匿名请求"""
        monkeypatch.delenv("GITHUB_TOKEN", raising=False)
        monkeypatch.delenv("GH_TOKEN", raising=False)
        collector = GitHubTrendingCollector(delay=0)
        assert collector.is_authenticated is False
        assert "Authorization" not in collector.session.headers
        assert (
            collector._rate_limit
            == GitHubTrendingCollector.ANONYMOUS_RATE_LIMIT_PER_HOUR
        )

    def test_explicit_token_sets_authorization_header(self, monkeypatch):
        """显式传入 token 时设置 Authorization 头"""
        monkeypatch.delenv("GITHUB_TOKEN", raising=False)
        collector = GitHubTrendingCollector(delay=0, github_token="ghp_explicit123")
        assert collector.is_authenticated is True
        assert collector.session.headers["Authorization"] == "Bearer ghp_explicit123"
        assert (
            collector._rate_limit
            == GitHubTrendingCollector.AUTHENTICATED_RATE_LIMIT_PER_HOUR
        )

    def test_env_token_uses_authorization(self, monkeypatch):
        """环境变量 GITHUB_TOKEN 启用认证"""
        monkeypatch.setenv("GITHUB_TOKEN", "ghp_envtoken456")
        collector = GitHubTrendingCollector(delay=0)
        assert collector.is_authenticated is True
        assert collector.session.headers["Authorization"] == "Bearer ghp_envtoken456"

    def test_explicit_token_takes_precedence_over_env(self, monkeypatch):
        """显式 token 优先于环境变量"""
        monkeypatch.setenv("GITHUB_TOKEN", "ghp_env")
        collector = GitHubTrendingCollector(delay=0, github_token="ghp_explicit")
        assert collector.session.headers["Authorization"] == "Bearer ghp_explicit"

    def test_gh_token_env_fallback(self, monkeypatch):
        """GH_TOKEN 环境变量作为后备"""
        monkeypatch.delenv("GITHUB_TOKEN", raising=False)
        monkeypatch.setenv("GH_TOKEN", "ghp_fallback789")
        collector = GitHubTrendingCollector(delay=0)
        assert collector.is_authenticated is True
        assert collector.session.headers["Authorization"] == "Bearer ghp_fallback789"
