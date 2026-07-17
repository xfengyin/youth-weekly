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

from youth_weekly.core.collectors import get_collector
from youth_weekly.core.config import (
    ROOT_DIR,
    get_categories,
    get_content_sources_path,
    get_curated_content_path,
    get_dedup_db_path,
)
from youth_weekly.core.curator import ContentCurator
from youth_weekly.core.expander import CATEGORY_TO_SECTION
from youth_weekly.plugin.base import BasePlugin
from youth_weekly.plugin.registry import register

logger = logging.getLogger(__name__)


def _validate_source_categories(
    source_categories: dict[str, Any],
    site_categories: list[dict[str, str]],
) -> None:
    """
    校验 content_sources.yaml 的 source_categories 与 config.yaml 的 categories 一致性。

    校验规则(仅 warning,不影响主流程):
    1. 源分类 ID 应出现在 CATEGORY_TO_SECTION 中(即能被映射到板块)
    2. 若源分类 ID 与 config.yaml#categories 的 ID 重名,需提示其走"直通"映射
    """
    known_ids: set[str] = set(CATEGORY_TO_SECTION.keys())
    site_category_ids: set[str] = {c.get("id", "") for c in site_categories}
    for cat_id in source_categories:
        if cat_id not in known_ids:
            logger.warning(
                "Source category '%s' has no mapping in CATEGORY_TO_SECTION; "
                "items may not be rendered into any section. "
                "Add it to youth_weekly/core/expander.py.",
                cat_id,
            )
        elif cat_id in site_category_ids:
            logger.info(
                "Source category '%s' is also a section category (pass-through).",
                cat_id,
            )


@register()
class CollectPlugin(BasePlugin):
    """采集内容"""

    name: str = "collect"
    version: str = "1.0.0"
    description: str = "从配置的内容源采集内容"

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

        # 从配置读取路径，支持参数覆盖
        sources_path = Path(params.get("sources_path", str(get_content_sources_path())))
        output_path = Path(params.get("output_path", str(get_curated_content_path())))

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

        # 校验 source_categories 与 config.yaml 的一致性
        # 向后兼容: 若使用旧的 categories 字段,自动 fallback
        source_categories_raw = sources_config.get("source_categories")
        if source_categories_raw is None:
            source_categories_raw = sources_config.get("categories", {})
            if source_categories_raw:
                logger.warning(
                    "content_sources.yaml uses deprecated 'categories' field; "
                    "please rename to 'source_categories'."
                )
        _validate_source_categories(source_categories_raw or {}, get_categories())

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

        # 策展:使用 with 语句确保 SQLite 连接在任何情况下都被关闭
        dedup_config = sources_config.get("dedup", {})
        raw_db_path = dedup_config.get("db_path", str(get_dedup_db_path()))
        db_path = (
            ROOT_DIR / raw_db_path
            if not Path(raw_db_path).is_absolute()
            else Path(raw_db_path)
        )
        with ContentCurator(
            dedup_enabled=dedup_config.get("enabled", True),
            dedup_db_path=str(db_path),
            retention_days=dedup_config.get("retention_days", 30),
        ) as curator:
            unique_items = curator.deduplicate(all_items)
            if not unique_items:
                logger.info("All items were duplicates")
                return {"collected": len(all_items), "curated": 0}

            scored_items = curator.score_items(unique_items)
            categorized = curator.categorize(scored_items, source_categories_raw or {})

            # 选择 Top items
            final_items = {}
            for cat_id, items in categorized.items():
                cat_cfg = (source_categories_raw or {}).get(cat_id, {})
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
            logger.info(
                "Final curated: %d items in %d categories", total, len(final_items)
            )

            return {
                "collected": len(all_items),
                "curated": total,
                "output_path": str(output_path),
            }


__all__ = ["CollectPlugin"]
