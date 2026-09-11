"""内容源覆盖校验（回归防护）

确保每个展示板块都有启用的采集源。

历史问题：anime / gaming / stories / watching / gallery / jobs 六个板块
因为 content_sources.yaml 里没有任何对应 category 的源，导致每期周刊
这些板块都只能输出「本期该板块暂无精选内容」占位。

本测试在 CI 中拦截此类回归：
1. 每个展示板块（除 LLM 生成的「刊首语」外）至少有一个启用源；
2. 所有源使用的 category 都在 source_categories 中声明；
3. 所有 source_category 都能映射到某个展示板块。
"""

from __future__ import annotations

import yaml

from youth_weekly.core.config import get_categories, get_content_sources_path
from youth_weekly.core.expander import CATEGORY_TO_SECTION


def _load_sources() -> dict:
    with open(get_content_sources_path(), "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _enabled_sources(cfg: dict) -> list[dict]:
    return [s for s in cfg.get("sources", []) if s.get("enabled", True)]


def test_every_section_has_enabled_source() -> None:
    """每个展示板块（刊首语由 LLM 生成除外）都必须至少有一个启用源。"""
    cfg = _load_sources()
    covered: dict[str, int] = {}
    for source in _enabled_sources(cfg):
        mapped = CATEGORY_TO_SECTION.get(source.get("category", ""))
        if mapped:
            name = mapped[0]
            covered[name] = covered.get(name, 0) + 1

    missing = [
        c["name"]
        for c in get_categories()
        if c.get("id") != "editorial" and covered.get(c["name"], 0) == 0
    ]
    assert not missing, (
        f"以下板块没有任何启用采集源，每期都会是空的: {missing}。"
        "请在 scripts/content_sources.yaml 中补充对应 category 的源。"
    )


def test_source_categories_declared() -> None:
    """源实际使用的 category 必须在 source_categories 中声明。"""
    cfg = _load_sources()
    declared = set((cfg.get("source_categories") or {}).keys())
    used = {s.get("category") for s in _enabled_sources(cfg) if s.get("category")}
    undeclared = sorted(used - declared)
    assert not undeclared, (
        f"以下源分类未在 source_categories 声明: {undeclared}。"
        "请在 content_sources.yaml 补充 source_categories 条目。"
    )


def test_every_source_category_maps_to_a_section() -> None:
    """所有 source_category 都必须能映射到展示板块。"""
    cfg = _load_sources()
    declared = set((cfg.get("source_categories") or {}).keys())
    unknown = sorted(declared - set(CATEGORY_TO_SECTION.keys()))
    assert not unknown, (
        f"以下源分类没有板块映射: {unknown}。"
        "请在 youth_weekly/core/expander.py#CATEGORY_TO_SECTION 中补充映射。"
    )
