#!/usr/bin/env python3
"""
生成邮件内容的脚本
"""
import sys
from pathlib import Path
from jinja2 import Template

sys.path.insert(0, str(Path(__file__).parent))
from src import get_latest_issue

ROOT_DIR = Path(__file__).parent.parent
DOCS_DIR = ROOT_DIR / "docs"
OUTPUT_DIR = ROOT_DIR / "scripts" / "dist"

NEWSLETTER_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0ea5e9;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #0ea5e9;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            color: #666;
            margin: 10px 0 0 0;
        }
        .content {
            color: #333;
        }
        .content h2 {
            color: #0ea5e9;
            font-size: 18px;
            margin-top: 30px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .content h3 {
            color: #333;
            font-size: 16px;
            margin-top: 20px;
        }
        .content p {
            margin: 10px 0;
        }
        .content ul, .content ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .content a {
            color: #0ea5e9;
            text-decoration: none;
        }
        .content a:hover {
            text-decoration: underline;
        }
        .section {
            margin-bottom: 25px;
        }
        .cta-button {
            display: inline-block;
            background-color: #0ea5e9;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
        }
        .footer a {
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>青年周刊</h1>
            <p>第 {{ issue_number }} 期 | {{ date }}</p>
        </div>

        <div class="content">
            <h2>{{ title }}</h2>
            <p>{{ description }}</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ issue_url }}" class="cta-button">阅读完整内容</a>
            </div>

            <h2>本期目录</h2>
            <ul>
                <li>刊首语</li>
                <li>科技新势力</li>
                <li>二次元次元壁</li>
                <li>游戏研究所</li>
                <li>青春故事会</li>
                <li>好工具</li>
                <li>在看什么</li>
                <li>一周图鉴</li>
                <li>谁在招人</li>
            </ul>

            <h2>精彩看点</h2>
            <div class="section">
                {{ highlights }}
            </div>
        </div>

        <div class="footer">
            <p>青年周刊 - 为年轻人打造的内容聚合周刊</p>
            <p>
                <a href="{{ unsubscribe_url }}">取消订阅</a> |
                <a href="{{ issue_url }}">在浏览器中查看</a>
            </p>
        </div>
    </div>
</body>
</html>
"""


def ensure_dir(path: Path):
    """确保目录存在"""
    path.mkdir(parents=True, exist_ok=True)


def generate_newsletter():
    """生成邮件内容"""
    latest_issue = get_latest_issue(DOCS_DIR)

    if not latest_issue:
        print("No published issue found")
        return

    content = latest_issue.get('content', '')
    highlights = content[:1000].replace('#', '').strip()

    template = Template(NEWSLETTER_TEMPLATE)
    html = template.render(
        title=latest_issue.get('title', f"第{latest_issue['slug']}期"),
        issue_number=latest_issue.get('issue', latest_issue['slug']),
        date=latest_issue.get('date', ''),
        description=latest_issue.get('description', ''),
        issue_url=f"https://youth-weekly.github.io/issues/{latest_issue['slug']}/",
        unsubscribe_url='https://youth-weekly.github.io/unsubscribe/',
        highlights=highlights
    )

    ensure_dir(OUTPUT_DIR)
    newsletter_path = OUTPUT_DIR / "newsletter.html"
    with open(newsletter_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"Generated newsletter: {newsletter_path}")


def main():
    """主函数"""
    print("Generating newsletter...")

    ensure_dir(OUTPUT_DIR)

    generate_newsletter()

    print("Done!")


if __name__ == "__main__":
    main()
