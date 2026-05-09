#!/usr/bin/env python3
"""
测试共享内容模块
"""
import pytest
import tempfile
import shutil
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from src import load_issue, load_all_issues, get_latest_issue, get_issue_count, safe_resolve_path


class TestLoadIssue:
    """测试 load_issue 函数"""

    def setup_method(self):
        """每个测试前创建临时目录"""
        self.temp_dir = tempfile.mkdtemp()
        self.docs_dir = Path(self.temp_dir) / "docs"
        self.docs_dir.mkdir()
        self.issues_dir = self.docs_dir / "issues"
        self.issues_dir.mkdir()

    def teardown_method(self):
        """每个测试后清理"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_load_valid_issue(self):
        """测试加载有效的周刊"""
        issue_dir = self.issues_dir / "001"
        issue_dir.mkdir()

        readme_content = """---
issue: 1
title: "测试周刊"
date: "2026-01-01"
published: true
description: "测试描述"
---

# 测试内容
"""
        (issue_dir / "README.md").write_text(readme_content, encoding='utf-8')

        result = load_issue(issue_dir)

        assert result is not None
        assert result['issue'] == 1
        assert result['title'] == '测试周刊'
        assert result['date'] in ('2026-01-01', '2026-1-1')
        assert result['published'] is True
        assert result['description'] == '测试描述'
        assert result['slug'] == '001'
        assert '测试内容' in result['content']

    def test_load_nonexistent_file(self):
        """测试加载不存在的文件"""
        issue_dir = self.issues_dir / "002"
        issue_dir.mkdir()

        result = load_issue(issue_dir)

        assert result is None

    def test_load_missing_readme(self):
        """测试目录中没有 README.md"""
        issue_dir = self.issues_dir / "003"
        issue_dir.mkdir()

        result = load_issue(issue_dir)

        assert result is None

    def test_load_invalid_frontmatter(self):
        """测试无效的 frontmatter"""
        issue_dir = self.issues_dir / "004"
        issue_dir.mkdir()

        readme_content = """# 没有 frontmatter
内容
"""
        (issue_dir / "README.md").write_text(readme_content, encoding='utf-8')

        result = load_issue(issue_dir)

        assert result is None

    def test_load_unpublished_issue(self):
        """测试加载未发布的周刊"""
        issue_dir = self.issues_dir / "005"
        issue_dir.mkdir()

        readme_content = """---
issue: 5
title: "未发布周刊"
date: 2026-01-01
published: false
---

内容
"""
        (issue_dir / "README.md").write_text(readme_content, encoding='utf-8')

        result = load_issue(issue_dir)

        assert result is not None
        assert result['published'] is False

    def test_load_directory_not_exists(self):
        """测试目录不存在"""
        result = load_issue(Path("/nonexistent/path"))

        assert result is None


class TestLoadAllIssues:
    """测试 load_all_issues 函数"""

    def setup_method(self):
        self.temp_dir = tempfile.mkdtemp()
        self.docs_dir = Path(self.temp_dir) / "docs"
        self.docs_dir.mkdir()
        self.issues_dir = self.docs_dir / "issues"
        self.issues_dir.mkdir()

    def teardown_method(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _create_issue(self, num: int, title: str, published: bool = True):
        """辅助方法：创建测试周刊"""
        issue_dir = self.issues_dir / str(num).zfill(3)
        issue_dir.mkdir()

        readme_content = f"""---
issue: {num}
title: "{title}"
date: "2026-01-{str(num).zfill(2)}"
published: {str(published).lower()}
---

