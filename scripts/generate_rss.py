#!/usr/bin/env python3
"""
生成 RSS Feed 的脚本
"""
import sys
import logging
from pathlib import Path
from datetime import datetime
from feedgen.feed import FeedGenerator

# 支持直接执行时找到 src 模块
_script_dir = Path(__file__).parent
if str(_script_dir) not in sys.path:
    sys.path.insert(0, str(_script_dir))

from src import load_all_issues
from src.config import get_config

logger = logging.getLogger(__name__)

ROOT_DIR = _script_dir.parent
DOCS_DIR = ROOT_DIR / "docs"
OUTPUT_DIR = ROOT_DIR / "scripts" / "dist"


def ensure_dir(path: Path):
    """确保目录存在"""
    path.mkdir(parents=True, exist_ok=True)


def generate_rss():
    """生成 RSS Feed"""
    config = get_config()
    fg = FeedGenerator()
    fg.title(config.rss.title)
    fg.description(config.rss.description)
    fg.link(href=config.site.url, rel='alternate')
    fg.language(config.site.language)
    fg.author(name=config.author.name, email=config.author.email)
    fg.logo(f"{config.site.url}/logo.png")
    fg.subtitle(config.rss.subtitle)
    fg.link(href=f"{config.site.url}/rss.xml", rel='self')

    issues = load_all_issues(DOCS_DIR, reverse=True)

    max_items = config.content.max_rss_items
    for issue in issues[:max_items]:
        fe = fg.add_entry()
        fe.title(issue.get('title', f"第{issue['slug']}期"))
        fe.link(href=f"{config.site.url}/issues/{issue['slug']}/")
        fe.description(issue.get('description', ''))
        fe.guid(f"{config.site.url}/issues/{issue['slug']}/", permalink=True)

        if issue.get('date'):
            try:
                pub_date = datetime.strptime(issue['date'], '%Y-%m-%d')
                fe.pubDate(pub_date)
            except ValueError:
                pass

        content = issue.get('content', '')
        fe.content(content, type='html')

    ensure_dir(OUTPUT_DIR)
    rss_path = OUTPUT_DIR / "rss.xml"
    fg.rss_file(str(rss_path))

    logger.info("Generated RSS feed: %s", rss_path)


def main():
    """主函数"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    logger.info("Generating RSS feed...")

    ensure_dir(OUTPUT_DIR)

    generate_rss()

    logger.info("Done!")


if __name__ == "__main__":
    main()
