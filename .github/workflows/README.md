# GitHub Actions Workflows

本目录包含青年周刊项目的所有 CI/CD 工作流。

## Workflow 一览

| Workflow | 触发条件 | 职责 |
| --- | --- | --- |
| `ci.yml` | push (PR / main) | 单元测试、类型检查、构建校验 |
| `deploy.yml` | push main、手动 dispatch | 构建站点并部署到 GitHub Pages |
| `weekly-publish.yml` | 每周一 cron、手动 dispatch | 采集内容、生成周刊、提交到 main |
| `release.yml` | tag 推送 | 打包发布版本 |

## GitHub Pages 部署（双轨冲突解决方案）

### 1. 仓库 Settings → Pages 必须选择 "GitHub Actions"

在 `Settings → Pages → Build and deployment → Source` 中，**必须**选择 **GitHub Actions**（而不是 "Deploy from a branch"）。

原因：
- 选择 **"GitHub Actions"** 后，GitHub 内置的 `pages-build-deployment` workflow 不会再运行。
- 本仓库的 `deploy.yml` 是唯一负责 Pages 部署的 workflow，避免了双轨并发导致的竞态。
- 历史上 64% 的部署失败正是因为两个 workflow 互相抢占。

如果当前是 "Deploy from a branch"，请改为 "GitHub Actions" 后保存（无需选择 branch，保存后选择 GitHub Actions 即可）。

### 2. weekly-publish 如何触发 deploy

`weekly-publish.yml` **不再**显式 dispatch `deploy.yml`。完整链路：

1. `weekly-publish.yml` 通过 cron 或手动触发。
2. 采集 + 生成新一期周刊后，commit + push 到 `main`（commit message 末尾带 `[skip ci]`）。
3. `[skip ci]` 仅跳过 `ci.yml` 的冗余校验，**不会**跳过 `deploy.yml`。
4. `deploy.yml` 监听到 main 分支的 push，自然触发：build → upload artifact → deploy。
5. 新周刊内容随主站一并发布到 GitHub Pages。

> 历史问题：旧版 `weekly-publish.yml` 末尾有 `gh api ... workflows/deploy.yml/dispatches` 步骤，会与 push 触发的 `deploy.yml` 形成级联冗余，造成资源浪费并偶发竞态。已删除该步骤。

### 3. concurrency group 的作用

两个 workflow 使用 **不同**的 concurrency group，互不阻塞：

| Workflow | Group | cancel-in-progress |
| --- | --- | --- |
| `deploy.yml` | `pages-deploy-${{ workflow }}-${{ ref }}` | `true` |
| `weekly-publish.yml` | `weekly-publish-${{ workflow }}` | `false` |

- **`deploy.yml`**：同 workflow + 同 ref 下，新运行会取消旧运行。短时间内多次 push 时只保留最后一次部署，避免浪费 runner 资源。
- **`weekly-publish.yml`**：周刊采集 + 生成是长任务，新运行**不打断**旧运行，保证一次采集的原子性。

### 4. 为什么 deploy.yml 不绑定 environment

`deploy.yml` 故意 **不绑定** GitHub Environment。原因：
- Environment 保护规则（required reviewers、wait timer）会阻塞自动部署。
- 当前部署链路（build → upload artifact → configure-pages → deploy-pages）已经过生产验证，无需额外保护。
- 减少对仓库管理员的依赖：任何 push 到 main 都会自动部署。

## 常见问题

**Q: Pages 一直显示 404？**
A: 检查 `Settings → Pages → Source` 是否选择了 "GitHub Actions"。如果是 "Deploy from a branch"，改为 "GitHub Actions" 并保存。

**Q: weekly-publish 跑完后主站没更新？**
A: 等待 `deploy.yml` 自然触发（通常在 weekly-publish push 后 1-2 分钟）。可在 Actions 页面查看 deploy.yml 的运行状态。

**Q: 能手动触发部署吗？**
A: 可以。在 Actions 页面选择 `Deploy` workflow → Run workflow → 选择 main 分支即可。

**Q: 如何同时运行多次周刊采集？**
A: 当前配置为同一 group 串行执行（cancel-in-progress: false），会等旧任务完成。如需并行，可调整为 `cancel-in-progress: true` 或在 cron 中错开时间。
