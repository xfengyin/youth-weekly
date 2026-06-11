#!/usr/bin/env python3
"""
检查是否有新的周刊需要发布
- 优先检查 docs/issues/ 下是否有本周创建但未发布的 issue
- 如果没有，说明自动采集还未运行，返回 false
"""
import sys
import os
import logging
from pathlib import Path
from datetime import datetime, timedelta

_script_dir = Path(__file__).parent
if str(_script_dir) not in sys.path:
    sys.path.insert(0, str(_script_dir))

from src import load_all_issues

logger = logging.getLogger(__name__)

ROOT_DIR = _script_dir.parent
DOCS_DIR = ROOT_DIR / "docs"


def check_new_issue() -> bool:
    """检查是否有新的周刊可以发布"""
    if not DOCS_DIR.exists():
        logger.warning("No issues directory found")
        return False

    issues = load_all_issues(DOCS_DIR, reverse=True, include_unpublished=True)
    if not issues:
        logger.warning("No issues found")
        return False

    # 获取本周的起始日期（周一）
    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    # 检查本周是否有 issue 存在
    for issue in issues:
        if issue.get('date'):
            try:
                issue_date = datetime.strptime(issue['date'], '%Y-%m-%d').date()
                if week_start <= issue_date <= week_end:
                    published = issue.get('published', True)
                    if not published:
                        logger.info("Found unpublished issue for this week: %s", issue['title'])
                        return True
                    else:
                        logger.info("Issue for this week is already published: %s", issue['title'])
                        # 已经发布过了，不需要再次发布
                        return False
            except ValueError:
                continue

    logger.info("No issue exists for the current week, auto-collection may need to run first")
    return False


def main():
    """主函数"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    ready = check_new_issue()

    if 'GITHUB_OUTPUT' in os.environ:
        with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
            f.write(f"has_new={'true' if ready else 'false'}\n")

    sys.exit(0 if ready else 1)


if __name__ == "__main__":
    main()
