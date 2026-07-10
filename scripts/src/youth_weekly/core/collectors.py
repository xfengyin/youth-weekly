#!/usr/bin/env python3
"""
内容采集器 - 从 RSS/HackerNews/GitHub 等源采集内容
"""

from __future__ import annotations

import hashlib
import logging
import re
import time
from abc import ABC, abstractmethod
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

import feedparser
import requests

logger = logging.getLogger(__name__)


@dataclass
class ContentItem:
    """采集到的内容项"""

    title: str
    url: str
    description: str = ""
    source: str = ""
    category: str = ""
    published_date: str | None = None
    score: int = 0  # 热度分数
    image_url: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)

    @property
    def fingerprint(self) -> str:
        """内容指纹(基于 SHA256 的前 12 位 hex，用于去重)"""
        return hashlib.sha256(f"{self.url}".encode()).hexdigest()[:12]


class BaseCollector(ABC):
    """采集器基类"""

    def __init__(
        self,
        timeout: int = 30,
        max_retries: int = 3,
        user_agent: str = "YouthWeekly/1.0",
        delay: float = 2.0,
    ) -> None:
        self.timeout = timeout
        self.max_retries = max_retries
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": user_agent})

    @abstractmethod
    def collect(self, source_config: dict[str, Any]) -> list[ContentItem]:
        """执行内容采集(子类必须实现)"""
        raise NotImplementedError

    def _fetch_with_retry(self, url: str) -> requests.Response | None:
        """带指数退避的 HTTP 请求"""
        for attempt in range(self.max_retries):
            try:
                resp = self.session.get(url, timeout=self.timeout)
                resp.raise_for_status()
                return resp
            except requests.RequestException as exc:
                logger.warning(
                    "Fetch failed (attempt %d/%d): %s - %s",
                    attempt + 1,
                    self.max_retries,
                    url,
                    exc,
                )
                if attempt < self.max_retries - 1:
                    time.sleep(2**attempt)
        return None


class RSSCollector(BaseCollector):
    """RSS 源采集器"""

    def collect(self, source_config: dict[str, Any]) -> list[ContentItem]:
        """从 RSS 源采集内容"""
        url = source_config.get("url", "")
        max_items = int(source_config.get("max_items", 10))
        category = source_config.get("category", "")
        name = source_config.get("name", url)

        logger.info("Collecting RSS from %s (%s)", name, url)

        # 复用基类超时+重试机制获取响应,再交给 feedparser 解析字节内容
        resp = self._fetch_with_retry(url)
        if resp is None:
            logger.warning("Failed to fetch RSS feed: %s", url)
            return []

        try:
            feed = feedparser.parse(resp.content)
        except Exception as exc:
            logger.error("Failed to parse RSS feed %s: %s", url, exc)
            return []

        items: list[ContentItem] = []
        for entry in feed.entries[:max_items]:
            title = entry.get("title", "").strip()
            link = entry.get("link", "").strip()
            if not title or not link:
                continue

            # 清理 HTML 标签(保留中文字符)
            desc = re.sub(
                r"<[^>]+>", "", entry.get("summary", entry.get("description", ""))
            )[:300]

            pub_date: str | None = None
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                try:
                    pub_date = datetime(*entry.published_parsed[:6]).strftime(
                        "%Y-%m-%d"
                    )
                except (ValueError, TypeError):
                    pub_date = None

            items.append(
                ContentItem(
                    title=title,
                    url=link,
                    description=desc[:200],
                    source=name,
                    category=category,
                    published_date=pub_date,
                )
            )

        logger.info("Collected %d items from %s", len(items), name)
        return items


class HackerNewsCollector(BaseCollector):
    """Hacker News 采集器"""

    def collect(self, source_config: dict[str, Any]) -> list[ContentItem]:
        """从 Hacker News 采集内容"""
        max_items = int(source_config.get("max_items", 15))
        min_score = int(source_config.get("min_score", 50))
        name = source_config.get("name", "Hacker News")
        category = source_config.get("category", "tech")

        logger.info("Collecting from %s (min_score=%d)", name, min_score)

        items: list[ContentItem] = []
        rss_url = "https://hnrss.org/frontpage"

        # 复用基类超时+重试机制获取响应,再交给 feedparser 解析字节内容
        resp = self._fetch_with_retry(rss_url)
        if resp is None:
            logger.warning("Failed to fetch HN feed: %s", rss_url)
            return []

        try:
            feed = feedparser.parse(resp.content)
        except Exception as exc:
            logger.error("Failed to parse HN feed: %s", exc)
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
                    score = 0

            if score < min_score:
                continue

            desc = entry.get("summary", "")[:200] if entry.get("summary") else ""

            items.append(
                ContentItem(
                    title=title,
                    url=link,
                    description=desc,
                    source=name,
                    category=category,
                    score=score,
                )
            )

            if len(items) >= max_items:
                break

        logger.info("Collected %d items from %s", len(items), name)
        return items


