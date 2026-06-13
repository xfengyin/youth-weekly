#!/usr/bin/env python3
"""
内容采集插件
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import yaml

from youth_weekly.plugin.base import BasePlugin
from youth_weekly.plugin.registry import register
from youth_weekly.core.collectors import get_collector
from youth_weekly.core.curator import ContentCurator

logger = logging.getLogger(__name__)


@register()
class CollectPlugin(BasePlugin):
    """采集内容"""

    @property
    def name(self) -> str:
        return "collect"

    @property
    def version(self) -> str:
        return "1.0.0"

    @property
    def description(self) -> str:
        return "从配置的内容源采集内容"

    def execute(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        执行内容采集

        Args:
            params: 参数字典，支持:
                - sources_path: 内容源配置文件路径
                - output_path: 输出文件路径

        Returns:
            采集结果数据
        """
        params = params or {}

        sources_path = Path(params.get("sources_path", "scripts/content_sources.yaml"))
        output_path = Path(params.get("output_path", "scripts/.curated_content.json"))

        if not sources_path.exists():
            logger.warning("Content sources config not found: %s", sources_path)
            return {"collected": 0, "curated": 0}

        # 加载内容源
        with open(sources_path, "r", encoding="utf-8") as f:
            sources_config = yaml.safe_load(f)

        sources = [
            s for s in sources_config.get("sources", []) if s.get("enabled", True)
        ]
        logger.info("Loaded %d enabled content sources", len(sources))

        # 采集
        collection_config = {"timeout": 30, "max_retries": 3, "delay": 2.0}
        all_items = []

        for source in sources:
            collector_type = source.get("type", "rss")
            collector = get_collector(collector_type, **collection_config)

            if collector is None:
                logger.warning("Skipping unknown source type: %s", collector_type)
                continue

            try:
                items = collector.collect(source)
                all_items.extend(items)
            except Exception as e:
                logger.error(
                    "Failed to collect from %s: %s", source.get("name", "unknown"), e
                )

        logger.info("Total collected: %d items", len(all_items))

        if not all_items:
            return {"collected": 0, "curated": 0}

        # 策展
        dedup_config = sources_config.get("dedup", {})
        curator = ContentCurator(
            dedup_enabled=dedup_config.get("enabled", True),
            dedup_db_path=str(
                Path(dedup_config.get("db_path", "scripts/.content_dedup.db"))
            ),
            retention_days=dedup_config.get("retention_days", 30),
        )

        unique_items = curator.deduplicate(all_items)
        if not unique_items:
            logger.info("All items were duplicates")
            curator.close()
            return {"collected": len(all_items), "curated": 0}

        scored_items = curator.score_items(unique_items)
        category_config = sources_config.get("categories", {})
        categorized = curator.categorize(scored_items, category_config)

        # 选择 Top items
        final_items = {}
        for cat_id, items in categorized.items():
            cat_cfg = category_config.get(cat_id, {})
            max_items = cat_cfg.get("max_items", 5)
            final_items[cat_id] = curator.select_top_items(items, max_items)

        # 保存结果
        output_data = {}
        for cat_id, items in final_items.items():
            output_data[cat_id] = [
                {
                    "title": item.title,
                    "url": item.url,
                    "description": item.description,
                    "source": item.source,
                    "score": item.score,
                }
                for item in items
            ]

        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(output_data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        total = sum(len(items) for items in final_items.values())
        logger.info("Final curated: %d items in %d categories", total, len(final_items))

        curator.close()

        return {
            "collected": len(all_items),
            "curated": total,
            "output_path": str(output_path),
        }


__all__ = ["CollectPlugin"]
