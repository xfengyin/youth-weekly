#!/usr/bin/env python3
"""
检查是否有新的周刊需要发布
"""
import os
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))
from src import load_all_issues

ROOT_DIR = Path(__file__).parent.parent
DOCS_DIR = ROOT_DIR / "docs"


def check_new_issue():
    """检查是否有新的周刊可以发布"""
    if not DOCS_DIR.exists():
        print("No issues directory found")
        return False

    issues = load_all_issues(DOCS_DIR, reverse=True, include_unpublished=False)

    if not issues:
        print("No published issue found")
        return False

    today = datetime.now().date()

    for issue in issues:
        if issue.get('date'):
            try:
                issue_date = datetime.strptime(issue['date'], '%Y-%m-%d').date()
                if issue_date <= today and issue.get('published', True):
                    print(f"Found issue ready for publish: {issue['title']}")
                    return True
            except ValueError:
                continue

    print("No new issue ready for publish")
    return False


def main():
    """主函数"""
    ready = check_new_issue()

    if 'GITHUB_OUTPUT' in os.environ:
        with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
            f.write(f"ready={'true' if ready else 'false'}\n")

    sys.exit(0 if ready else 1)


if __name__ == "__main__":
    main()
