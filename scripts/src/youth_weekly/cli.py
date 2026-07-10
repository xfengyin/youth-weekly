#!/usr/bin/env python3
"""
青年周刊 CLI 主入口
==================

使用 Typer(可选) 或 argparse 提供命令行能力
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path
from typing import NoReturn

from youth_weekly.core.config import (
    get_docs_dir,
    get_exclude_plugins,
    get_output_dir,
    load_config,
)
from youth_weekly.core.content import load_all_issues
from youth_weekly.core.logger import get_logger, setup_logger
from youth_weekly.plugin import Registry
from youth_weekly.plugins import (  # noqa: F401
    example,
    issue_index,
    search_index,
    stats,
    rss,
    collect,
    issue,
)


def cmd_generate(args: argparse.Namespace) -> int:
    """执行所有(或指定)插件生成静态文件"""
    logger = get_logger("youth_weekly.cli")
    plugins: list[str] = args.plugins if args.plugins else Registry.list_names()
    exclude = get_exclude_plugins()
    docs_dir = get_docs_dir()
    output_dir = Path(args.output) if args.output else get_output_dir()
    output_dir.mkdir(parents=True, exist_ok=True)

    issues = load_all_issues(docs_dir, reverse=True)
    # 汇总各插件成功/失败状态,单个插件异常不影响其他插件执行
    results: dict[str, dict[str, object]] = {}
    for name in plugins:
        if name in exclude:
            logger.info("Skipping excluded plugin: %s", name)
            continue
        if Registry.get(name) is None:
            logger.warning("Plugin not found: %s", name)
            results[name] = {"status": "not_found"}
            continue

        params = {
            "docs_dir": docs_dir,
            "output_path": output_dir / f"{name}.json",
            "issues": issues,
        }
        # 复用 Registry.execute_plugin 的异常包装与日志
        try:
            result = Registry.execute_plugin(name, params)
            results[name] = {"status": "success", "result": result}
        except Exception as exc:
            # execute_plugin 已记录 error 日志(含堆栈),此处仅汇总状态
            results[name] = {"status": "failed", "error": str(exc)}

    succeeded = sum(1 for r in results.values() if r.get("status") == "success")
    failed = sum(1 for r in results.values() if r.get("status") == "failed")
    logger.info(
        "Plugins summary: %d succeeded, %d failed (%d total)",
        succeeded,
        failed,
        len(results),
    )
    return 0


def cmd_list(args: argparse.Namespace) -> int:
    """列出所有已注册插件"""
    logger = get_logger("youth_weekly.cli")
    logger.info("Available plugins:")
    for name in Registry.list_names():
        meta = Registry.get(name)
        desc = meta.description if meta else "No description"
        logger.info("  - %s: %s", name, desc)
    return 0


def cmd_config(args: argparse.Namespace) -> int:
    """打印当前配置"""
    logger = get_logger("youth_weekly.cli")
    cfg = load_config()
    logger.info("Site: %s (%s)", cfg.site.name, cfg.site.url)
    logger.info("Docs: %s", cfg.paths.docs)
    logger.info("Output: %s", cfg.paths.output)
    logger.info("Excluded plugins: %s", cfg.ocp.exclude_plugins)
    return 0


def cmd_collect(args: argparse.Namespace) -> int:
    """执行内容采集"""
    logger = get_logger("youth_weekly.cli")
    plugin = Registry.get("collect")
    if plugin is None:
        logger.error("Collect plugin not found")
        return 1

    params = {}
    if args.sources:
        params["sources_path"] = args.sources
    if args.output:
        params["output_path"] = args.output

    result = plugin.execute(params)
    logger.info(
        "Collected %d items, curated %d items",
        result.get("collected", 0),
        result.get("curated", 0),
    )
    return 0


def cmd_issue(args: argparse.Namespace) -> int:
    """生成新一期周刊"""
    logger = get_logger("youth_weekly.cli")
    plugin = Registry.get("issue")
    if plugin is None:
        logger.error("Issue plugin not found")
        return 1

    params = {}
    if args.curated:
        params["curated_path"] = args.curated
    if args.issues_dir:
        params["issues_dir"] = args.issues_dir

    result = plugin.execute(params)
    if result.get("success"):
        logger.info("Issue generated: %s", result.get("issue_dir"))
        return 0
    else:
        logger.error("Failed to generate issue: %s", result.get("error"))
        return 1


def cmd_rss(args: argparse.Namespace) -> int:
    """生成 RSS feed"""
    logger = get_logger("youth_weekly.cli")
    plugin = Registry.get("rss")
    if plugin is None:
        logger.error("RSS plugin not found")
        return 1

    params = {}
    if args.docs_dir:
        params["docs_dir"] = args.docs_dir
    if args.output:
        params["output_path"] = args.output

    result = plugin.execute(params)
    logger.info(
        "RSS generated: %s (%d entries)",
        result.get("rss_path"),
        result.get("entry_count", 0),
    )
    return 0


def build_parser() -> argparse.ArgumentParser:
    """构建 CLI 参数解析器"""
    parser = argparse.ArgumentParser(
        prog="youth-weekly",
        description="青年周刊内容生成与发布工具集",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # generate 命令
    p_generate = sub.add_parser("generate", help="执行 OCP 插件生成静态文件")
    p_generate.add_argument("--output", "-o", help="输出目录")
    p_generate.add_argument("plugins", nargs="*", help="指定插件名(默认全部)")
    p_generate.set_defaults(func=cmd_generate)

    # list 命令
    p_list = sub.add_parser("list", help="列出所有已注册插件")
    p_list.set_defaults(func=cmd_list)

    # config 命令
    p_config = sub.add_parser("config", help="查看当前配置")
    p_config.set_defaults(func=cmd_config)

    # collect 命令
    p_collect = sub.add_parser("collect", help="执行内容采集")
    p_collect.add_argument("--sources", "-s", help="内容源配置文件路径")
    p_collect.add_argument("--output", "-o", help="输出文件路径")
    p_collect.set_defaults(func=cmd_collect)

    # issue 命令
    p_issue = sub.add_parser("issue", help="生成新一期周刊")
    p_issue.add_argument("--curated", "-c", help="策展内容文件路径")
    p_issue.add_argument("--issues-dir", "-d", help="周刊输出目录")
    p_issue.set_defaults(func=cmd_issue)

    # rss 命令
    p_rss = sub.add_parser("rss", help="生成 RSS feed")
    p_rss.add_argument("--docs-dir", "-d", help="文档根目录")
    p_rss.add_argument("--output", "-o", help="输出文件路径")
    p_rss.set_defaults(func=cmd_rss)

    # 日志级别参数
    p_log = parser.add_argument_group("logging")
    p_log.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="日志级别",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """CLI 主入口"""
    parser = build_parser()
    args = parser.parse_args(argv)
    setup_logger("youth_weekly", level=getattr(logging, args.log_level))

    return int(args.func(args)) if hasattr(args, "func") else 0


def cli() -> NoReturn:
    """Console-script 入口(无返回值,直接退出)"""
    sys.exit(main())


if __name__ == "__main__":
    cli()
