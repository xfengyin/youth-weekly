#!/usr/bin/env python3
"""
检查是否有新的周刊需要发布
"""
import sys
import os
import logging
from pathlib import Path
from datetime import datetime

# 支持直接执行时找到 src 模块
_script_dir = Path(__file__).parent
if str(_script_dir) not in sys.path:
    sys.path.insert(0, str(_script_dir))

from src import load_all_issues

logger = logging.getLogger(__name__)

ROOT_DIR = _script_dir.parent
DOCS_DIR = ROOT_DIR / "docs"


def check_new_issue():
    """检查是否有新的周刊可以发布"""
    if not DOCS_DIR.exists():
        logger.warning("No issues directory found")
        return False

    issues = load_all_issues(DOCS_DIR, reverse=True, include_unpublished=False)

    if not issues:
        logger.warning("No published issue found")
        return False

    today = datetime.now().date()

    for issue in issues:
        if issue.get('date'):
            try:
                issue_date = datetime.strptime(issue['date'], '%Y-%m-%d').date()
                if issue_date <= today and issue.get('published', True):
                    logger.info("Found issue ready for publish: %s", issue['title'])
                    return True
            except ValueError:
                continue

    logger.info("No new issue ready for publish")
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
