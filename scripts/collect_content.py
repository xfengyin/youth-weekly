#!/usr/bin/env python3
"""
内容采集主脚本 - 自动采集、策展、保存内容
"""
import sys
import logging
import json
from pathlib import Path

# 支持直接执行时找到 src 模块
_script_dir = Path(__file__).parent
if str(_script_dir) not in sys.path:
    sys.path.insert(0, str(_script_dir))

import yaml

from src.collectors import get_collector, ContentItem
from src.curator import ContentCurator
from src.config import ROOT_DIR

logger = logging.getLogger(__name__)

CONTENT_SOURCES_PATH = ROOT_DIR / "scripts" / "content_sources.yaml"
CURATED_OUTPUT_PATH = _script_dir / ".curated_content.json"


def load_content_sources() -> tuple[list[dict], dict]:
    """加载内容源配置，同时返回完整配置供下游使用"""
    if not CONTENT_SOURCES_PATH.exists():
        logger.error("Content sources config not found: %s", CONTENT_SOURCES_PATH)
        return [], {}

    with open(CONTENT_SOURCES_PATH, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    sources = config.get("sources", [])
    enabled_sources = [s for s in sources if s.get("enabled", True)]
    logger.info("Loaded %d enabled content sources", len(enabled_sources))
    return enabled_sources, config


def collect_all(sources: list[dict]) -> list[ContentItem]:
    """从所有源采集内容"""
    all_items = []

    collection_config = {
        "timeout": 30,
        "max_retries": 3,
        "delay": 2.0,
    }

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
            logger.error("Failed to collect from %s: %s", source.get("name", "unknown"), e)

    logger.info("Total collected: %d items", len(all_items))
    return all_items


def main():
    """主函数"""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logger.info("=" * 60)
    logger.info("Content Collection Pipeline")
    logger.info("=" * 60)

    # 1. 加载内容源
    sources, full_config = load_content_sources()
    if not sources:
        logger.error("No content sources available")
        sys.exit(1)

    # 2. 采集内容
    all_items = collect_all(sources)
    if not all_items:
        logger.warning("No content collected")
        sys.exit(1)

    # 3. 去重
    dedup_config = full_config.get("dedup", {})
    curator = ContentCurator(
        dedup_enabled=dedup_config.get("enabled", True),
        dedup_db_path=str(ROOT_DIR / dedup_config.get("db_path", "scripts/.content_dedup.db")),
        retention_days=dedup_config.get("retention_days", 30),
    )

    unique_items = curator.deduplicate(all_items)
    if not unique_items:
        logger.info("All items were duplicates, nothing new to publish")
        curator.close()
        sys.exit(1)

    # 4. 评分排序
    scored_items = curator.score_items(unique_items)

    # 5. 分类
    category_config = full_config.get("categories", {})
    categorized = curator.categorize(scored_items, category_config)

    # 6. 选择 Top items per category
    final_items = {}
    for cat_id, items in categorized.items():
        cat_cfg = category_config.get(cat_id, {})
        max_items = cat_cfg.get("max_items", 5)
        final_items[cat_id] = curator.select_top_items(items, max_items)

    # 7. 保存结果供生成器使用
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

    CURATED_OUTPUT_PATH.write_text(json.dumps(output_data, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info("Saved curated content to %s", CURATED_OUTPUT_PATH)

    total = sum(len(items) for items in final_items.values())
    logger.info("Final curated: %d items in %d categories", total, len(final_items))
    logger.info("=" * 60)
    logger.info("Done!")

    curator.close()


if __name__ == "__main__":
    main()
