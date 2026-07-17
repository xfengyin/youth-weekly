"""测试 CLI 命令"""

import logging

import pytest

from youth_weekly.cli import main
from youth_weekly.plugins import collect, issue, rss  # noqa: F401


@pytest.fixture(autouse=True)
def _reset_logger():
    """每个测试前重置 youth_weekly logger 的 handlers，
    确保 setup_logger 重新创建 handler 绑定当前 stdout"""
    # 清理所有 youth_weekly 子 logger 的 handlers
    for name in list(logging.Logger.manager.loggerDict.keys()):
        if name.startswith("youth_weekly"):
            logger = logging.getLogger(name)
            for handler in list(logger.handlers):
                logger.removeHandler(handler)
    yield


class TestCLI:
    """测试 CLI 命令"""

    def test_list_command(self):
        """测试 list 命令 - 验证返回码"""
        result = main(["list"])
        assert result == 0

    def test_config_command(self):
        """测试 config 命令 - 验证返回码"""
        result = main(["config"])
        assert result == 0

    def test_generate_command(self, tmp_path):
        """测试 generate 命令 - 验证输出目录创建"""
        docs_dir = tmp_path / "docs"
        docs_dir.mkdir()
        output_dir = tmp_path / "output"

        result = main(["generate", "--output", str(output_dir), "example"])

        assert result == 0
        assert output_dir.exists()

    def test_rss_command(self, tmp_path):
        """测试 rss 命令 - 验证 RSS 文件生成"""
        docs_dir = tmp_path / "docs"
        issues_dir = docs_dir / "issues"
        issues_dir.mkdir(parents=True)

        issue_dir = issues_dir / "001"
        issue_dir.mkdir()
        readme = issue_dir / "README.md"
        readme.write_text(
            "---\n" "title: Test Issue\n" "date: 2024-01-01\n" "---\n" "Content"
        )

        output_path = tmp_path / "rss.xml"

        result = main(
            [
                "rss",
                "--docs-dir",
                str(docs_dir),
                "--output",
                str(output_path),
            ]
        )

        assert result == 0
        assert output_path.exists()
        content = output_path.read_text(encoding="utf-8")
        assert "rss" in content.lower()

    def test_collect_command_no_sources(self, tmp_path):
        """测试 collect 命令（无内容源） - 验证输出文件生成"""
        sources_path = tmp_path / "sources.yaml"
        output_path = tmp_path / "curated.json"

        result = main(
            [
                "collect",
                "--sources",
                str(sources_path),
                "--output",
                str(output_path),
            ]
        )

        assert result == 0

    def test_issue_command_no_curated(self, tmp_path):
        """测试 issue 命令（无策展内容） - 应返回错误"""
        curated_path = tmp_path / "curated.json"
        issues_dir = tmp_path / "issues"

        result = main(
            [
                "issue",
                "--curated",
                str(curated_path),
                "--issues-dir",
                str(issues_dir),
            ]
        )

        # 文件不存在应返回 1
        assert result == 1

    def test_invalid_command(self):
        """测试无效命令"""
        with pytest.raises(SystemExit):
            main(["invalid_command"])

    def test_help_command(self, capsys):
        """测试 help 命令 - argparse 直接输出到 stdout"""
        with pytest.raises(SystemExit) as exc_info:
            main(["--help"])
        assert exc_info.value.code == 0

        captured = capsys.readouterr()
        assert "youth-weekly" in captured.out
        assert "generate" in captured.out
        assert "list" in captured.out
        assert "config" in captured.out
