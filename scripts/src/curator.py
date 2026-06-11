#!/usr/bin/env python3
"""
内容策展模块 - 去重、评分、分类、排序
"""
import logging
import sqlite3
import hashlib
import re
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional

from .collectors import ContentItem

logger = logging.getLogger(__name__)


class ContentCurator:
    """内容策展器"""

    def __init__(
        self,
        dedup_enabled: bool = True,
        dedup_db_path: str = "scripts/.content_dedup.db",
        retention_days: int = 30,
    ):
        self.dedup_enabled = dedup_enabled
        self.dedup_db_path = dedup_db_path
        self.retention_days = retention_days
        self._db: Optional[sqlite3.Connection] = None

        if dedup_enabled:
            self._init_dedup_db()

    def _get_db(self) -> sqlite3.Connection:
        """获取数据库连接（懒加载）"""
        if self._db is None:
            self._db = sqlite3.connect(self.dedup_db_path)
            self._db.execute("PRAGMA journal_mode=WAL")
        return self._db

    def _init_dedup_db(self) -> None:
        """初始化去重数据库"""
        db = self._get_db()
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS content_fingerprints (
                fingerprint TEXT PRIMARY KEY,
                title TEXT,
                url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.commit()
        # 清理过期记录
        cutoff = datetime.now() - timedelta(days=self.retention_days)
        db.execute(
            "DELETE FROM content_fingerprints WHERE created_at < ?",
            (cutoff.isoformat(),),
        )
        db.commit()

    def deduplicate(self, items: list[ContentItem]) -> list[ContentItem]:
        """
        对内容条目进行去重

        Args:
            items: 原始内容条目列表

        Returns:
            去重后的内容条目列表
        """
        if not self.dedup_enabled:
            return items

        unique_items = []
        db = self._get_db()
        seen_count = 0

        for item in items:
            fp = item.fingerprint

            # 检查是否已存在
            cursor = db.execute(
                "SELECT fingerprint FROM content_fingerprints WHERE fingerprint = ?",
                (fp,),
            )
            if cursor.fetchone() is not None:
                seen_count += 1
                continue

            unique_items.append(item)

            # 记录新指纹
            db.execute(
                "INSERT INTO content_fingerprints (fingerprint, title, url) VALUES (?, ?, ?)",
                (fp, item.title, item.url),
            )

        db.commit()

        if seen_count > 0:
            logger.info("Dedup: filtered %d duplicate items", seen_count)

        logger.info(
            "Dedup: %d -> %d items (removed %d)",
            len(items),
            len(unique_items),
            seen_count,
        )
        return unique_items

    def score_items(self, items: list[ContentItem]) -> list[ContentItem]:
        """
        对内容条目进行评分排序

        评分因素:
        - 标题长度（适中更好）
        - 描述完整性
        - 来源权威性（硬编码权重）
        - 关键词匹配

        Args:
            items: 内容条目列表

        Returns:
            按分数降序排列的内容条目列表
        """
        source_weights = {
            "Hacker News": 1.5,
            "GitHub Trending": 1.3,
            "TechCrunch": 1.2,
            "The Verge": 1.1,
            "Google AI Blog": 1.3,
            "Python Weekly": 1.1,
            "JavaScript Weekly": 1.1,
            "React Status": 1.0,
        }

        hot_keywords = {
            "AI": 2.0,
            "LLM": 2.0,
            "大模型": 2.0,
            "ChatGPT": 1.5,
            "Claude": 1.5,
            "React": 1.0,
            "Python": 1.0,
            "开源": 1.0,
            "open source": 1.0,
            "Rust": 1.2,
            "TypeScript": 1.0,
            "Next.js": 1.0,
            "Web": 0.5,
            "游戏": 1.0,
            "anime": 1.0,
            "二次元": 1.0,
        }

        for item in items:
            score = 1.0  # 基础分

            # 标题长度评分 (10-80 字符最佳)
            title_len = len(item.title)
            if 10 <= title_len <= 80:
                score += 0.5
            elif title_len > 80:
                score += 0.2

            # 描述完整性
            if item.description and len(item.description) > 20:
                score += 0.5

            # 来源权重
            source_weight = source_weights.get(item.source, 1.0)
            score *= source_weight

            # 关键词匹配
            text = f"{item.title} {item.description}".lower()
            for keyword, weight in hot_keywords.items():
                if keyword.lower() in text:
                    score += weight

            # 已有分数（如 HN 的 score 字段）
            if item.score > 0:
                score += item.score * 0.1

            item.score = round(score, 2)

        # 按分数降序排序
        items.sort(key=lambda x: x.score, reverse=True)
        logger.info("Scored %d items", len(items))
        return items

    def categorize(
        self,
        items: list[ContentItem],
        category_config: dict,
    ) -> dict[str, list[ContentItem]]:
        """
        将内容条目分类

        Args:
            items: 已评分的内容条目列表
            category_config: 分类配置

        Returns:
            分类后的内容条目 {category_id: [items]}
        """
        categorized: dict[str, list[ContentItem]] = defaultdict(list)

        for item in items:
            # 优先使用条目自带的 category
            if item.category and item.category in category_config:
                categorized[item.category].append(item)
            else:
                # 尝试通过关键词推断分类
                category = self._infer_category(item)
                if category and category in category_config:
                    categorized[category].append(item)
                else:
                    # 放入默认分类
                    categorized.setdefault("uncategorized", []).append(item)

        # 记录分类统计
        for cat_id, cat_items in categorized.items():
            logger.info("Category '%s': %d items", cat_id, len(cat_items))

        return dict(categorized)

    def _infer_category(self, item: ContentItem) -> Optional[str]:
        """通过关键词推断分类"""
        text = f"{item.title} {item.description}".lower()

        category_keywords = {
            "tech": ["ai", "ml", "tech", "科技", "startup", "robot", "太空"],
            "dev": ["python", "javascript", "react", "rust", "开发", "框架", "github"],
            "ai": ["ai", "llm", "大模型", "chatgpt", "claude", "机器学习", "深度学习"],
            "research": ["paper", "研究", "arxiv", "cs.", "论文"],
            "oss": ["open source", "开源", "release", "v2.", "v3."],
        }

        for category, keywords in category_keywords.items():
            for kw in keywords:
                if kw in text:
                    return category

        return None

    def select_top_items(
        self,
        items: list[ContentItem],
        max_items: int = 5,
    ) -> list[ContentItem]:
        """
        选择每个分类的 Top N 条目

        Args:
            items: 已排序的内容条目列表
            max_items: 最大条目数

        Returns:
            Top N 条目列表
        """
        return items[:max_items]

    def close(self) -> None:
        """关闭数据库连接"""
        if self._db:
            self._db.close()
            self._db = None