内容 {num}
"""
        (issue_dir / "README.md").write_text(readme_content, encoding='utf-8')

    def test_load_multiple_issues(self):
        """测试加载多个周刊"""
        self._create_issue(1, "周刊1")
        self._create_issue(2, "周刊2")
        self._create_issue(3, "周刊3")

        result = load_all_issues(self.docs_dir)

        assert len(result) == 3

    def test_load_issues_reverse_order(self):
        """测试降序排列"""
        self._create_issue(1, "周刊1")
        self._create_issue(2, "周刊2")
        self._create_issue(3, "周刊3")

        result = load_all_issues(self.docs_dir, reverse=True)

        assert result[0]['issue'] == 3
        assert result[2]['issue'] == 1

    def test_load_issues_ascending_order(self):
        """测试升序排列"""
        self._create_issue(1, "周刊1")
        self._create_issue(2, "周刊2")
        self._create_issue(3, "周刊3")

        result = load_all_issues(self.docs_dir, reverse=False)

        assert result[0]['issue'] == 1
        assert result[2]['issue'] == 3

    def test_exclude_unpublished_by_default(self):
        """测试默认排除未发布内容"""
        self._create_issue(1, "周刊1", published=True)
        self._create_issue(2, "周刊2", published=False)
        self._create_issue(3, "周刊3", published=True)

        result = load_all_issues(self.docs_dir, include_unpublished=False)

        assert len(result) == 2
        assert all(issue['published'] for issue in result)

    def test_include_unpublished(self):
        """测试包含未发布内容"""
        self._create_issue(1, "周刊1", published=True)
        self._create_issue(2, "周刊2", published=False)
        self._create_issue(3, "周刊3", published=True)

        result = load_all_issues(self.docs_dir, include_unpublished=True)

        assert len(result) == 3

    def test_missing_issues_directory(self):
        """测试不存在的目录"""
        result = load_all_issues(Path("/nonexistent/docs"))

        assert result == []


class TestGetLatestIssue:
    """测试 get_latest_issue 函数"""

    def setup_method(self):
        self.temp_dir = tempfile.mkdtemp()
        self.docs_dir = Path(self.temp_dir) / "docs"
        self.docs_dir.mkdir()
        self.issues_dir = self.docs_dir / "issues"
        self.issues_dir.mkdir()

    def teardown_method(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_get_latest_issue(self):
        """测试获取最新周刊"""
        issue_dir = self.issues_dir / "001"
        issue_dir.mkdir()

        readme_content = """---
issue: 1
title: "最新周刊"
date: "2026-01-01"
published: true
---

内容
"""
        (issue_dir / "README.md").write_text(readme_content, encoding='utf-8')

        result = get_latest_issue(self.docs_dir)

        assert result is not None
        assert result['title'] == '最新周刊'

    def test_get_latest_no_issues(self):
        """测试没有周刊的情况"""
        result = get_latest_issue(self.docs_dir)

        assert result is None


class TestGetIssueCount:
    """测试 get_issue_count 函数"""

    def setup_method(self):
        self.temp_dir = tempfile.mkdtemp()
        self.docs_dir = Path(self.temp_dir) / "docs"
        self.docs_dir.mkdir()
        self.issues_dir = self.docs_dir / "issues"
        self.issues_dir.mkdir()

    def teardown_method(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _create_issue(self, num: int, published: bool = True):
        issue_dir = self.issues_dir / str(num).zfill(3)
        issue_dir.mkdir()

        readme_content = f"""---
issue: {num}
title: "周刊{num}"
date: "2026-01-{str(num).zfill(2)}"
published: {str(published).lower()}
---

内容
"""
        (issue_dir / "README.md").write_text(readme_content, encoding='utf-8')

    def test_count_published_issues(self):
        """测试统计已发布周刊数量"""
        self._create_issue(1, published=True)
        self._create_issue(2, published=False)
        self._create_issue(3, published=True)

        count = get_issue_count(self.docs_dir)

        assert count == 2


class TestSafeResolvePath:
    """测试 safe_resolve_path 函数"""

    def setup_method(self):
        self.temp_dir = tempfile.mkdtemp()
        self.base_dir = Path(self.temp_dir) / "base"
        self.base_dir.mkdir()

    def teardown_method(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_valid_path(self):
        """测试有效路径"""
        result = safe_resolve_path(self.base_dir, "subdir")

        assert result is not None
        assert str(result).startswith(str(self.base_dir))

    def test_path_traversal_attempt(self):
        """测试路径遍历攻击"""
        result = safe_resolve_path(self.base_dir, "../../etc/passwd")

        assert result is None

    def test_absolute_path_outside(self):
        """测试绝对路径在外部"""
        result = safe_resolve_path(self.base_dir, "/tmp/evil")

        assert result is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
