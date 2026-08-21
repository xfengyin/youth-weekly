#!/usr/bin/env python3
"""
站点元数据 JSON 生成插件

产出 web/public/site-data.json:categories / site / author / build 信息(从 config.yaml 读取),
供小程序/前端静态消费。
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from youth_weekly.core.config import ROOT_DIR, get_config
from youth_weekly.plugin import BasePlugin, register

logger = logging.getLogger(__name__)


@register()
class SiteDataPlugin(BasePlugin):
    """生成站点元数据 JSON(web/public/site-data.json)"""

    name: str = "site_data"
    version: str = "1.0.0"
    description: str = "生成站点元数据 JSON 文件(web/public/site-data.json)"

    # 产物路由:站点元数据输出到 web/public/site-data.json
    outputs: dict[str, str] = {"site_data": "web/public/site-data.json"}

    def execute(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        执行站点元数据生成

        Args:
            params: 参数字典,支持:
                - output_path: 输出文件路径(默认 ROOT_DIR/web/public/site-data.json)

        Returns:
            生成的站点元数据
        """
        params = params or {}
        output_path = Path(
            params.get(
                "output_path", str(ROOT_DIR / "web" / "public" / "site-data.json")
            )
        )

        config = get_config()
        site_data: dict[str, Any] = {
            "site": config.site.model_dump(),
            "author": config.author.model_dump(),
            "categories": [c.model_dump() for c in config.categories],
            "build": config.build.model_dump(),
        }

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(site_data, f, ensure_ascii=False, indent=2, default=str)
        logger.info("Generated site data: %s", output_path)

        return {"site_data": site_data}


__all__ = ["SiteDataPlugin"]
