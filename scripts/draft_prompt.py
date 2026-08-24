#!/usr/bin/env python3
"""
从策展 JSON 生成给 LLM 的整期初稿提示词模板。

用途：`youth-weekly collect` 产出 scripts/.curated_content.json 后，
本脚本把条目按板块归类并拼装成一份可直接粘贴给 LLM 的提示词
（含写作要求，遵循 docs/CONTENT_PLAYBOOK.md）。

用法（在 scripts/ 目录下）:
    uv run python draft_prompt.py                          # 读取 .curated_content.json，输出到 stdout
    uv run python draft_prompt.py -o /tmp/prompt.md        # 写入文件
    uv run python draft_prompt.py --theme "AI 的边界"       # 指定本期主题
    uv run python draft_prompt.py -i 14                     # 指定期号（缺省自动推算）

依赖：仅 Python 标准库，无第三方包。
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CURATED = ROOT / "scripts" / ".curated_content.json"
ISSUES_DIR = ROOT / "docs" / "issues"

# 源分类 → 展示板块名；与 youth_weekly/core/expander.py 的 CATEGORY_TO_SECTION 保持一致。
# 未列出的分类直接使用原始 id 作为板块名。
CATEGORY_TO_SECTION: dict[str, str] = {
    "tech": "科技新势力",
    "dev": "好工具",
    "ai": "科技新势力",
    "research": "科技新势力",
    "oss": "好工具",
    "anime": "二次元次元壁",
    "gaming": "游戏研究所",
    "stories": "青春故事会",
    "tools": "好工具",
    "watching": "在看什么",
    "gallery": "一周图鉴",
    "jobs": "谁在招人",
}

WRITING_REQUIREMENTS = """成稿要求（严格遵循 docs/CONTENT_PLAYBOOK.md）：
1. 输出 Markdown，结构：## 刊首语 → 各板块（## 板块名 / ### 条目标题）→ ## 本周行动清单 → ## 本周金句。
2. 刊首语 150-300 字：围绕主题像朋友聊天，有观点、有温度，结尾抛出问题或邀请。
3. 每个板块选 2-4 条，每条 120-300 字，按「是什么 → 为什么重要/有趣 → 读者现在能做什么」展开，禁止只贴链接。
4. 行动清单 3 条：本周就能做的具体可执行事项；金句 1 句：有力量、可引用。
5. 简体中文、口语化但有信息密度；禁止空洞套话（赋能/风口/不可错过/总而言之）。
6. 标题要有信息量（如「XXX 实测：3 个新功能让重构快 1 倍」），不要「XXX 发布新版」。
7. 只使用下方提供的素材，不编造事实、链接、数字或日期；链接只保留素材中的原始 URL。"""


def _section_name(cat_id: str) -> str:
    """源分类 → 展示板块名（未知分类回落为原始 id）。"""
    return CATEGORY_TO_SECTION.get(cat_id, cat_id)


def _next_issue_number() -> int:
    """按 docs/issues/ 已有最大期号 +1 推算下一期（与 issue_generator 一致）。"""
    if not ISSUES_DIR.is_dir():
        return 1
    max_num = 0
    for child in ISSUES_DIR.iterdir():
        if child.is_dir() and child.name.isdigit():
            max_num = max(max_num, int(child.name))
    return max_num + 1


def _render_items(items: list[dict]) -> str:
    """渲染单个分类下的条目列表。"""
    lines: list[str] = []
    for idx, item in enumerate(items, start=1):
        title = item.get("title", "(无标题)").strip()
        url = item.get("url", "").strip()
        desc = (
            item.get("description", "").strip()
            or "（无摘要，请结合标题合理扩展，勿编造细节）"
        )
        source = item.get("source", "").strip()
        score = item.get("score")
        meta = source if source else ""
        if score is not None:
            meta = f"{meta} | 分数 {score}".lstrip(" | ")
        lines.append(f"{idx}. **{title}**" + (f"（{meta}）" if meta else ""))
        lines.append(f"   - 摘要：{desc}")
        if url:
            lines.append(f"   - 链接：{url}")
    return "\n".join(lines)


def build_prompt(curated: dict, issue_number: int, theme: str) -> str:
    """拼装整期初稿提示词。"""
    today = date.today().isoformat()
    sections: list[str] = []
    for cat_id, items in curated.items():
        if not items:
            continue
        section = _section_name(cat_id)
        sections.append(f"### {section}（来源分类：{cat_id}）\n")
        sections.append(_render_items(items))

    if not sections:
        sections.append(
            "（本期策展为空——请直接创作，或先运行 `make collect` 后再试。）\n"
        )

    theme_line = (
        theme.strip() or "（未指定，请从素材中提炼一个本周主题，并体现在刊首语里）"
    )

    return f"""# 青年周刊 · 第 {issue_number} 期 · 初稿提示词

你是《青年周刊》的主编，面向年轻人，正在撰写第 {issue_number} 期周刊。
风格参照《青年文摘》+《看天下》：温暖、有洞察、不说教。

## 本期信息
- 期号：第 {issue_number} 期
- 计划发布日期：{today}（以实际发布日为准）
- 本期主题：{theme_line}

## 素材（按板块归类的策展条目）

{chr(10).join(sections)}
## 写作要求

{WRITING_REQUIREMENTS}

请直接输出整期 Markdown 初稿。"""


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--curated",
        "-c",
        default=str(DEFAULT_CURATED),
        help=f"策展 JSON 路径（默认 {DEFAULT_CURATED.relative_to(ROOT)}）",
    )
    parser.add_argument("--output", "-o", help="输出文件路径（缺省输出到 stdout）")
    parser.add_argument("--theme", "-t", default="", help="本期主题（可选）")
    parser.add_argument(
        "--issue",
        "-i",
        type=int,
        default=0,
        help="期号（缺省按 docs/issues/ 自动推算下一期）",
    )
    args = parser.parse_args(argv)

    curated_path = Path(args.curated)
    if not curated_path.exists():
        print(
            f"错误：未找到策展文件 {curated_path}，请先运行 `make collect` 或 `uv run youth-weekly collect`。",
            file=sys.stderr,
        )
        return 1

    try:
        curated = json.loads(curated_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"错误：策展文件解析失败（{exc}），请检查 JSON 格式。", file=sys.stderr)
        return 1

    if not isinstance(curated, dict):
        print("错误：策展文件应为「分类 → 条目列表」的 JSON 对象。", file=sys.stderr)
        return 1

    issue_number = args.issue or _next_issue_number()
    prompt = build_prompt(curated, issue_number, args.theme)

    if args.output:
        out = Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(prompt, encoding="utf-8")
        print(f"✓ 已生成初稿提示词：{out}")
    else:
        print(prompt)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
