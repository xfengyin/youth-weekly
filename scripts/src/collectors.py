#!/usr/bin/env python3
"""
内容采集器 - 从 RSS/HackerNews/GitHub 等源采集内容
"""
import logging
import re
import time
import hashlib
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field
from urllib.parse import urlparse

import requests
import feedparser

logger = logging.getLogger(__name__)


# 采集的内容项
@dataclass
class ContentItem:
    """采集到的内容项"""
    title: str
    url: str
    description: str = ""
    source: str = ""
    category: str = ""
    published_date: Optional[str] = None
    score: int = 0  # 热度分数
    image_url: Optional[str] = None

    @property
    def fingerprint(self) -> str:
        """内容指纹（用于去重）"""
        return hashlib.md5(f"{self.url}".encode()).hexdigest()[:12]


class BaseCollector:
    """采集器基类"""

    def __init__(self, timeout: int = 30, max_retries: int = 3,
                 user_agent: str = "YouthWeekly/1.0", delay: float = 2.0):
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": user_agent})
        self.delay = delay

    def _fetch_with_retry(self, url: str) -> Optional[requests.Response]:
        """带重试的 HTTP 请求"""
        for attempt in range(self.max_retries):
            try:
                resp = self.session.get(url, timeout=self.timeout)
                resp.raise_for_status()
                return resp
            except requests.RequestException as e:
                logger.warning("Fetch failed (attempt %d/%d): %s - %s",
                               attempt + 1, self.max_retries, url, e)
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)
        return None


class RSSCollector(BaseCollector):
    """RSS 源采集器"""

    def collect(self, source_config: dict) -> list[ContentItem]:
        """从 RSS 源采集内容"""
        url = source_config.get("url", "")
        max_items = source_config.get("max_items", 10)
        category = source_config.get("category", "")
        name = source_config.get("name", url)

        logger.info("Collecting RSS from %s (%s)", name, url)

        try:
            feed = feedparser.parse(url)
        except Exception as e:
            logger.error("Failed to parse RSS feed %s: %s", url, e)
            return []

        items = []
        for entry in feed.entries[:max_items]:
            title = entry.get("title", "").strip()
            link = entry.get("link", "").strip()
            if not title or not link:
                continue

            desc = entry.get("summary", entry.get("description", ""))
            # 清理 HTML 标签（保留中文字符）
            desc = re.sub(r'<[^>]+>', '', desc)[:300]

            pub_date = None
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                try:
                    pub_date = datetime(*entry.published_parsed[:6]).strftime("%Y-%m-%d")
                except (ValueError, TypeError):
                    pass

            items.append(ContentItem(
                title=title,
                url=link,
                description=desc[:200],
                source=name,
                category=category,
                published_date=pub_date,
            ))

        logger.info("Collected %d items from %s", len(items), name)
        time.sleep(self.delay)
        return items


class HackerNewsCollector(BaseCollector):
    """Hacker News 采集器"""

    def collect(self, source_config: dict) -> list[ContentItem]:
        """从 Hacker News 采集内容"""
        max_items = source_config.get("max_items", 15)
        min_score = source_config.get("min_score", 50)
        name = source_config.get("name", "Hacker News")
        category = source_config.get("category", "tech")

        logger.info("Collecting from %s (min_score=%d)", name, min_score)

        items = []
        # 使用 HN RSS feed
        rss_url = "https://hnrss.org/frontpage"
        try:
            feed = feedparser.parse(rss_url)
        except Exception as e:
            logger.error("Failed to parse HN feed: %s", e)
            return []

        for entry in feed.entries:
            title = entry.get("title", "").strip()
            link = entry.get("link", "").strip()
            if not title or not link:
                continue

            # 提取分数
            score = 0
            score_text = entry.get("description", "")
            if "points" in score_text:
                try:
                    score = int(score_text.split(" points")[0].split()[-1])
                except (ValueError, IndexError):
                    pass

            if score < min_score:
                continue

            desc = entry.get("summary", "")[:200] if entry.get("summary") else ""

            items.append(ContentItem(
                title=title,
                url=link,
                description=desc,
                source=name,
                category=category,
                score=score,
            ))

            if len(items) >= max_items:
                break

        logger.info("Collected %d items from %s", len(items), name)
        time.sleep(self.delay)
        return items


class GitHubTrendingCollector(BaseCollector):
    """GitHub Trending 采集器"""

    def collect(self, source_config: dict) -> list[ContentItem]:
        """从 GitHub Trending 采集内容（使用 API 模拟）"""
        max_items = source_config.get("max_items", 10)
        name = source_config.get("name", "GitHub Trending")
        category = source_config.get("category", "dev")

        logger.info("Collecting from %s", name)

        # 使用 GitHub API 获取热门仓库
        # 搜索最近 stars 最多的仓库
        try:
            resp = self.session.get(
                "https://api.github.com/search/repositories",
                params={
                    "q": "stars:>500",
                    "sort": "stars",
                    "order": "desc",
                    "per_page": max_items,
                },
                timeout=self.timeout,
            )
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as e:
            logger.error("Failed to fetch GitHub trending: %s", e)
            return []

        items = []
        for repo in data.get("items", [])[:max_items]:
            items.append(ContentItem(
                title=f"{repo['full_name']} - \u2b50 {repo['stargazers_count']}",
                url=repo["html_url"],
                description=repo.get("description", "")[:200] or "",
                source=name,
                category=category,
                score=repo.get("stargazers_count", 0),
            ))

        logger.info("Collected %d items from %s", len(items), name)
        time.sleep(self.delay)
        return items


# 采集器工厂函数
COLLECTOR_MAP = {
    "rss": RSSCollector,
    "hackernews": HackerNewsCollector,
    "github_trending": GitHubTrendingCollector,
}


def get_collector(collector_type: str, **kwargs) -> Optional[BaseCollector]:
    """获取采集器实例"""
    collector_class = COLLECTOR_MAP.get(collector_type)
    if collector_class:
        return collector_class(**kwargs)
    logger.warning("Unknown collector type: %s", collector_type)
    return None
