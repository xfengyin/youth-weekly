#!/usr/bin/env python3
"""
生成 RSS Feed 的脚本
"""
import os
import sys
import yaml
from pathlib import Path
from datetime import datetime
from feedgen.feed import FeedGenerator

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
    
    issues_dir = DOCS_DIR / "issues"
    if not issues_dir.exists():
        print("No issues directory found")
        return
    
    # 加载所有周刊
    issues = []
    for issue_dir in sorted(issues_dir.iterdir(), reverse=True):
        if issue_dir.is_dir() and issue_dir.name.isdigit():
            issue = load_issue(issue_dir)
            if issue and issue.get('published', True):
                issues.append(issue)
    
    # 只取最近20期
    for issue in issues[:20]:
        fe = fg.add_entry()
        fe.title(issue.get('title', f'第{issue["slug"]}期'))
        fe.link(href=f'https://youth-weekly.github.io/issues/{issue["slug"]}/')
        fe.description(issue.get('description', ''))
        fe.guid(f'https://youth-weekly.github.io/issues/{issue["slug"]}/', permalink=True)
        
        # 设置日期
        if issue.get('date'):
            try:
                date = datetime.strptime(issue['date'], '%Y-%m-%d')
                fe.pubDate(date)
            except ValueError:
                pass
        
        # 添加内容
        content = issue.get('content', '')
        fe.content(content, type='html')
    
    # 保存 RSS
    ensure_dir(OUTPUT_DIR)
    rss_path = OUTPUT_DIR / "rss.xml"
    fg.rss_file(str(rss_path))
    
    print(f"Generated RSS feed: {rss_path}")

def main():
    """主函数"""
    print("Generating RSS feed...")
    
    # 创建输出目录
    ensure_dir(OUTPUT_DIR)
    
    # 生成 RSS
    generate_rss()
    
    print("Done!")

if __name__ == "__main__":
    main()
