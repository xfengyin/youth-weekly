# 架构说明（当前状态）

> 本文档只描述**当前**真实架构，每个版本号都能在仓库文件里对上。
> 历史版本（2026-06）曾写「Next.js 14 / React 18 / 3 个 workflow」，那三条均已过期，正文已在 2026-09 重写；
> 当时提出的 T-A（基础重构）、T-B（管线重构）结论已落地，见 `CHANGELOG.md`。

---

## 1. 三个组成部分

| 部分 | 技术栈 | 职责 | 入口 |
|---|---|---|---|
| `scripts/` | Python >=3.12 + uv + Pydantic + requests，包名 `youth-weekly-scripts` 2.0.0 | 采集 → 策展 → 生成周刊 Markdown 与 JSON 产物 | CLI `youth-weekly`（`src/youth_weekly/cli.py`） |
| `web/` | Next.js 16.3.5（静态导出）+ React 19.2/19.3 + TypeScript 5.9 + Tailwind 3.4 + remark-gfm/react-markdown | 静态站点：期号页、归档、分类、搜索、订阅 | `web/src/app/**` |
| `wechat-miniprogram/` | 微信小程序原生 | 同一份 JSON 产物的小程序视图 | `wechat-miniprogram/pages/**` |

## 2. 数据流（唯一真相在 `docs/` 与源码）


    docs/issues/<期号>/README.md   ←── 人工/AI 审阅的内容源（frontmatter + 正文）
            │  youth-weekly generate
            ▼
    web/public/issue_index.json + issue-<slug>.json + site-data.json + search-data.json
    scripts/dist/rss.xml + stats.json + artifacts-manifest.json（含 SHA-256）
            │
            ├──► web 构建时读取（web/src/app/lib/content.ts，产物缺失即快速失败，绝不静默空数据上线）
            └──► 小程序运行时经 HTTPS 读取同一份 JSON

- 前端**不再直接解析 `docs/*.md`**：Markdown 的杂志化解析只在构建产物之上进行（`web/src/app/lib/magazine.ts`）。
- `scripts/dist/artifacts-manifest.json` 记录产物哈希，用于检测「产物与源码脱节」。

## 3. 决策记录（ADR）

**ADR-001 · 两套扩展点各管一段，不得互相扩张**
- 采集源扩展：只改 `scripts/src/youth_weekly/core/collectors.py` 的 collector 注册表（`register_collector` / `get_collector`）。
- 生成阶段扩展：只改 `scripts/src/youth_weekly/plugin/registry.py` 的 `Registry`（`@register`），插件放 `scripts/src/youth_weekly/plugins/`。
- 理由：两者生命周期不同（采集跑在网络层、产物生成跑在纯数据层），合并会让测试必须同时造网络桩；代价是「新增一类东西要知道改哪边」，因此把边界写死比让两边都能注册更好。

**ADR-002 · 产物必须入库，并由 CI 校验一致性**
- `web/public/*.json` 与 `scripts/dist/*` 属于受版本控制的交付物（静态站可直接上线，不依赖构建期有 Python 环境）。
- 代价是「可能忘记重新生成」：CI 门禁为 `generate` 之后 `git add -A -- web/public scripts/dist` + `git diff --cached --quiet`，产物有任何改动或新增都让 CI 失败。

**ADR-003 · 数据层是静态 JSON，不引入服务端 API/数据库**
- 站点是纯静态导出，搜索索引构建期生成、客户端加载；不引入 GraphQL/tRPC/DB。
- 理由：内容更新频率是「每周一期」，静态产物的构建与缓存成本远低于运行一个服务。

**ADR-004 · 不做「动态插件目录自动发现」**
- 2026-09 删除 `plugin/loader.py`（100 行）与其测试：它只被测试引用，生产代码无调用点，也没有任何配置项能指定插件目录，即一个永远无法被触发的功能。
- 新增插件的方式是 `plugins/` 包内建文件 + 显式 import（导入即注册）。

## 4. CI / 自动化事实

`.github/workflows/ci.yml` 四个 job：

| job | 内容 |
|---|---|
| `quality` | Python 3.12 + **3.13** 矩阵：格式化/lint → `pytest --cov-fail-under=70`（覆盖率仅在 3.12 上报 codecov）→ 构建 → CLI 冒烟 → **产物一致性门禁** |
| `rehearsal` | 在临时目录跑完整出刊流程（`rehearsal.sh`，离线样例数据），验证不污染仓库 |
| `security` | 依赖与 secrets 检查 |
| `frontend` | Node 20：`npm ci` → lint → type-check → test → build |

触发：`pull_request`（到 main）**与 `push`（到 main）**。

仓库共 10 个 workflow：`ci`、`deploy`（仅 main push，发布 Pages）、`weekly-publish`（cron 周一 13:00 UTC 采集发布）、`nightly`、`dependabot-auto-merge`、`dependabot-auto-rebase`、`gemini-issue-triage`、`gemini-mention`、`gemini-pr-review`、`auto-close-security-issue`。

## 5. 已知边界（不做的事写清楚，比留白好）

| 事项 | 现状 | 处理 |
|---|---|---|
| eslint 10 | `eslint-config-next` 固定用 Next 自带 babel parser，其内联 eslint-scope 缺 `addGlobals`（eslint 10 需要），本地与干净安装均复现 | 已在 `dependabot.yml` 加 `ignore: eslint >= 10.0.0` 并注明移除条件 |
| Tailwind 3.4 | v4 已发布（4.3），迁移涉及 `@tailwind` 指令、`@config`、PostCSS 插件与 typography 插件加载方式 | 单独分支单独验证，不与功能改动混在一起 |
| Python 3.13 | 已进 CI 矩阵；3.14 待依赖确认 | 观察一轮 CI 再决定是否提 `requires-python` |
| `react` / `react-dom` 版本错配 | `react ^19.2.0` 与 `react-dom ^19.3.0` 不同小版本 | dependabot 已按 `react` 组组合并升级，避免再被拆开 |

## 6. 变更纪律

改数据契约（新增/重命名 JSON 字段）时必须同步三处，否则线上会静默错位：

1. 产物生成侧：`scripts/src/youth_weekly/plugins/issue_json.py` 等；
2. Web 消费侧：`web/src/app/lib/content.ts`（类型定义与快速失败）；
3. 小程序消费侧：`wechat-miniprogram/utils/request.js` 与 `pages/**`。

`docs/README.md` 是**自动生成的期号索引**（`AUTO_ISSUE_TABLE` 区间由 `update_readme` 环节维护），不要手工编辑该表。
