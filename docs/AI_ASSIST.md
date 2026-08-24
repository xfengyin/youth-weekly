# 青年周刊 · AI 辅助内容生产指南

> 目标：用 LLM 把「采集 → 策展 → 成稿」中最耗时的部分提速，
> 同时守住内容标准（见 [CONTENT_PLAYBOOK.md](./CONTENT_PLAYBOOK.md)）。
> 原则：**AI 出初稿，人做判断**——AI 负责快与全，主编负责观点与温度。

---

## 1. 适用场景

| 场景 | AI 参与度 | 说明 |
|------|:--------:|------|
| 选题建议 | 高 | 让 AI 聚类本周热点，给出候选主题 |
| 初稿生成 | 高 | 基于策展 JSON 生成整期初稿（用 `draft_prompt.py`） |
| 条目改写 | 中 | 单条目「是什么→为什么→怎么做」扩写 |
| 标题打磨 | 中 | 生成 5 个候选标题供挑选 |
| 刊首语/金句 | 低 | AI 起稿，主编改写注入观点 |
| 事实核查 | 低 | AI 不可靠，人工对 URL/数据/日期负责 |

---

## 2. 选题建议（AI 辅助）

采集完成后（`scripts/.curated_content.json`），让 AI 帮你找「本周主题」：

**提示词（复制即用）：**

```
你是青年周刊的选题策划。以下是本周采集到的策展条目（按分类给出）。

要求：
1. 找出 2-3 个「本周最值得聊」的主题候选，每个给出一句话角度。
2. 判断标准：足够多人关心（热度）× 年轻人能共鸣（人群）× 能给出行动建议（价值）。
3. 不要泛泛的「AI 很火」，要具体：如「AI 开始造火箭了，边界在哪？」。
4. 每个主题补充一个可写的刊首语角度。

策展数据：
<粘贴 scripts/.curated_content.json 的内容，或直接粘贴按分类整理的条目>
```

**人工补充的信号源**：读者评论区高频话题、GitHub Trending 爆款、HN 前排讨论、
高校/政策发布（往往自带时效性）、自己的真实困惑（最有共鸣）。

---

## 3. 初稿生成提示词模板

### 3.1 整期初稿（推荐用 `scripts/draft_prompt.py` 自动生成数据部分）

```bash
cd scripts
uv run python draft_prompt.py -o /tmp/prompt.md --theme "本期主题"
# 把 /tmp/prompt.md 的内容（含分类条目 + 写作要求）发给 LLM
```

脚本输出即一个完整提示词：包含期号、可选主题、按分类整理的条目（标题/来源/分数/
描述/链接），以及遵循 CONTENT_PLAYBOOK 的成稿要求。

### 3.2 单条目改写

```
把下面这条「新闻摘要」改写成周刊条目（120-300 字），按结构输出：
是什么（1-2 句，具体事实/数据）→ 为什么重要/有趣（洞察）→ 读者现在能做什么（行动）。
要求：简体中文、口语化但有信息密度；禁止空洞套话（赋能/风口/不可错过）；
标题要有信息量，不要「XXX 发布新版」这种。

原摘要：<title> — <description>（来源：<source>）
```

### 3.3 标题打磨

```
为以下条目生成 5 个候选标题，要求：有具体信息（数字/结果/对比），
口语化，控制在 20 字以内，避免标题党。
内容：<条目正文>
```

### 3.4 刊首语起稿

```
写一篇 150-300 字的刊首语，主题是「<主题>」。
要求：像给聪明朋友写信，有观点、有温度；开头用具体场景/数据抓住读者；
结尾抛出一个问题或邀请读者行动。不要 AI 味（不要「首先/其次/总之」）。
```

### 3.5 行动清单 + 金句

```
基于以下条目，生成「本周行动清单」3 条（每条是本周就能做的一件事，具体可执行）
和「本周金句」1 句（有力量、可引用、贴合主题）。
条目：<粘贴条目列表>
```

---

## 4. 审校清单（AI 稿必查）

AI 初稿速度快，但以下问题必须人工把关：

- [ ] **事实与链接**：URL 真实存在、标题与链接内容一致、数字/日期没有幻觉。
- [ ] **观点注入**：AI 稿往往「正确但平庸」，主编补充自己的判断与立场。
- [ ] **去套话**：删除「赋能、抓手、闭环、不可错过」等空词；AI 爱用的「总而言之」一律删。
- [ ] **图片引用**：只引用本期 `assets/` 中真实存在的文件（`./assets/cover.png` 或已上传图片），不新增不存在的引用。
- [ ] **结构合规**：`##` 板块 / `###` 条目；每期 ≥4 板块 + 刊首语 + 行动清单 + 金句。
- [ ] **自动门禁**：`make weekly-check` 通过（README 索引一致 + `youth-weekly validate` 0 退出）。
- [ ] **期号/日期**：与上一期递增，date 为当期发布日期，不写未来事件。

---

## 5. 如何接 LLM API

### 5.1 配置方式

LLM 配置集中在仓库根 `config.yaml` 的 `llm:` 段：

```yaml
llm:
  enabled: true
  provider: "openai"        # openai / openai_compatible / anthropic
  api_key: ""               # 建议留空，用环境变量传入（避免密钥入库）
  api_key_env: "YOUTH_WEEKLY_LLM_API_KEY"
  base_url: ""              # 自定义端点：如 DeepSeek/Moonshot/Azure/vLLM
  model: "gpt-4o-mini"      # 或 deepseek-chat、claude-3-5-sonnet-20241022 等
  timeout: 60
  max_retries: 3
  temperature: 0.7
  max_tokens: 2048
  prompts:
    editorial: ""           # 可自定义刊首语提示词
    article: ""             # 可自定义条目改写提示词
```

### 5.2 环境变量（推荐）

```bash
export YOUTH_WEEKLY_LLM_API_KEY="sk-xxxx"
# 自定义端点时（如 DeepSeek）：
# 在 config.yaml 中设置 llm.base_url="https://api.deepseek.com/v1"、llm.model="deepseek-chat"
```

- 密钥只通过环境变量或 GitHub Secrets 传入（CI 用 `YOUTH_WEEKLY_LLM_API_KEY`），
  不写进代码/配置文件。
- 未配置密钥时，管线自动降级：采集/生成仍可运行，只是不做 LLM 杂志化改写。

### 5.3 验证接入

```bash
cd scripts
YOUTH_WEEKLY_LLM_API_KEY=sk-xxx uv run youth-weekly config   # 查看生效配置
uv run youth-weekly collect                                   # 观察日志是否出现 LLM 改写
```

实现参考：`scripts/src/youth_weekly/core/llm.py`（`create_llm_provider`，支持
OpenAI 兼容 /chat/completions 与 Anthropic Messages API，含重试与超时）。

---

## 6. 配套工具

| 工具 | 作用 | 用法 |
|------|------|------|
| `scripts/draft_prompt.py` | 从策展 JSON 生成整期初稿提示词 | `uv run python draft_prompt.py -o prompt.md` |
| `make collect` | 采集（可选 LLM 改写） | 仓库根执行 |
| `make weekly-publish` | 一键出刊（collect→issue→update_readme→generate→validate） | 仓库根执行 |
| `make weekly-check` | 发布前快速门禁 | 仓库根执行 |

> 完整出刊流程见 [PUBLISHING_RUNBOOK.md](./PUBLISHING_RUNBOOK.md)。
