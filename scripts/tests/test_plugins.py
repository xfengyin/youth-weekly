#!/usr/bin/env python3
"""
业务插件测试
"""

import json
import sys
from pathlib import Path

import pytest

# 支持直接执行时找到 src 模块
_script_dir = Path(__file__).parent.parent
if str(_script_dir / "src") not in sys.path:
    sys.path.insert(0, str(_script_dir / "src"))


@pytest.fixture
def sample_docs_dir(tmp_path):
    """创建示例 docs 目录结构"""
    docs_dir = tmp_path / "docs"
    issues_dir = docs_dir / "issues"
    issues_dir.mkdir(parents=True)

    for i in [1, 2, 3]:
        issue_dir = issues_dir / f"00{i}"
        issue_dir.mkdir()
        (issue_dir / "README.md").write_text(
            f"""---
issue: {i}
title: "Test Issue {i}"
date: 2026-01-0{i}
description: "Description for issue {i}"
published: true
cover: "https://example.com/cover{i}.jpg"
---

# Content {i}

This is the content for issue {i}.
""",
            encoding="utf-8",
        )
    return docs_dir


class TestIssueIndexPlugin:
    """测试周刊索引插件"""

    def test_plugin_metadata(self):
        """测试插件元数据"""
        from youth_weekly.plugins.issue_index import IssueIndexPlugin

        plugin = IssueIndexPlugin()
        assert plugin.name == "issue_index"
        assert plugin.description != ""
        assert plugin.version != ""

    def test_execute_generates_index(self, sample_docs_dir, tmp_path):
        """测试执行生成索引"""
        from youth_weekly.plugins.issue_index import IssueIndexPlugin

        plugin = IssueIndexPlugin()
        output_path = tmp_path / "issues.json"

        result = plugin.execute(
            {"docs_dir": str(sample_docs_dir), "output_path": str(output_path)}
        )

        assert "issues" in result
        assert len(result["issues"]) == 3
        assert output_path.exists()

        # 验证文件内容
        with open(output_path) as f:
            data = json.load(f)
        assert len(data) == 3
        assert data[0]["title"] == "Test Issue 3"  # 倒序

    def test_execute_without_output(self, sample_docs_dir):
        """测试不输出到文件"""
        from youth_weekly.plugins.issue_index import IssueIndexPlugin

        plugin = IssueIndexPlugin()
        result = plugin.execute({"docs_dir": str(sample_docs_dir)})

        assert "issues" in result
        assert len(result["issues"]) == 3


class TestSearchIndexPlugin:
    """测试搜索索引插件"""

    def test_plugin_metadata(self):
        """测试插件元数据"""
        from youth_weekly.plugins.search_index import SearchIndexPlugin

        plugin = SearchIndexPlugin()
        assert plugin.name == "search_index"

    def test_execute_generates_search(self, sample_docs_dir, tmp_path):
        """测试执行生成搜索索引"""
        from youth_weekly.plugins.search_index import SearchIndexPlugin

        plugin = SearchIndexPlugin()
        output_path = tmp_path / "search.json"

        result = plugin.execute(
            {"docs_dir": str(sample_docs_dir), "output_path": str(output_path)}
        )

        assert "search_index" in result
        assert len(result["search_index"]) == 3
        assert output_path.exists()

        # 验证文件内容
        with open(output_path) as f:
            data = json.load(f)

        # 验证包含必要的字段
        for item in data:
            assert "title" in item
            assert "slug" in item
            assert "excerpt" in item


class TestStatsPlugin:
    """测试统计插件"""

    def test_plugin_metadata(self):
        """测试插件元数据"""
        from youth_weekly.plugins.stats import StatsPlugin

        plugin = StatsPlugin()
        assert plugin.name == "stats"

    def test_execute_generates_stats(self, sample_docs_dir, tmp_path):
        """测试执行生成统计"""
        from youth_weekly.plugins.stats import StatsPlugin

        plugin = StatsPlugin()
        output_path = tmp_path / "stats.json"

        result = plugin.execute(
            {"docs_dir": str(sample_docs_dir), "output_path": str(output_path)}
        )

        assert "stats" in result
        stats = result["stats"]
        assert stats["total_issues"] == 3
        assert "generated_at" in stats
        assert output_path.exists()

    def test_execute_empty_docs(self, tmp_path):
        """测试空目录"""
        from youth_weekly.plugins.stats import StatsPlugin

        docs_dir = tmp_path / "empty_docs"
        (docs_dir / "issues").mkdir(parents=True)

        plugin = StatsPlugin()
        result = plugin.execute({"docs_dir": str(docs_dir)})

        assert result["stats"]["total_issues"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
