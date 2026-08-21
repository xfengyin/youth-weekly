#!/usr/bin/env python3
"""
青年周刊 CLI 主入口
==================

使用 Typer(可选) 或 argparse 提供命令行能力
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, NoReturn

from youth_weekly.core.config import (
    ROOT_DIR,
    get_docs_dir,
    get_exclude_plugins,
    load_config,
)
from youth_weekly.core.content import clear_cache, load_all_issues
from youth_weekly.core.logger import get_logger, setup_logger
from youth_weekly.core.validation import validate_issues
from youth_weekly.plugin import Registry
from youth_weekly.plugins import (  # noqa: F401
    collect,
    example,
    issue,
    issue_index,
    issue_json,
    rss,
    search_index,
    site_data,
    stats,
)

# generate 默认白名单:纯静态、无网络/有状态副作用的插件。
# 默认部署路径(不传插件名)绝不触发 collect(网络爬取)/issue(新建期刊)等
# 有副作用插件;如需执行它们,请显式传参:youth-weekly generate collect issue。
DEFAULT_STATIC_PLUGINS: list[str] = [
    "issue_index",
    "issue_json",
    "rss",
    "search_index",
    "site_data",
    "stats",
]


def _sha256_file(path: Path) -> str:
    """计算文件 SHA-256(分块读取,避免大文件占用内存)"""
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(64 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _display_path(path: Path) -> str:
    """产物路径展示:仓库内显示相对 ROOT_DIR 路径,否则显示绝对路径"""
    try:
        return str(path.resolve().relative_to(ROOT_DIR.resolve()))
    except ValueError:
        return str(path)


def _collect_manifest_entries(
    name: str,
    output_root: Path,
    declared_outputs: dict[str, str],
    result: dict[str, Any] | None,
) -> list[dict[str, object]]:
    """
    汇总某插件的产物清单条目:
    - 静态声明的 outputs(相对 output_root 解析)
    - 动态产物 result["output_files"](相对 output_root 或绝对路径)

    仅登记实际存在的文件,并附带 size 与 sha256。
    """
    entries: list[dict[str, object]] = []
    for label, rel_path in declared_outputs.items():
        target = output_root / rel_path
        if target.is_file():
            entries.append(
                {
                    "label": f"{name}:{label}",
                    "plugin": name,
                    "path": _display_path(target),
                    "size": target.stat().st_size,
                    "sha256": _sha256_file(target),
                }
            )
    if result:
        for rel in result.get("output_files") or []:
            p = Path(rel)
            target = p if p.is_absolute() else output_root / p
            if target.is_file():
                entries.append(
                    {
                        "label": f"{name}:dynamic",
                        "plugin": name,
                        "path": _display_path(target),
                        "size": target.stat().st_size,
                        "sha256": _sha256_file(target),
                    }
                )
    return entries


def cmd_generate(args: argparse.Namespace) -> int:
    """
    执行插件生成静态文件(默认纯静态白名单)。

    产物路由:按插件声明的 outputs 元数据把产物写到正确位置
    (search_data -> web/public/search-data.json 等),并汇总到
    scripts/dist/artifacts-manifest.json。任一插件失败或不存在
    都会使命令返回非 0,供 CI/定时任务感知失败。
    """
    logger = get_logger("youth_weekly.cli")
    plugins: list[str] = args.plugins if args.plugins else list(DEFAULT_STATIC_PLUGINS)
    exclude = get_exclude_plugins()
    docs_dir = get_docs_dir()
    # --output 作为"产物根目录"覆盖(默认仓库根 ROOT_DIR);部署路径不使用该参数
    output_root = Path(args.output).resolve() if args.output else ROOT_DIR
    output_root.mkdir(parents=True, exist_ok=True)

    issues = load_all_issues(docs_dir, reverse=True)
    # 汇总各插件成功/失败状态,单个插件异常不影响其他插件执行,
    # 但任一失败/缺失都会使整体退出码非 0
    results: dict[str, dict[str, object]] = {}
    manifest_entries: list[dict[str, object]] = []
    exit_code = 0

    for name in plugins:
        if name in exclude:
            logger.info("Skipping excluded plugin: %s", name)
            continue

        plugin = Registry.get(name)
        if plugin is None:
            logger.warning("Plugin not found: %s", name)
            results[name] = {"status": "not_found"}
            exit_code = 1
            continue

        params: dict[str, Any] = {
            "docs_dir": str(docs_dir),
            "issues": issues,
            "output_dir": str(output_root),
        }
        # 按插件 outputs 声明路由单个主产物到正确位置
        declared_outputs = dict(plugin.outputs)
        if len(declared_outputs) == 1:
            ((_, rel_path),) = declared_outputs.items()
            params["output_path"] = str(output_root / rel_path)

        try:
            result = Registry.execute_plugin(name, params)
            results[name] = {"status": "success"}
        except Exception as exc:
            # execute_plugin 已记录 error 日志(含堆栈),此处仅汇总状态
            results[name] = {"status": "failed", "error": str(exc)}
            logger.error("Plugin %s failed: %s", name, exc)
            exit_code = 1
            continue

        manifest_entries.extend(
            _collect_manifest_entries(name, output_root, declared_outputs, result or {})
        )

    # 产物清单(路径 + 大小 + SHA-256)
    manifest: dict[str, object] = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "plugins": results,
        "artifacts": manifest_entries,
    }
    manifest_path = output_root / "scripts" / "dist" / "artifacts-manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    succeeded = sum(1 for r in results.values() if r.get("status") == "success")
    failed = sum(1 for r in results.values() if r.get("status") != "success")
    logger.info(
        "Plugins summary: %d succeeded, %d failed (%d total)",
        succeeded,
        failed,
        len(results),
    )
    logger.info("Artifacts manifest: %s", manifest_path)
    return exit_code


def cmd_validate(args: argparse.Namespace) -> int:
    """
    校验全部周刊的 frontmatter(含未发布)与资产引用。

    校验项:title/date 必填、slug 纯数字、published 布尔、date 格式、
    cover 本地引用文件存在。任一错误即输出错误列表并返回 1。
    """
    logger = get_logger("youth_weekly.cli")
    docs_dir = Path(args.docs_dir) if args.docs_dir else get_docs_dir()
    issues = load_all_issues(docs_dir, reverse=False, include_unpublished=True)

    errors = validate_issues(issues, docs_dir)
    if errors:
        for error in errors:
            logger.error("  - %s", error)
        logger.error(
            "Validation failed: %d issue(s) affected, %d error(s) total",
            len({e.split(":", 1)[0] for e in errors}),
            len(errors),
        )
        return 1

    logger.info("Validation OK: %d issues validated under %s", len(issues), docs_dir)
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
    # 生成新一期后必须清除缓存,否则新文件不会被 load_all_issues 看到
    clear_cache()
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
    p_generate = sub.add_parser(
        "generate",
        help="执行纯静态 OCP 插件生成站点产物(默认不触发 collect/issue)",
    )
    p_generate.add_argument(
        "--output",
        "-o",
        help="产物根目录(默认仓库根;仅用于自定义输出/测试,部署路径不要使用)",
    )
    p_generate.add_argument(
        "plugins",
        nargs="*",
        help="指定插件名(默认白名单: %s)" % ", ".join(DEFAULT_STATIC_PLUGINS),
    )
    p_generate.set_defaults(func=cmd_generate)

    # validate 命令
    p_validate = sub.add_parser(
        "validate",
        help="校验周刊 frontmatter 与资产引用(Pydantic)",
    )
    p_validate.add_argument("--docs-dir", "-d", help="文档根目录")
    p_validate.set_defaults(func=cmd_validate)

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
