"""测试新插件：RSS、Collect、Issue"""

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

from youth_weekly.plugin import Registry
from youth_weekly.plugins import collect, issue, rss  # noqa: F401


class TestRssPlugin:
    """测试 RSS 插件"""

    def test_plugin_registered(self):
        """测试插件已注册"""
        assert Registry.exists("rss")

    def test_plugin_metadata(self):
        """测试插件元数据"""
        plugin = Registry.get("rss")
        assert plugin is not None
        assert plugin.name == "rss"
        assert plugin.version == "1.0.0"
        assert "RSS" in plugin.description

    def test_execute_generates_rss(self, tmp_path):
        """测试生成 RSS"""
        # 创建测试文档
        docs_dir = tmp_path / "docs"
        issues_dir = docs_dir / "issues"
        issues_dir.mkdir(parents=True)

        issue_dir = issues_dir / "001"
        issue_dir.mkdir()
        readme = issue_dir / "README.md"
        readme.write_text(
            "---\n"
            "title: Test Issue\n"
            "date: 2024-01-01\n"
            "description: Test description\n"
            "---\n"
            "Content here"
        )

        output_path = tmp_path / "rss.xml"

        plugin = Registry.get("rss")
        assert plugin is not None
        result = plugin.execute({"docs_dir": docs_dir, "output_path": output_path})

        assert result["rss_path"] == str(output_path)
        assert result["entry_count"] == 1
        assert output_path.exists()

        # 验证 XML 内容
        content = output_path.read_text()
        assert "Test Issue" in content
        # 日期可能是 ISO 格式或其他格式
        assert "Test Issue" in content

    def test_execute_empty_docs(self, tmp_path):
        """测试空文档目录"""
        docs_dir = tmp_path / "docs"
        docs_dir.mkdir()
        output_path = tmp_path / "rss.xml"

        plugin = Registry.get("rss")
        assert plugin is not None
        result = plugin.execute({"docs_dir": docs_dir, "output_path": output_path})

        assert result["entry_count"] == 0
        assert output_path.exists()


class TestCollectPlugin:
    """测试内容采集插件"""

    def test_plugin_registered(self):
        """测试插件已注册"""
        assert Registry.exists("collect")

    def test_plugin_metadata(self):
        """测试插件元数据"""
        plugin = Registry.get("collect")
        assert plugin is not None
        assert plugin.name == "collect"
        assert plugin.version == "1.0.0"
        assert "采集" in plugin.description

    def test_execute_no_sources(self, tmp_path):
        """测试无内容源配置"""
        sources_path = tmp_path / "sources.yaml"
        output_path = tmp_path / "curated.json"

        plugin = Registry.get("collect")
        assert plugin is not None
        result = plugin.execute(
            {"sources_path": sources_path, "output_path": output_path}
        )

        assert result["collected"] == 0
        assert result["curated"] == 0

    def test_execute_with_mock_collector(self, tmp_path):
        """测试带模拟采集器"""
        # 创建内容源配置
        sources_path = tmp_path / "sources.yaml"
        sources_path.write_text(
            "sources:\n"
            "  - name: Test Source\n"
            "    type: rss\n"
            "    url: http://example.com/feed\n"
            "    enabled: true\n"
            "    max_items: 5\n"
            "categories:\n"
            "  tech:\n"
            "    max_items: 3\n"
            "dedup:\n"
            "  enabled: false\n"
        )

        output_path = tmp_path / "curated.json"

        # Mock 采集器
        mock_item = MagicMock()
        mock_item.title = "Test Article"
        mock_item.url = "http://example.com/article"
        mock_item.description = "Test description"
        mock_item.source = "Test Source"
        mock_item.category = "tech"
        mock_item.score = 100

        with patch("youth_weekly.plugins.collect.get_collector") as mock_get_collector:
            mock_collector = MagicMock()
            mock_collector.collect.return_value = [mock_item]
            mock_get_collector.return_value = mock_collector

            plugin = Registry.get("collect")
            assert plugin is not None
            result = plugin.execute(
                {"sources_path": sources_path, "output_path": output_path}
            )

            assert result["collected"] == 1
            assert result["curated"] == 1
            assert output_path.exists()

            # 验证输出内容
            with open(output_path) as f:
                data = json.load(f)
            assert "tech" in data
            assert len(data["tech"]) == 1
            assert data["tech"][0]["title"] == "Test Article"


class TestIssuePlugin:
    """测试周刊生成插件"""

    def test_plugin_registered(self):
        """测试插件已注册"""
        assert Registry.exists("issue")

    def test_plugin_metadata(self):
        """测试插件元数据"""
        plugin = Registry.get("issue")
        assert plugin is not None
        assert plugin.name == "issue"
        assert plugin.version == "1.0.0"
        assert "周刊" in plugin.description

    def test_execute_no_curated(self, tmp_path):
        """测试无策展内容"""
        curated_path = tmp_path / "curated.json"
        issues_dir = tmp_path / "issues"

        plugin = Registry.get("issue")
        assert plugin is not None
        result = plugin.execute(
            {"curated_path": curated_path, "issues_dir": issues_dir}
        )

        assert result["success"] is False
        assert "not found" in result["error"]

    def test_execute_with_curated(self, tmp_path):
        """测试带策展内容"""
        # 创建策展内容
        curated_path = tmp_path / "curated.json"
        curated_data = {
            "tech": [
                {
                    "title": "Test Article",
                    "url": "http://example.com/article",
                    "description": "Test description",
                    "source": "Test Source",
                    "score": 100,
                }
            ]
        }
        with open(curated_path, "w") as f:
            json.dump(curated_data, f)

        issues_dir = tmp_path / "issues"

        plugin = Registry.get("issue")
        assert plugin is not None
        result = plugin.execute(
            {"curated_path": curated_path, "issues_dir": issues_dir}
        )

        assert result["success"] is True
        assert "issue_dir" in result
        assert Path(result["issue_dir"]).exists()

        # 验证生成的周刊
        issue_dir = Path(result["issue_dir"])
        readme = issue_dir / "README.md"
        assert readme.exists()

        content = readme.read_text()
        assert "Test Article" in content
