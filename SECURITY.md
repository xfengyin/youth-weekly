# 安全策略

## 支持的版本

以下版本接收安全更新：

| 版本 | 支持状态 |
|------|----------|
| 1.x   | ✅ 支持中 |
| 0.x   | ❌ 已停止支持 |

## 报告漏洞

我们非常重视安全问题。如果你发现了安全漏洞，请通过以下方式负责任地报告：

### 私下报告

**请不要** 在公开的 GitHub Issues 中报告安全问题。

请通过以下方式私下报告：

- 📧 邮箱：youth-weekly-security@example.com
- 🔐 GitHub Security Advisories：在仓库的 "Security" 标签页提交

### 报告内容

请在报告中包含以下信息：

1. **漏洞类型**：例如 XSS、SQL 注入、CSRF 等
2. **影响范围**：哪些组件或数据受到影响
3. **复现步骤**：详细的步骤说明
4. **概念证明**：PoC 代码或截图（如果有）
5. **潜在影响**：漏洞被利用的潜在后果
6. **建议修复**：你的修复建议（可选）

### 我们的承诺

- ✅ 在 **48 小时内** 确认收到你的报告
- ✅ 在 **7 天内** 评估漏洞严重程度
- ✅ 在 **30 天内** 发布修复（取决于严重程度）
- ✅ 修复发布后，公开致谢报告者（除非你希望匿名）

## 安全最佳实践

### 部署安全

- 使用最新稳定版本的依赖
- 定期更新依赖：`uv sync --upgrade`
- 启用 GitHub Dependabot 警报
- 定期运行 `pip-audit` 或 `safety` 检查

### 内容安全

- 周刊内容在发布前经过人工审核
- 不接受包含恶意代码或链接的内容
- 自动化脚本仅从可信来源拉取数据

### 配置安全

- 敏感配置使用环境变量
- `.env` 文件不提交到仓库
- GitHub Secrets 用于 CI/CD

## 已知安全问题

### 已修复

- [Issue #22] Python 版本配置不一致
- [Issue #23] 重复代码结构清理
- [Issue #26] uv.toml 格式错误

### 持续监控

- GitHub Dependabot
- GitHub Code Scanning (CodeQL)
- 定期安全审计

## 致谢

感谢以下安全研究者和贡献者（按时间顺序）：

- 项目维护团队
- 所有负责任地报告安全问题的贡献者

## 更多信息

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Python Security Best Practices](https://python.readthedocs.io/en/latest/library/security.html)
