#!/usr/bin/env python3
"""
周刊生成主脚本 - 从采集的内容生成新期周刊
"""
import sys
import logging
import json
from pathlib import Path

# 支持直接执行时找到 src 模块
_script_dir = Path(__file__).parent
if str(_script_dir) not in sys.path:
    sys.path.insert(0, str(_script_dir))

from src.issue_generator import IssueGenerator
from src.collectors import ContentItem
from src.config import ROOT_DIR

logger = logging.getLogger(__name__)

CURATED_OUTPUT_PATH = _script_dir / ".curated_content.json"


def load_curated_content() -> dict[str, list[ContentItem]]:
    """加载已策展的内容"""
    if not CURATED_OUTPUT_PATH.exists():
        logger.error("Curated content not found. Run collect_content.py first.")
        return {}

    with open(CURATED_OUTPUT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    categorized = {}
    for cat_id, items in data.items():
        categorized[cat_id] = [
            ContentItem(
                title=item["title"],
                url=item["url"],
                description=item.get("description", ""),
                source=item.get("source", ""),
                category=cat_id,
                score=item.get("score", 0),
            )
            for item in items
        ]

    return categorized


def main():
    """主函数"""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logger.info("=" * 60)
    logger.info("Issue Generator")
    logger.info("=" * 60)

    # 1. 加载策展内容
    categorized_items = load_curated_content()
    if not categorized_items:
        logger.error("No curated content available")
        sys.exit(1)

    # 2. 生成周刊
    generator = IssueGenerator()
    issue_dir = generator.generate(categorized_items)

    if issue_dir:
        logger.info("Issue generated successfully at %s", issue_dir)
    else:
        logger.error("Failed to generate issue")
        sys.exit(1)

    logger.info("=" * 60)
    logger.info("Done!")


if __name__ == "__main__":
    main()
