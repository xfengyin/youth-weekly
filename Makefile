# =============================================================================
# 青年周刊 (Youth Weekly) 根目录 Makefile
# -----------------------------------------------------------------------------
# 一站式质量门禁入口：format / lint / test / audit / all
# 所有 Python 任务均在 scripts/ 目录执行，遵循项目分层规范
# 使用：make <target>
# =============================================================================

# 默认目标：列出所有可用命令
.DEFAULT_GOAL := help

# 让 make 在并发执行时输出更清晰
SHELL := /bin/bash

# -----------------------------------------------------------------------------
# 路径与配置
# -----------------------------------------------------------------------------
SCRIPTS_DIR := scripts
SRC_DIR     := $(SCRIPTS_DIR)/src
TESTS_DIR   := $(SCRIPTS_DIR)/tests
PYPROJECT   := $(SCRIPTS_DIR)/pyproject.toml
UV          ?= uv

# 是否使用 uv run 包裹命令（推荐）
USE_UV ?= 1

# 若 USE_UV=1，所有命令通过 uv run 执行，否则需自行激活虚拟环境
ifdef USE_UV
    PY_RUN    := $(UV) run
    PIP_RUN   := $(UV) pip
else
    PY_RUN    :=
    PIP_RUN   := python -m pip
endif

# -----------------------------------------------------------------------------
# 帮助
# -----------------------------------------------------------------------------
.PHONY: help
help: ## 显示本 Makefile 的所有可用目标
	@echo ""
	@echo "  青年周刊 · 根目录 Makefile"
	@echo "  ----------------------------------------------"
	@awk 'BEGIN {FS = ":.*##"; printf "\n  用法: make \033[36m<target>\033[0m\n\n"} \
		/^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2 } \
		/^##@/ { printf "\n  \033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)
	@echo ""

##@ 安装与环境

.PHONY: install
install: ## 安装 Python 依赖（uv sync + dev 依赖）
	cd $(SCRIPTS_DIR) && $(UV) sync --extra dev

.PHONY: install-hooks
install-hooks: ## 安装 pre-commit Git 钩子
	$(PY_RUN) pre-commit install
	@echo "✓ pre-commit 钩子已安装，下次 commit 自动触发"

##@ 代码格式化

.PHONY: format
format: ## 格式化 Python 代码（black + isort）
	cd $(SCRIPTS_DIR) && $(PY_RUN) black $(SRC_DIR) $(TESTS_DIR)
	cd $(SCRIPTS_DIR) && $(PY_RUN) isort --profile black $(SRC_DIR) $(TESTS_DIR)
	@echo "✓ 格式化完成"

.PHONY: format-check
format-check: ## 仅检查格式是否合规，不修改文件
	cd $(SCRIPTS_DIR) && $(PY_RUN) black --check --diff $(SRC_DIR) $(TESTS_DIR)
	cd $(SCRIPTS_DIR) && $(PY_RUN) isort --profile black --check-only --diff $(SRC_DIR) $(TESTS_DIR)

##@ 代码检查

.PHONY: lint
lint: ## 静态检查（flake8 + isort --check + black --check）
	cd $(SCRIPTS_DIR) && $(PY_RUN) flake8 $(SRC_DIR) $(TESTS_DIR)
	cd $(SCRIPTS_DIR) && $(PY_RUN) isort --profile black --check-only $(SRC_DIR) $(TESTS_DIR)
	cd $(SCRIPTS_DIR) && $(PY_RUN) black --check $(SRC_DIR) $(TESTS_DIR)
	@echo "✓ lint 通过"

.PHONY: lint-quick
lint-quick: ## 快速检查（仅 flake8，跳过 black/isort 重复项）
	cd $(SCRIPTS_DIR) && $(PY_RUN) flake8 $(SRC_DIR) $(TESTS_DIR)
	@echo "✓ 快速 lint 通过"

.PHONY: typecheck
typecheck: ## mypy 静态类型检查（速度较慢，按需执行）
	cd $(SCRIPTS_DIR) && $(PY_RUN) mypy $(SRC_DIR)

##@ 测试

.PHONY: test
test: ## 跑单元测试（含覆盖率报告）
	cd $(SCRIPTS_DIR) && $(PY_RUN) pytest --cov=$(SRC_DIR) --cov-report=term-missing

.PHONY: test-fast
test-fast: ## 快速跑测试（无覆盖率）
	cd $(SCRIPTS_DIR) && $(PY_RUN) pytest -x

##@ 安全审计

.PHONY: audit
audit: ## Bandit 安全扫描（src/ 下全部 Python）
	cd $(SCRIPTS_DIR) && $(PY_RUN) bandit -r $(SRC_DIR) -ll

.PHONY: audit-full
audit-full: ## Bandit 全面扫描（含中危）
	cd $(SCRIPTS_DIR) && $(PY_RUN) bandit -r $(SRC_DIR) -ll -i

##@ 组合流水线

.PHONY: all
all: format lint test ## 完整流水线：format + lint + test
	@echo ""
	@echo "✓ 全部通过，代码可提交"

.PHONY: ci
ci: lint typecheck test audit ## 模拟 CI：lint + typecheck + test + audit
	@echo ""
	@echo "✓ CI 模拟通过"

.PHONY: pre-commit
pre-commit: ## 本地手动跑 pre-commit 全量检查
	$(PY_RUN) pre-commit run --all-files

##@ 清理

.PHONY: clean
clean: ## 清理缓存与构建产物
	rm -rf $(SCRIPTS_DIR)/.pytest_cache $(SCRIPTS_DIR)/.mypy_cache $(SCRIPTS_DIR)/.ruff_cache
	rm -rf $(SCRIPTS_DIR)/dist $(SCRIPTS_DIR)/build
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@echo "✓ 清理完成"
