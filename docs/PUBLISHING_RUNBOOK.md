# 青年周刊 · 每周出刊 Runbook

> 目标：让每周出刊稳定、可复制、全流程 **< 2 小时**。
> 读者：内容主编与值班编辑。本文档是「怎么做」的操作手册，内容标准见 [CONTENT_PLAYBOOK.md](./CONTENT_PLAYBOOK.md)。

---

## 1. 出刊流程总览（7 步）

```
采集 → 策展 → 生成 → 审校 → 发布 → 部署 → 同步 README
```

| 步骤 | 做什么 | 手段 | 耗时预算 |
|------|--------|------|:--------:|
| ① 采集 | 抓取内容源（HN/GitHub Trending/arXiv/RSS…） | `youth-weekly collect`（自动） | 15–20 min |
| ② 策展 | 人工筛选、定题、补充观点 | 编辑在 `.curated_content.json` 基础上编辑 | 40–60 min |
| ③ 生成 | 生成新一期 `docs/issues/NNN/` | `youth-weekly issue` + `update_readme.py` | 5 min |
| ④ 审校 | frontmatter/资产/内容质量双重把关 | `youth-weekly validate` + 人工清单（§4） | 10 min |
| ⑤ 发布 | 提交并推送 | `git add docs/ web/public/ README.md && git commit && git push` | 5 min |
| ⑥ 部署 | GitHub Pages 上线 | deploy.yml 自动触发（或手动 workflow_dispatch） | 自动 |
| ⑦ 同步 README | 最新一期区块 + 索引表 | `update_readme.py`（第③步已顺带完成；单独执行亦可） | 1 min |

> 合计人工耗时约 **70–100 分钟**，含自动采集并行等待，满足 < 2 小时目标。

---

## 2. 环境准备（首次）

```bash
# 克隆与依赖
git clone git@github.com:xfengyin/youth-weekly.git
cd youth-weekly

# Python 工具链（脚本全部在 scripts/ 下，Python 3.12 + uv）
cd scripts && uv sync --all-groups && cd ..

# 前端依赖（仅改 Web 时需要）
cd web && npm install && cd ..
```

常用命令速查（均在 `scripts/` 目录执行）：

| 命令 | 作用 | 产物 |
|------|------|------|
| `uv run youth-weekly collect` | 采集 + 自动策展打分 | `scripts/.curated_content.json` |
| `uv run youth-weekly issue` | 生成新一期 | `docs/issues/NNN/` |
| `uv run python update_readme.py` | 同步 README 最新一期 + 索引表 | `README.md`、`docs/README.md` |
| `uv run youth-weekly generate` | 重新生成站点 JSON 产物 | `web/public/*.json`、`scripts/dist/*` |
| `uv run youth-weekly validate` | 校验 frontmatter 与资产引用 | 退出码 0/1 |

---

## 3. 出刊操作步骤

### ① 采集

```bash
cd scripts
uv run youth-weekly collect
```

- 需要网络与 `YOUTH_WEEKLY_LLM_API_KEY`（本地缺省时自动降级为无 LLM 采集）。
- 成功标志：日志出现 `Collected N items, curated M items`，且存在 `scripts/.curated_content.json`。
- 失败排查：单源超时会自动跳过；全部失败请检查网络 / `content_sources.yaml` 中 `enabled` 标记。

### ② 策展（编辑核心环节）

- 打开 `scripts/.curated_content.json`（按采集分类组织），按 [CONTENT_PLAYBOOK](./CONTENT_PLAYBOOK.md) 的标准：
  - 保留「删掉会觉得少了点什么」的条目；
  - 给每个条目补上价值锚点、洞察或行动建议（至少两项）；
  - 控制篇幅：每板块 2–4 条，每期 4–6 个板块 + 刊首语。
- 主题定调：本周想聊什么？在刊首语里给出观点，而不是新闻串烧。

### ③ 生成新一期 + 同步 README

```bash
cd scripts
uv run youth-weekly issue            # 生成 docs/issues/NNN/（自动 published: true）
uv run python update_readme.py       # 同步 README 最新一期 + docs/README.md 索引表
uv run youth-weekly generate         # 重建 web/public/*.json 等站点产物
```

> `issue` 会依据上一期自动递增期号；若只是手动补历史期次，可跳过 `issue`，仅跑后两步。

### ④ 审校（质量关卡，见 §4 清单）

```bash
cd scripts
uv run youth-weekly validate                          # 自动校验：frontmatter/资产引用
uv run python update_readme.py --check                # README 索引一致性（应为 0 退出）
```

再对照 §4 人工清单逐项过一遍（刊首语观点、条目信息量、无纯链接、Markdown 结构、图片引用存在）。

### ⑤ 发布

```bash
cd <仓库根>
git add docs/ web/public/ README.md
git commit -m "📰 第 N 期：<一句话主题>"
git push origin main
```

> 推送后 deploy.yml 会自动部署；若未触发，到 Actions 手动 `workflow_dispatch` deploy.yml。

### ⑥ 部署

- 自动：push 到 main 触发 deploy.yml（Pages 构建 + 发布，约 3–5 min）。
- 手动：Actions → Deploy → Run workflow（branch: main）。
- 验证：访问 `https://xfengyin.github.io/youth-weekly/`，确认最新一期可读、封面与图片正常。

