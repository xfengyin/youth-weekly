#!/usr/bin/env python3
"""
T-B 管线重构测试:
- generate 默认白名单不执行 collect/issue
- generate 失败 / 插件缺失返回非 0
- 产物路由(search_data/issue_index/issue_json/site_data/rss/stats)与 manifest
- validate 对缺失 title/date/资产引用报错
- mtime 缓存对"删除最新一期"正确失效
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from unittest.mock import patch

from youth_weekly.cli import DEFAULT_STATIC_PLUGINS, main
from youth_weekly.core.content import clear_cache, load_all_issues
from youth_weekly.core.validation import validate_issues
from youth_weekly.plugin import Registry

# ---------------------------------------------------------------- helpers


def _make_issue(
    issues_dir: Path,
    slug: str,
    *,
    title: str = "测试周刊",
    date: str = "2026-01-01",
    published: bool = True,
    cover: str | None = None,
    body: str = "内容正文",
) -> Path:
    """创建一期周刊 README.md 并返回其路径"""
    issue_dir = issues_dir / slug
    issue_dir.mkdir(parents=True, exist_ok=True)
    fm_lines = ["---", f"issue: {int(slug)}", f'title: "{title}"', f"date: {date!r}"]
    if cover:
        fm_lines.append(f"cover: {cover!r}")
    fm_lines.append(f"published: {str(published).lower()}")
    fm_lines.append("---")
    readme = issue_dir / "README.md"
    readme.write_text("\n".join(fm_lines) + f"\n\n{body}\n", encoding="utf-8")
    return readme


def _make_docs(tmp_path: Path, slugs: list[str]) -> Path:
    """创建带若干期的 docs 目录"""
    docs = tmp_path / "docs"
    issues_dir = docs / "issues"
    issues_dir.mkdir(parents=True)
    for slug in slugs:
        _make_issue(issues_dir, slug)
    return docs


# ------------------------------------------------- CLI generate 白名单


class TestGenerateWhitelist:
    def test_default_whitelist_contains_only_static_plugins(self):
        """默认白名单必须是纯静态插件,绝不包含 collect/issue/example"""
        assert "collect" not in DEFAULT_STATIC_PLUGINS
        assert "issue" not in DEFAULT_STATIC_PLUGINS
        assert "example" not in DEFAULT_STATIC_PLUGINS
        assert "hello_world" not in DEFAULT_STATIC_PLUGINS
        assert "issue_index" in DEFAULT_STATIC_PLUGINS
        assert "issue_json" in DEFAULT_STATIC_PLUGINS
        assert "rss" in DEFAULT_STATIC_PLUGINS
        assert "search_index" in DEFAULT_STATIC_PLUGINS
        assert "site_data" in DEFAULT_STATIC_PLUGINS
        assert "stats" in DEFAULT_STATIC_PLUGINS

    def test_generate_default_does_not_execute_collect_or_issue(self, tmp_path):
        """generate 默认执行不得触发 collect/issue 的有副作用插件"""
        out = tmp_path / "out"
        with (
            patch("youth_weekly.plugins.collect.CollectPlugin.execute") as mock_c,
            patch("youth_weekly.plugins.issue.IssuePlugin.execute") as mock_i,
        ):
            rc = main(["generate", "--output", str(out)])
        assert rc == 0
        mock_c.assert_not_called()
        mock_i.assert_not_called()

    def test_explicit_plugins_can_override_whitelist(self, tmp_path):
        """显式传插件名可覆盖白名单(包含 collect/issue 等)"""
        with patch("youth_weekly.plugins.collect.CollectPlugin.execute") as mock_c:
            mock_c.return_value = {"collected": 0, "curated": 0}
            rc = main(["generate", "--output", str(tmp_path / "out"), "collect"])
        assert rc == 0
        mock_c.assert_called_once()


class TestGenerateFailureSemantics:
    def test_generate_returns_nonzero_when_plugin_fails(self, tmp_path):
        """任一插件失败时 generate 必须返回非 0"""
        out = tmp_path / "out"
        with patch(
            "youth_weekly.plugins.search_index.SearchIndexPlugin.execute",
            side_effect=RuntimeError("boom"),
        ):
            rc = main(["generate", "--output", str(out)])
        assert rc != 0

    def test_generate_returns_nonzero_when_plugin_not_found(self, tmp_path):
        """白名单插件缺失时 generate 必须返回非 0"""
        out = tmp_path / "out"
        real_get = Registry.get

        def fake_get(name: str):
            if name == "stats":
                return None
            return real_get(name)

        with patch.object(Registry, "get", side_effect=fake_get):
            rc = main(["generate", "--output", str(out)])
        assert rc != 0


# ------------------------------------------------- 产物路由与 manifest


class TestArtifactRouting:
    def test_search_index_routed_to_web_public(self, tmp_path):
        out = tmp_path / "out"
        rc = main(["generate", "--output", str(out), "search_index"])
        assert rc == 0
        target = out / "web" / "public" / "search-data.json"
        assert target.is_file()
        data = json.loads(target.read_text(encoding="utf-8"))
        assert isinstance(data, list)

    def test_issue_index_routed_to_web_public(self, tmp_path):
        out = tmp_path / "out"
        rc = main(["generate", "--output", str(out), "issue_index"])
        assert rc == 0
        target = out / "web" / "public" / "issue_index.json"
        assert target.is_file()
        data = json.loads(target.read_text(encoding="utf-8"))
        assert all("slug" in item for item in data)

    def test_rss_routed_to_scripts_dist(self, tmp_path):
        out = tmp_path / "out"
        rc = main(["generate", "--output", str(out), "rss"])
        assert rc == 0
        target = out / "scripts" / "dist" / "rss.xml"
        assert target.is_file()
        assert (
            "<?xml" in target.read_text(encoding="utf-8")
            or "rss" in target.read_text(encoding="utf-8").lower()
        )

    def test_stats_and_site_data_routed(self, tmp_path):
        out = tmp_path / "out"
        rc = main(["generate", "--output", str(out), "stats", "site_data"])
        assert rc == 0
        assert (out / "scripts" / "dist" / "stats.json").is_file()
        site = json.loads(
            (out / "web" / "public" / "site-data.json").read_text(encoding="utf-8")
        )
        assert "site" in site
        assert "categories" in site
        assert "author" in site
        assert "build" in site

    def test_issue_json_per_issue_files(self, tmp_path):
        """每期独立 JSON:web/public/issue-<slug>.json 含全部字段"""
        docs = _make_docs(tmp_path, ["001", "002"])
        out = tmp_path / "out"
        from youth_weekly.plugins.issue_json import IssueJsonPlugin

        plugin = IssueJsonPlugin()
        result = plugin.execute({"docs_dir": str(docs), "output_dir": str(out)})
        assert result["count"] == 2
        issue_file = out / "web" / "public" / "issue-001.json"
        assert issue_file.is_file()
        data = json.loads(issue_file.read_text(encoding="utf-8"))
        for field in (
            "issue",
            "title",
            "date",
            "description",
            "content",
            "published",
            "cover",
            "slug",
        ):
            assert field in data
        # output_files 应报告相对 output_dir 的路径,便于 manifest 登记
        assert "web/public/issue-001.json" in result["output_files"]

    def test_generate_default_writes_manifest_with_sha256(self, tmp_path):
        """默认 generate 产出 artifacts-manifest.json,包含 size 与 sha256"""
        out = tmp_path / "out"
        rc = main(["generate", "--output", str(out)])
        assert rc == 0
        manifest_path = out / "scripts" / "dist" / "artifacts-manifest.json"
        assert manifest_path.is_file()
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        assert "generated_at" in manifest
        assert "plugins" in manifest
        assert len(manifest["artifacts"]) > 0
        for entry in manifest["artifacts"]:
            assert entry["size"] > 0
            assert len(entry["sha256"]) == 64


# ------------------------------------------------- validate 命令


class TestValidate:
    def test_validate_ok_returns_zero(self, tmp_path):
        docs = _make_docs(tmp_path, ["001", "002"])
        rc = main(["validate", "--docs-dir", str(docs)])
        assert rc == 0

    def test_validate_reports_missing_title(self, tmp_path):
        docs = tmp_path / "docs"
        issues_dir = docs / "issues"
        issues_dir.mkdir(parents=True)
        _make_issue(issues_dir, "001", title="")
        rc = main(["validate", "--docs-dir", str(docs)])
        assert rc == 1

    def test_validate_reports_bad_date(self, tmp_path):
        docs = tmp_path / "docs"
        issues_dir = docs / "issues"
        issues_dir.mkdir(parents=True)
        _make_issue(issues_dir, "001", date="2026/01/01")
        rc = main(["validate", "--docs-dir", str(docs)])
        assert rc == 1

    def test_validate_reports_missing_cover(self, tmp_path):
        docs = tmp_path / "docs"
        issues_dir = docs / "issues"
        issues_dir.mkdir(parents=True)
        _make_issue(issues_dir, "001", cover="./assets/cover.png")
        rc = main(["validate", "--docs-dir", str(docs)])
        assert rc == 1

    def test_validate_passes_with_existing_cover(self, tmp_path):
        docs = tmp_path / "docs"
        issues_dir = docs / "issues"
        issues_dir.mkdir(parents=True)
        readme = _make_issue(issues_dir, "001", cover="./assets/cover.png")
        (readme.parent / "assets").mkdir(exist_ok=True)
        (readme.parent / "assets" / "cover.png").write_bytes(b"PNG")
        rc = main(["validate", "--docs-dir", str(docs)])
        assert rc == 0

    def test_validate_aggregates_multiple_errors(self, tmp_path):
        docs = tmp_path / "docs"
        issues_dir = docs / "issues"
        issues_dir.mkdir(parents=True)
        _make_issue(issues_dir, "001", title="", date="bad-date")
        _make_issue(issues_dir, "002")
        issues = load_all_issues(docs, reverse=False, include_unpublished=True)
        errors = validate_issues(issues, docs)
        assert any("title" in e for e in errors)
        assert any("date" in e for e in errors)


# ------------------------------------------------- 内容缓存修复


class TestCacheDeletionInvalidation:
    def test_deleting_newest_issue_invalidates_cache(self, tmp_path):
        """删除最新一期后,不调用 clear_cache 也应看到删除结果"""
        clear_cache()
        docs = _make_docs(tmp_path, ["001"])
        first = load_all_issues(docs)
        assert len(first) == 1

        # 新增一期 -> 自动失效
        _make_issue(docs / "issues", "002")
        assert len(load_all_issues(docs)) == 2

        # 删除最新一期(002)-> 自动失效
        shutil.rmtree(docs / "issues" / "002")
        after = load_all_issues(docs)
        assert len(after) == 1
        assert after[0]["slug"] == "001"
        clear_cache()
