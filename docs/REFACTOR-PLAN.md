# 重构升级方案（执行中）

> 状态：**执行中**（分支 `refactor/execute-2026-09`）｜最后更新：2026-09-15
> 分析基础：全仓只读审查（代码结构 / 依赖 / 产物 / CI / git 入库统计），每条结论均有 file:line 依据。
> 原则：ponytail —— 能删就删、复用已有、标准库与原生能力优先、不为「以后可能需要」造抽象。

---

## 0. 结论

项目不需要重写。真实问题只有 5 处「漂移」：

1. **文档漂移** —— `ARCHITECTURE_REVIEW.md` 还写着 Next.js 14 / React 18 / 3 个 workflow，实际是 Next 16.3.5 / React 19 / 10 个 workflow。
2. **产物双份真相** —— `docs/issues/` 是源，`web/public/` 下还有 42 个已入库 JSON 产物，可以手改、可以忘记重新生成。
3. **两套扩展机制** —— `core/collectors.py` 的 `register_collector/get_collector` 与 `plugin/registry.py` 的 `Registry/register` 并存，另有 `plugin/loader.py` 做目录动态发现（无调用点）。
4. **前端解析三路径** —— `react-markdown` + 手写 `magazine.ts`(`parseMagazine`) + 手写 `toc.ts`(`extractToc`/`tocByLine`)，且集中在 521 行的 `issues/[slug]/page.tsx` 里。
5. **为示例存在的配置** —— `plugins/example.py` 唯一用途是被 `config.yaml:82-84 ocp.exclude_plugins` 排除。

---

## 1. 任务表与状态

### 批次 A · 清理（风险最低，先做）

| # | 任务 | 证据 | 状态 | 验收 |
|---|---|---|---|---|
| A1 | 删 `plugins/example.py` + `config.yaml` 的 `ocp.exclude_plugins` | `config.yaml:82-84`；`plugins/example.py` | 执行中 | `uv run --no-sync pytest -q` 全绿；`youth-weekly generate` 产物不变 |
| A2 | 删疑似死代码 `plugin/loader.py`（先证实无调用点） | `plugin/loader.py:28,82` 仅见定义与 `__all__` | 执行中 | 全仓 grep 无调用 + 测试通过 |
| A3 | 重写 `ARCHITECTURE_REVIEW.md`（当前架构 + 决策记录），新增 `docs/README.md` 索引 | `ARCHITECTURE_REVIEW.md:37-44`（写 Next 14/React 18/3 workflow） | 执行中 | 文档中每个版本号都能与 `package.json` / workflows 对上 |

### 批次 B · 契约与门禁加固

| # | 任务 | 证据 | 状态 | 验收 |
|---|---|---|---|---|
| B1 | CI 增加「产物一致性」校验：`generate` 后 `git diff --exit-code` 必须为空 | 42 个产物 JSON 已入库（`web/public/`） | 执行中 | 手改任一期 `web/public/issue-*.json` 后 CI 必须失败 |
| B2 | 扩大 CI 触发面：push 到 main 也跑（现在只 `pull_request`） | `ci.yml` 触发条件 | 执行中 | main 上出现 CI 运行且绿 |
| B3 | Python 3.13 加入 CI 测试矩阵 | `requires-python >=3.12`，CI 用 3.12 | 执行中 | 3.12/3.13 双绿 |
| B4 | dependabot 分组（react 组 / next 组 / testing 组），避免同套库被拆成多个 PR | 历史事故：react 19.3 与 react-dom 19.2 不匹配而卡住 | 执行中 | 同组依赖只出一个 PR |

### 批次 C · 前端结构

| # | 任务 | 证据 | 状态 | 验收 |
|---|---|---|---|---|
| C1 | 拆 `issues/[slug]/page.tsx`（521 行）为职责单一组件，行为逐字不变 | `web/src/app/issues/[slug]/page.tsx` | 执行中 | `npm run lint && npm run type-check && npm test` 通过 |
| C2 | 合并 `lib/toc.ts` 与 `lib/magazine.ts` 的重复解析 | `toc.ts:32,52`；`magazine.ts:110` | 执行中 | 18 期逐期渲染结果一致 |

### 批次 D · 升级

| # | 任务 | 证据 | 状态 | 验收 |
|---|---|---|---|---|
| D1 | Tailwind 3.4.19 → 4（单独改动，便于回滚） | `web/package.json`、`postcss.config.js`、`globals.css`(518 行) | 待执行 | `npm run build` 成功且页面视觉无回归 |
| D2 | eslint 10 —— **已处置**：`eslint-config-next` 固定用 Next 自带 babel parser（缺 `addGlobals`），已加 `ignore: eslint >= 10.0.0` | `dependabot.yml`；PR #84 已附证据关闭 | 完成 | Next 更新该 parser 后删 ignore |

---

## 2. 删除 / 合并清单

| 内容 | 位置 | 收益 |
|---|---|---|
| 示例插件 | `scripts/src/youth_weekly/plugins/example.py` | 少一个必须被配置排除的插件 |
| 排除配置 | `config.yaml` 的 `ocp.exclude_plugins` | 少一条为死代码服务的配置 |
| 动态发现框架 | `scripts/src/youth_weekly/plugin/loader.py` | 少约 100 行无人调用的加载器 |
| TOC 重复解析 | `lib/toc.ts` 与 `lib/magazine.ts` 重叠部分 | 少一份可能漂移的解析规则 |
| 过期评审正文 | `ARCHITECTURE_REVIEW.md` 重写后归档 | 少一份与事实相反的权威文档 |

---

## 3. 明确不做（YAGNI）

| 不做 | 理由 |
|---|---|
| 引入 monorepo 工具（turborepo/nx/pnpm workspace） | 三端耦合约等于零，共享的只是一份 JSON 产物，Makefile + npm 足够 |
| vitest 替换 jest | 现有 jest + testing-library 可跑、无阻塞，换框架收益为负 |
| 数据层加 GraphQL/tRPC/DB | 静态 JSON + 静态导出是本项目的最优解 |
| 拆微服务 / 换 asyncio 栈 | 采集已有并发（`collectors.py:412 collect_concurrent`），`requests` 够用 |
| 重写 git 历史 / 上 Git LFS | 80 张图片与 62M docs 是内容本体而非误入库，重写历史的协作成本大于收益 |
| 为小程序另造一套类型系统 | 目前靠 `wechat-miniprogram/utils/request.js` 的 slug 白名单校验兜底，未见字段漂移事故 |

---

## 4. 验收命令


    # Python 侧
    cd scripts && uv run --no-sync pytest -q
    uv run --no-sync youth-weekly generate && git status --porcelain   # 产物一致性（应只剩预期改动）
    # 前端侧
    cd web && npm run lint && npm run type-check && npm test && npm run build
    # 根目录一站式门禁
    make all
