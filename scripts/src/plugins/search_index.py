#!/usr/bin/env python3
"""
搜索索引生成插件
✅ 符合 OCP 原则：新增插件不修改核心架构
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
from src.ocp import BasePlugin, register
from src import load_all_issues


@register()
class SearchIndexPlugin(BasePlugin):
    """生成搜索索引插件"""

    @property
    def name(self) -> str:
        return "search_index"

    @property
    def description(self) -> str:
        return "生成搜索索引 JSON 文件"

    def execute(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        执行搜索索引生成

        Args:
            params: 参数字典，支持：
                - docs_dir: 文档根目录
                - output_path: 输出文件路径

        Returns:
            生成的搜索索引数据
        """
        params = params or {}
        docs_dir = Path(params.get('docs_dir', ''))
        output_path = Path(params.get('output_path', ''))

        issues = load_all_issues(docs_dir, reverse=True)

        search_index = []
        for issue in issues:
            content = issue.get('content', '')
            excerpt_raw = content[:500].replace('#', '').strip()
            excerpt = excerpt_raw + '...' if len(content) > 500 else excerpt_raw

            search_index.append({
                'issue': issue.get('issue', int(issue['slug'])),
                'title': issue.get('title', ''),
                'date': issue.get('date', ''),
                'slug': issue['slug'],
                'excerpt': excerpt,
            })

        if output_path:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(search_index, f, ensure_ascii=False, indent=2)
            print(f"Generated search index: {output_path}")

        return {'search_index': search_index}
