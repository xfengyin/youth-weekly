#!/usr/bin/env python3
"""
生成 RSS Feed 的脚本
"""
import sys
from pathlib import Path
from datetime import datetime
from feedgen.feed import FeedGenerator

sys.path.insert(0, str(Path(__file__).parent))
from src import load_all_issues

ROOT_DIR = Path(__file__).parent.parent
DOCS_DIR = ROOT_DIR / "docs"
OUTPUT_DIR = ROOT_DIR / "scripts" / "dist"


def ensure_dir(path: Path):
    """确保目录存在"""
    path.mkdir(parents=True, exist_ok=True)


def generate_rss():
    """生成 RSS Feed"""
    fg = FeedGenerator()
    fg.title('青年周刊')
    fg.description('为年轻人打造的内容聚合周刊 - 融合科技、二次元、游戏、成长等多个领域')
    fg.link(href='https://youth-weekly.github.io', rel='alternate')
    fg.language('zh-CN')
    fg.author(name='青年周刊编辑部', email='youth-weekly@example.com')
    fg.logo('https://youth-weekly.github.io/logo.png')
    fg.subtitle('每周精选科技、二次元、游戏、成长内容')
    fg.link(href='https://youth-weekly.github.io/rss.xml', rel='self')

    issues = load_all_issues(DOCS_DIR, reverse=True)

    for issue in issues[:20]:
        fe = fg.add_entry()
        fe.title(issue.get('title', f"第{issue['slug']}期"))
        fe.link(href=f"https://youth-weekly.github.io/issues/{issue['slug']}/")
        fe.description(issue.get('description', ''))
        fe.guid(f"https://youth-weekly.github.io/issues/{issue['slug']}/", permalink=True)

        if issue.get('date'):
            try:
                date = datetime.strptime(issue['date'], '%Y-%m-%d')
                fe.pubDate(date)
            except ValueError:
                pass

        content = issue.get('content', '')
        fe.content(content, type='html')

    ensure_dir(OUTPUT_DIR)
    rss_path = OUTPUT_DIR / "rss.xml"
    fg.rss_file(str(rss_path))

    print(f"Generated RSS feed: {rss_path}")


def main():
    """主函数"""
    print("Generating RSS feed...")

    ensure_dir(OUTPUT_DIR)

    generate_rss()

    print("Done!")


if __name__ == "__main__":
    main()