class GitHubTrendingCollector(BaseCollector):
    """GitHub Trending 采集器(使用 Search API 模拟)"""

    def collect(self, source_config: dict[str, Any]) -> list[ContentItem]:
        """从 GitHub Trending 采集内容"""
        max_items = int(source_config.get("max_items", 10))
        name = source_config.get("name", "GitHub Trending")
        category = source_config.get("category", "dev")

        logger.info("Collecting from %s", name)

        try:
            params_dict: dict[str, str | int] = {
                "q": "stars:>500",
                "sort": "stars",
                "order": "desc",
                "per_page": max_items,
            }
            resp = self.session.get(
                "https://api.github.com/search/repositories",
                params=params_dict,
                timeout=self.timeout,
            )
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as exc:
            logger.error("Failed to fetch GitHub trending: %s", exc)
            return []

        items: list[ContentItem] = [
            ContentItem(
                title=f"{repo['full_name']} - \u2b50 {repo['stargazers_count']}",
                url=repo["html_url"],
                description=(repo.get("description", "")[:200] or ""),
                source=name,
                category=category,
                score=repo.get("stargazers_count", 0),
            )
            for repo in data.get("items", [])[:max_items]
        ]

        logger.info("Collected %d items from %s", len(items), name)
        return items


# 采集器工厂映射(可扩展)
COLLECTOR_MAP: dict[str, type[BaseCollector]] = {
    "rss": RSSCollector,
    "hackernews": HackerNewsCollector,
    "github_trending": GitHubTrendingCollector,
}


def get_collector(collector_type: str, **kwargs: Any) -> BaseCollector | None:
    """
    获取采集器实例

    Args:
        collector_type: 采集器类型
        **kwargs: 透传给采集器构造器

    Returns:
        采集器实例,未知类型返回 None
    """
    collector_class = COLLECTOR_MAP.get(collector_type)
    if collector_class is None:
        logger.warning("Unknown collector type: %s", collector_type)
        return None
    return collector_class(**kwargs)


def register_collector(name: str, cls: type[BaseCollector]) -> None:
    """
    动态注册新的采集器类型(扩展点)

    Args:
        name: 采集器类型名
        cls: 采集器类
    """
    COLLECTOR_MAP[name] = cls
    logger.info("Registered collector: %s -> %s", name, cls.__name__)


def collect_concurrent(
    sources: list[dict[str, Any]],
    max_workers: int = 3,
    collector_kwargs: dict[str, Any] | None = None,
) -> list[ContentItem]:
    """
    并发采集多个源(向后兼容:不影响原有单采集器接口)

    Args:
        sources: 源配置列表,每项需包含 'type' 字段,其余字段透传给采集器
        max_workers: 最大并发线程数(默认 3)
        collector_kwargs: 透传给采集器构造器的公共参数(如 timeout)

    Returns:
        所有源采集到的内容项合并列表
    """
    collector_kwargs = collector_kwargs or {}
    all_items: list[ContentItem] = []

    def _collect_one(source: dict[str, Any]) -> list[ContentItem]:
        collector_type = source.get("type", "")
        collector = get_collector(collector_type, **collector_kwargs)
        if collector is None:
            return []
        try:
            return collector.collect(source)
        except Exception as exc:
            logger.error("Collector %s failed: %s", collector_type, exc)
            return []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_source = {executor.submit(_collect_one, src): src for src in sources}
        for future in as_completed(future_to_source):
            source = future_to_source[future]
            try:
                items = future.result()
                all_items.extend(items)
            except Exception as exc:
                logger.error(
                    "Unexpected error collecting from %s: %s",
                    source.get("type", "unknown"),
                    exc,
                )

    return all_items


__all__ = [
    "ContentItem",
    "BaseCollector",
    "RSSCollector",
    "HackerNewsCollector",
    "GitHubTrendingCollector",
    "COLLECTOR_MAP",
    "get_collector",
    "register_collector",
    "collect_concurrent",
]
