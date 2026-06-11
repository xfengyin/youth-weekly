#!/usr/bin/env python3
"""
统计数据生成插件
✅ 符合 OCP 原则：新增插件不修改核心架构
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
from src.ocp import BasePlugin, register
from src import load_all_issues, get_issue_count

logger = logging.getLogger(__name__)


@register()
class StatsPlugin(BasePlugin):
    """生成统计数据插件"""

    @property
    def name(self) -> str:
        return "stats"

    @property
    def description(self) -> str:
        return "生成统计数据 JSON 文件"

    def execute(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        执行统计数据生成

        Args:
            params: 参数字典，支持：
                - docs_dir: 文档根目录
                - output_path: 输出文件路径

        Returns:
            生成的统计数据
        """
        params = params or {}
        docs_dir = Path(params.get('docs_dir', ''))
        output_path = Path(params.get('output_path', ''))

        issues = load_all_issues(docs_dir, reverse=True)
        dates = [issue.get('date', '') for issue in issues if issue.get('date')]

        stats = {
            'total_issues': get_issue_count(docs_dir),
            'first_issue_date': min(dates) if dates else None,
            'last_issue_date': max(dates) if dates else None,
            'generated_at': datetime.now().isoformat(),
        }

        if output_path:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(stats, f, ensure_ascii=False, indent=2)
            logger.info("Generated stats: %s", output_path)

        return {'stats': stats}