### ⑦ 同步 README

- 第③步的 `update_readme.py` 已同步根 README「最新一期」区块与 `docs/README.md` 索引表。
- 若改动了期次元数据（如修正 date/description），重跑一次即可：

```bash
cd scripts && uv run python update_readme.py
```

---

## 4. 发布前检查清单（Checklist）

### 自动门禁（必须全绿）
- [ ] `uv run youth-weekly validate` 退出码 0（frontmatter 合法、cover 资产存在、date 格式正确）
- [ ] `uv run python update_readme.py --check` 退出码 0（README 索引一致）
- [ ] （可选）`make ci` 本地全量质量门禁通过

### 内容质量（对照 CONTENT_PLAYBOOK）
- [ ] 有刊首语：一个观点 + 有温度，结尾抛出问题或邀请
- [ ] 每板块 2–4 条；每期 4–6 个板块 + 行动清单 + 金句
- [ ] 每条含「具体事实/数据/案例/操作步骤」至少 2 种，无纯链接罗列
- [ ] 标题有信息量（如「XXX 实测：3 个新功能让重构快 1 倍」而非「XXX 发布新版」）
- [ ] 无空洞套话（赋能/风口/不可错过）；简体中文、口语化但有密度
- [ ] 日期/期号正确；图片只用本期 `assets/` 中真实存在的文件
- [ ] 版块结构符合模板（`##` 板块 / `###` 条目 / 列表 / 引用）

### 发布动作
- [ ] `git add docs/ web/public/ README.md`（覆盖内容、产物与索引）
- [ ] commit message 描述本期主题
- [ ] 推送到 main，确认 deploy 成功、线上可访问

---

## 5. 一键出刊（Makefile）

仓库根目录提供两个目标，封装上述命令（详见 Makefile）：

```bash
make weekly-publish    # 一键跑 collect → issue → update_readme → generate → validate
make weekly-check      # 出刊前快速门禁：update_readme --check + validate
```

> 注意：`weekly-publish` 会真实调用网络采集并生成新一期（有副作用），
> 适合编辑在策展后使用；纯校验用 `weekly-check` 即可。

### 5.1 演练模式（rehearsal.sh）

不想动真实仓库？用演练脚本在临时目录跑完整出刊流程
（collect → issue → update_readme → generate → validate），验证流水线可用：

```bash
bash scripts/rehearsal.sh              # 默认：样例策展数据（离线，无网络副作用）
bash scripts/rehearsal.sh --real       # 真实网络采集（需要网络 + LLM API key）
bash scripts/rehearsal.sh --keep       # 结束后保留临时目录供检查（默认自动清理）
```

- 原理：通过 `YOUTH_WEEKLY_ROOT` 把项目根重定向到临时 WORKDIR，所有写入
  （docs/issues/NNN、README、web/public/*.json、scripts/dist/*）都在临时目录；
  脚本只拷贝所需骨架（config.yaml / README / content_sources.yaml / 封面模板 /
  update_readme.py），不复制代码与依赖。
- 默认采集模式使用样例策展数据 `docs/examples/curated.sample.json`
  （3 个分类、7 条样本），可自行替换该文件做演练素材。
- 演练结束后脚本自动检查真实仓库 `git status`，若有残留变更会以非 0 退出并提示。

---

## 6. 自动发布（CI 定时任务，无需人工）

`.github/workflows/weekly-publish.yml` 每周一 UTC 13:00（北京时间 21:00）自动执行：

```
collect → 有内容则 issue → update_readme + generate + validate → 提交并推送 → 触发 deploy
```

人工出刊与自动发布的关系：

- **自动为主**：每周一自动跑，编辑部事后审校补润色（提交修正即可，部署自动跟随）。
- **人工为辅**：遇到重大选题或自动采集失败时，按 §3 手动出刊。
- 自动发布无内容时不提交、不部署（幂等安全）；手动 `workflow_dispatch` 可随时补跑。

---

## 7. 常见问题（Troubleshooting）

| 现象 | 原因 | 处理 |
|------|------|------|
| `issue` 报「Curated content not found」 | 未先跑 collect | 先 `uv run youth-weekly collect` |
| `validate` 报 cover 引用不存在 | 文中引用了 assets 里没有的图 | 补图或改引用 |
| `update_readme.py --check` 报差异 | README 索引过期 | 跑 `uv run python update_readme.py` |
| 采集条目为 0 | 网络 / 源全部 disabled / API key 失效 | 查网络与 `content_sources.yaml` 的 `enabled` |
| 期号不对 | issue 生成器按上一期递增 | 检查 `docs/issues/` 最大期号与 frontmatter |
| push 后未部署 | GITHUB_TOKEN push 不触发 workflow | 手动 dispatch deploy.yml |

---

## 8. 相关文档

- [内容手册（价值观/模板/质量关卡）](./CONTENT_PLAYBOOK.md)
- [AI 辅助内容生产指南（提示词模板/接 LLM API）](./AI_ASSIST.md)
- [内容排期（未来 4 周）](./CONTENT_SCHEDULE.md)
- [演练样例策展数据](./examples/curated.sample.json)
- [架构说明](../ARCHITECTURE_REVIEW.md)
- [脚本工具说明](../scripts/README.md)
- [贡献指南](../CONTRIBUTING.md)
