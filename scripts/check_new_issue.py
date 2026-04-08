#!/usr/bin/env python3
"""
检查是否有新的周刊需要发布
"""
import os
import sys
import yaml
from pathlib import Path
from datetime import datetime, timedelta

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
DOCS_DIR = ROOT_DIR / "docs"

def load_issue(issue_dir: Path) -> dict:
    """加载单期周刊"""
    readme_path = issue_dir / "README.md"
    if not readme_path.exists():
        return None
    
    content = readme_path.read_text(encoding='utf-8')
    
    # 解析 front matter
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            front_matter = yaml.safe_load(parts[1])
            return {
                **front_matter,
                'slug': issue_dir.name
            }
    
    return None

def check_new_issue():
    """检查是否有新的周刊可以发布"""
    issues_dir = DOCS_DIR / "issues"
    if not issues_dir.exists():
        print("No issues directory found")
        return False
    
    today = datetime.now().date()
    
    # 检查每一期
    for issue_dir in sorted(issues_dir.iterdir(), reverse=True):
        if issue_dir.is_dir() and issue_dir.name.isdigit():
            issue = load_issue(issue_dir)
            if issue:
                # 检查是否是今天或之前发布
                if issue.get('date'):
                    try:
                        issue_date = datetime.strptime(issue['date'], '%Y-%m-%d').date()
                        # 如果日期是今天或之前，且 published 为 true
                        if issue_date <= today and issue.get('published', True):
                            # 检查这期是否已经发布（通过检查 web 目录中是否存在）
                            print(f"Found issue ready for publish: {issue['title']}")
                            return True
                    except ValueError:
                        continue
    
    print("No new issue ready for publish")
    return False

def main():
    """主函数"""
    ready = check_new_issue()
    
    # 设置输出供 GitHub Actions 使用
    if 'GITHUB_OUTPUT' in os.environ:
        with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
            f.write(f"ready={'true' if ready else 'false'}\n")
    
    sys.exit(0 if ready else 1)

if __name__ == "__main__":
    main()
