#!/usr/bin/env python3
"""
内容策展模块 - 去重、评分、分类、排序
"""

from __future__ import annotations

import logging
import sqlite3
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from .collectors import ContentItem
from .config import get_dedup_db_path

logger = logging.getLogger(__name__)


class ContentCurator:
    """
    内容策展器

    支持上下文管理器协议，确保数据库连接在退出时自动关闭：

        with ContentCurator() as curator:
            items = curator.deduplicate(items)
            items = curator.score_items(items)
    """

    def __init__(
        self,
        dedup_enabled: bool = True,
        dedup_db_path: str | None = None,
        retention_days: int = 30,
    ) -> None:
        self.dedup_enabled = dedup_enabled
        # 若未显式传入路径，则从配置读取；保持向后兼容
        self.dedup_db_path = (
            dedup_db_path if dedup_db_path is not None else str(get_dedup_db_path())
        )
        self.retention_days = retention_days
        self._db: sqlite3.Connection | None = None

        if dedup_enabled:
            self._init_dedup_db()

    def _get_db(self) -> sqlite3.Connection:
        """获取数据库连接(懒加载)"""
        if self._db is None:
            db_path = Path(self.dedup_db_path)
            if not db_path.is_absolute():
                db_path = Path.cwd() / db_path
            db_path.parent.mkdir(parents=True, exist_ok=True)
            self._db = sqlite3.connect(str(db_path))
            self._db.execute("PRAGMA journal_mode=WAL")
        return self._db

    def _init_dedup_db(self) -> None:
        """初始化去重数据库 + 清理过期记录"""
        db = self._get_db()
        db.execute("""
            CREATE TABLE IF NOT EXISTS content_fingerprints (
                fingerprint TEXT PRIMARY KEY,
                title TEXT,
                url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
        db.commit()
        cutoff = datetime.now() - timedelta(days=self.retention_days)
        # SQLite CURRENT_TIMESTAMP 格式为 "YYYY-MM-DD HH:MM:SS",必须用相同格式比较
        db.execute(
            "DELETE FROM content_fingerprints WHERE created_at < ?",
            (cutoff.strftime("%Y-%m-%d %H:%M:%S"),),
        )
        db.commit()

    def deduplicate(self, items: list[ContentItem]) -> list[ContentItem]:
        """
        对内容条目进行去重（批量优化版本）

        性能优化:
        - 一次 SELECT 拉取所有已存在指纹（O(1) 次往返代替 O(N) 次）
        - 用 executemany 批量插入新增指纹
        - 输入列表内重复的条目也由单一去重集合处理

        Args:
            items: 原始内容条目列表

        Returns:
            去重后的内容条目列表
        """
        if not self.dedup_enabled:
            return items

        if not items:
            return []

        db = self._get_db()

        # 1) 一次查询拉取所有候选指纹
        candidate_fps = {item.fingerprint for item in items}
        placeholders = ",".join("?" * len(candidate_fps))
        existing: set[str] = set()
        if candidate_fps:
            cursor = db.execute(
                f"SELECT fingerprint FROM content_fingerprints "
                f"WHERE fingerprint IN ({placeholders})",
                tuple(candidate_fps),
            )
            existing = {row[0] for row in cursor.fetchall()}

        # 2) 在内存中按指纹去重,保留首次出现顺序
        seen: set[str] = set()
        unique_items: list[ContentItem] = []
        new_rows: list[tuple[str, str, str]] = []
        for item in items:
            fp = item.fingerprint
            if fp in seen or fp in existing:
                continue
            seen.add(fp)
            unique_items.append(item)
            new_rows.append((fp, item.title, item.url))

        # 3) 批量插入新增指纹(单次 SQL 往返)
        if new_rows:
            db.executemany(
                "INSERT OR IGNORE INTO content_fingerprints "
                "(fingerprint, title, url) VALUES (?, ?, ?)",
                new_rows,
            )
        db.commit()

        seen_count = len(items) - len(unique_items)
        if seen_count > 0:
            logger.info("Dedup: filtered %d duplicate items", seen_count)
        logger.info(
            "Dedup: %d -> %d items (removed %d, batch=%d)",
            len(items),
            len(unique_items),
            seen_count,
            len(new_rows),
        )
        return unique_items

    def score_items(self, items: list[ContentItem]) -> list[ContentItem]:
        """
        对内容条目进行评分排序

        评分因素:
        - 标题长度(适中更好)
        - 描述完整性
        - 来源权威性(可配置权重)
        - 关键词匹配
        """
        source_weights: dict[str, float] = {
            "Hacker News": 1.5,
            "GitHub Trending": 1.3,
            "TechCrunch": 1.2,
            "The Verge": 1.1,
            "Google AI Blog": 1.3,
            "Python Weekly": 1.1,
            "JavaScript Weekly": 1.1,
            "React Status": 1.0,
        }

        hot_keywords: dict[str, float] = {
            "ai": 2.0,
            "llm": 2.0,
            "大模型": 2.0,
            "chatgpt": 1.5,
            "claude": 1.5,
            "react": 1.0,
            "python": 1.0,
            "开源": 1.0,
            "open source": 1.0,
            "rust": 1.2,
            "typescript": 1.0,
            "next.js": 1.0,
            "web": 0.5,
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
                if keyword in text:
                    score += weight

            # 已有分数(如 HN 的 score 字段)
            if item.score > 0:
                score += item.score * 0.1

            item.score = int(round(score)) if score else 0

        # 按分数降序排序
        items.sort(key=lambda x: x.score, reverse=True)
        logger.info("Scored %d items", len(items))
        return items

    def categorize(
        self,
        items: list[ContentItem],
        category_config: dict[str, Any],
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
            if item.category and item.category in category_config:
                categorized[item.category].append(item)
            else:
                # 尝试通过关键词推断分类
                category = self._infer_category(item)
                if category and category in category_config:
                    categorized[category].append(item)
                else:
                    categorized.setdefault("uncategorized", []).append(item)

        for cat_id, cat_items in categorized.items():
            logger.info("Category '%s': %d items", cat_id, len(cat_items))

        return dict(categorized)

    def _infer_category(self, item: ContentItem) -> str | None:
        """通过关键词推断分类"""
        text = f"{item.title} {item.description}".lower()

        category_keywords: dict[str, list[str]] = {
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
        选择 Top N 条目

        Args:
            items: 已排序的内容条目列表
            max_items: 最大条目数

        Returns:
            Top N 条目列表
        """
        return items[:max_items]

    def close(self) -> None:
        """关闭数据库连接"""
        if self._db is not None:
            self._db.close()
            self._db = None

    def __enter__(self) -> ContentCurator:
        """进入上下文管理器"""
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: Any,
    ) -> None:
        """退出上下文管理器，确保数据库连接关闭"""
        self.close()


__all__ = ["ContentCurator"]
