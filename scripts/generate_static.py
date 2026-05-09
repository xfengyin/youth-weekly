#!/usr/bin/env python3
"""
生成静态页面和数据的脚本
"""
import sys
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))
from src import load_all_issues, get_latest_issue, get_issue_count

ROOT_DIR = Path(__file__).parent.parent
DOCS_DIR = ROOT_DIR / "docs"
OUTPUT_DIR = ROOT_DIR / "scripts" / "dist"


def ensure_dir(path: Path):
    """确保目录存在"""
    path.mkdir(parents=True, exist_ok=True)


def generate_issues_index():
    """生成周刊索引 JSON"""
    issues = load_all_issues(DOCS_DIR, reverse=True)

    issues_data = [
        {
            'issue': issue.get('issue', int(issue['slug'])),
            'title': issue.get('title', f"第{issue['slug']}期"),
            'date': issue.get('date', ''),
            'description': issue.get('description', ''),
            'slug': issue['slug'],
            'cover': issue.get('cover', ''),
        }
        for issue in issues
    ]

    ensure_dir(OUTPUT_DIR)
    index_path = OUTPUT_DIR / "issues.json"
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(issues_data, f, ensure_ascii=False, indent=2)

    print(f"Generated issues index: {index_path}")
    return issues_data


def generate_search_index():
    """生成搜索索引"""
    issues = load_all_issues(DOCS_DIR, reverse=True)

    search_index = []
    for issue in issues:
        content = issue.get('content', '')
        excerpt_raw = content[:500].replace('#', '').strip()
        excerpt = excerpt_raw + '...' if len(content) > 500 else excerpt_raw

        search_index.append({
            'issue': issue.get('issue', int(issue['slug'])),
            'title': issue.get('title', ''),
            'date': issue.get('date', ''),
            'slug': issue['slug'],
            'excerpt': excerpt,
        })

    ensure_dir(OUTPUT_DIR)
    index_path = OUTPUT_DIR / "search.json"
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(search_index, f, ensure_ascii=False, indent=2)

    print(f"Generated search index: {index_path}")


def generate_stats():
    """生成统计数据"""
    issues = load_all_issues(DOCS_DIR, reverse=True)

    dates = [issue.get('date', '') for issue in issues if issue.get('date')]

    stats = {
        'total_issues': get_issue_count(DOCS_DIR),
        'first_issue_date': min(dates) if dates else None,
        'last_issue_date': max(dates) if dates else None,
        'generated_at': datetime.now().isoformat(),
    }

    ensure_dir(OUTPUT_DIR)
    stats_path = OUTPUT_DIR / "stats.json"
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print(f"Generated stats: {stats_path}")


def main():
    """主函数"""
    print("Generating static files...")

    ensure_dir(OUTPUT_DIR)

    generate_issues_index()
    generate_search_index()
    generate_stats()

    print("Done!")


if __name__ == "__main__":
    main()
