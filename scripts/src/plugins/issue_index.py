#!/usr/bin/env python3
"""
周刊索引生成插件
✅ 符合 OCP 原则：新增插件不修改核心架构
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from src.ocp import BasePlugin, register
from src import load_all_issues
from src.utils import safe_int

logger = logging.getLogger(__name__)


@register()
class IssueIndexPlugin(BasePlugin):
    """生成周刊索引 JSON 插件"""

    @property
    def name(self) -> str:
        return "issue_index"

    @property
    def description(self) -> str:
        return "生成周刊索引 JSON 文件"

    def execute(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        执行周刊索引生成

        Args:
            params: 参数字典，支持：
                - docs_dir: 文档根目录
                - output_path: 输出文件路径

        Returns:
            生成的周刊数据
        """
        params = params or {}
        docs_dir = Path(params.get('docs_dir', ''))
        output_path = Path(params.get('output_path', ''))

        issues = params.get('issues') or load_all_issues(docs_dir, reverse=True)

        issues_data = [
            {
                'issue': issue.get('issue', safe_int(issue['slug'])),
                'title': issue.get('title', f"第{issue['slug']}期"),
                'date': issue.get('date', ''),
                'description': issue.get('description', ''),
                'slug': issue['slug'],
                'cover': issue.get('cover', ''),
            }
            for issue in issues
        ]

        if output_path:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(issues_data, f, ensure_ascii=False, indent=2)
            logger.info("Generated issues index: %s", output_path)

        return {'issues': issues_data}
