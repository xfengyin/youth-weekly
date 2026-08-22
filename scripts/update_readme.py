#!/usr/bin/env python3
"""
同步 README.md 与 docs/README.md 的周刊索引/最新一期区块。

使用标记块（AUTO_ISSUE_START/AUTO_ISSUE_END）包围自动生成内容，
标记之外的手工内容不会被修改。

用法:
    cd scripts
    uv run python update_readme.py            # 使用仓库根目录
    uv run python update_readme.py --check    # 仅检查是否有差异（CI 契约用）
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from youth_weekly.core.content import load_all_issues

ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"
DOCS_README = ROOT / "docs" / "README.md"

START = "<!-- AUTO_ISSUE_START -->"
END = "<!-- AUTO_ISSUE_END -->"
TABLE_START = "<!-- AUTO_ISSUE_TABLE_START -->"
TABLE_END = "<!-- AUTO_ISSUE_TABLE_END -->"


def _load_issues() -> list[dict]:
    """按期号升序返回已发布周刊。"""
    issues = load_all_issues(ROOT / "docs", reverse=False)
    return issues


def _render_latest_block(issue: dict) -> str:
    slug = str(issue["slug"])
    title = str(issue.get("title") or f"第{issue['slug']}期")
    date = str(issue.get("date") or "")
    description = str(issue.get("description") or "").strip()
    if not description:
        content = str(issue.get("content") or "")
        description = content[:120].replace("#", "").strip() + "..."

    lines = [
        f"## 📰 最新一期 · 第 {issue.get('issue', slug)} 期",
        "",
        f"> **{date}** | 第 {issue.get('issue', slug)} 期",
        "",
        f"**{title}**",
        "",
        description,
        "",
        f"👉 [阅读第 {issue.get('issue', slug)} 期全文](https://xfengyin.github.io/youth-weekly/issues/{slug}/) · "
        f"[浏览所有周刊](https://xfengyin.github.io/youth-weekly/issues/)",
    ]
    return "\n".join(lines)


def _render_docs_table(issues: list[dict]) -> str:
    lines = [
        "| 期号 | 标题 | 发布日期 | 链接 |",
        "|:----:|------|---------|------|",
    ]
    for issue in issues:
        slug = str(issue["slug"])
        num = issue.get("issue", slug)
        title = str(issue.get("title") or f"第{num}期")
        date = str(issue.get("date") or "")
        lines.append(f"| 第 {num} 期 | {title} | {date} | [阅读](./issues/{slug}/README.md) |")
    return "\n".join(lines)


def _replace_block(text: str, start: str, end: str, new_block: str) -> tuple[str, bool]:
    """替换 start/end 标记之间的内容；标记缺失时返回原文本与 False。"""
    if start not in text or end not in text:
        return text, False
    before = text.split(start, 1)[0]
    after = text.split(end, 1)[1]
    return f"{before}{start}\n{new_block}\n{end}{after}", True


def update_readme() -> dict[str, bool]:
    issues = _load_issues()
    if not issues:
        raise SystemExit("没有找到已发布周刊，无法生成 README")

    latest = issues[-1]  # 升序最后一个为最新

    changed = {}

    # 1) 根 README 最新一期区块
    readme_text = README.read_text(encoding="utf-8")
    new_latest = _render_latest_block(latest)
    readme_text, ok = _replace_block(readme_text, START, END, new_latest)
    changed["README.md"] = ok
    if ok:
        README.write_text(readme_text, encoding="utf-8")

    # 2) docs/README.md 索引表
    docs_text = DOCS_README.read_text(encoding="utf-8")
    new_table = _render_docs_table(issues)
    docs_text, ok = _replace_block(docs_text, TABLE_START, TABLE_END, new_table)
    changed["docs/README.md"] = ok
    if ok:
        DOCS_README.write_text(docs_text, encoding="utf-8")

    return changed


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="仅检查差异，不写文件")
    args = parser.parse_args(argv)

    issues = _load_issues()
    if not issues:
        print("没有找到已发布周刊，无法生成 README", file=sys.stderr)
        return 1

    latest = issues[-1]
    readme_text = README.read_text(encoding="utf-8")
    docs_text = DOCS_README.read_text(encoding="utf-8")

    new_latest = _render_latest_block(latest)
    new_readme, ok1 = _replace_block(readme_text, START, END, new_latest)
    new_table = _render_docs_table(issues)
    new_docs, ok2 = _replace_block(docs_text, TABLE_START, TABLE_END, new_table)

    if not ok1:
        print(f"错误：README.md 缺少标记 {START}/{END}", file=sys.stderr)
        return 1
    if not ok2:
        print(f"错误：docs/README.md 缺少标记 {TABLE_START}/{TABLE_END}", file=sys.stderr)
        return 1

    if args.check:
        diff = new_readme != readme_text or new_docs != docs_text
        if diff:
            print("README 索引存在差异，请运行 scripts/update_readme.py 同步", file=sys.stderr)
            return 1
        print("README 索引已是最新")
        return 0

    README.write_text(new_readme, encoding="utf-8")
    DOCS_README.write_text(new_docs, encoding="utf-8")
    print(f"已更新 README.md 最新一期 → 第 {latest.get('issue', latest['slug'])} 期")
    print(f"已更新 docs/README.md 索引 → {len(issues)} 期")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
