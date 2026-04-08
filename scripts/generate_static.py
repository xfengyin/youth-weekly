#!/usr/bin/env python3
"""
生成静态页面和数据的脚本
"""
import os
import sys
import json
import yaml
from pathlib import Path
from datetime import datetime

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
DOCS_DIR = ROOT_DIR / "docs"
OUTPUT_DIR = ROOT_DIR / "scripts" / "dist"

def ensure_dir(path: Path):
    """确保目录存在"""
    path.mkdir(parents=True, exist_ok=True)

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
            body = parts[2].strip()
            return {
                **front_matter,
                'content': body,
                'slug': issue_dir.name
            }
    
    return None

def generate_issues_index():
    """生成周刊索引 JSON"""
    issues_dir = DOCS_DIR / "issues"
    if not issues_dir.exists():
        print("No issues directory found")
        return []
    
    issues = []
    for issue_dir in sorted(issues_dir.iterdir(), reverse=True):
        if issue_dir.is_dir() and issue_dir.name.isdigit():
            issue = load_issue(issue_dir)
            if issue and issue.get('published', True):
                issues.append({
                    'issue': issue.get('issue', int(issue_dir.name)),
                    'title': issue.get('title', f'第{issue_dir.name}期'),
                    'date': issue.get('date', ''),
                    'description': issue.get('description', ''),
                    'slug': issue_dir.name,
                    'cover': issue.get('cover', ''),
                })
    
    # 保存索引
    ensure_dir(OUTPUT_DIR)
    index_path = OUTPUT_DIR / "issues.json"
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(issues, f, ensure_ascii=False, indent=2)
    
    print(f"Generated issues index: {index_path}")
    return issues

def generate_search_index():
    """生成搜索索引"""
    issues_dir = DOCS_DIR / "issues"
    if not issues_dir.exists():
        return
    
    search_index = []
    for issue_dir in issues_dir.iterdir():
        if issue_dir.is_dir() and issue_dir.name.isdigit():
            issue = load_issue(issue_dir)
            if issue and issue.get('published', True):
                # 提取前500字作为摘要
                content = issue.get('content', '')
                excerpt = content[:500].replace('#', '').strip()
                
                search_index.append({
                    'issue': issue.get('issue', int(issue_dir.name)),
                    'title': issue.get('title', ''),
                    'date': issue.get('date', ''),
                    'slug': issue_dir.name,
                    'excerpt': excerpt + '...' if len(content) > 500 else excerpt,
                })
    
    # 保存搜索索引
    ensure_dir(OUTPUT_DIR)
    index_path = OUTPUT_DIR / "search.json"
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(search_index, f, ensure_ascii=False, indent=2)
    
    print(f"Generated search index: {index_path}")

def generate_stats():
    """生成统计数据"""
    issues_dir = DOCS_DIR / "issues"
    
    stats = {
        'total_issues': 0,
        'first_issue_date': None,
        'last_issue_date': None,
        'generated_at': datetime.now().isoformat(),
    }
    
    if issues_dir.exists():
        dates = []
        for issue_dir in issues_dir.iterdir():
            if issue_dir.is_dir() and issue_dir.name.isdigit():
                issue = load_issue(issue_dir)
                if issue and issue.get('published', True):
                    stats['total_issues'] += 1
                    if issue.get('date'):
                        dates.append(issue['date'])
        
        if dates:
            stats['first_issue_date'] = min(dates)
            stats['last_issue_date'] = max(dates)
    
    # 保存统计
    ensure_dir(OUTPUT_DIR)
    stats_path = OUTPUT_DIR / "stats.json"
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    
    print(f"Generated stats: {stats_path}")

def main():
    """主函数"""
    print("Generating static files...")
    
    # 创建输出目录
    ensure_dir(OUTPUT_DIR)
    
    # 生成各种索引
    generate_issues_index()
    generate_search_index()
    generate_stats()
    
    print("Done!")

if __name__ == "__main__":
    main()
