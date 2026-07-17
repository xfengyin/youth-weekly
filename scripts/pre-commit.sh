#!/usr/bin/env bash
# =============================================================================
# 轻量级 pre-commit 替代脚本（无需安装 pre-commit 框架）
# -----------------------------------------------------------------------------
# 用途：在 git commit 前自动执行 black + isort + flake8，避免 CI 失败回流
# 使用：
#     1) 自动安装（推荐）：make install-hooks
#     2) 手动安装：ln -sf ../../scripts/pre-commit.sh .git/hooks/pre-commit
#     3) 手动跑：bash scripts/pre-commit.sh
# =============================================================================

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 切到仓库根目录（避免在子目录执行时路径错乱）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# 进入 scripts/ 子工程目录
SCRIPTS_DIR="$REPO_ROOT/scripts"
cd "$SCRIPTS_DIR"

# 工具函数：打印步骤标题
step() { echo -e "\n${YELLOW}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}✓ $*${NC}"; }
die()  { echo -e "${RED}✗ $*${NC}" >&2; exit 1; }

# 工具选择：优先 uv run，回退到直接命令
if command -v uv >/dev/null 2>&1; then
    RUN="uv run"
else
    RUN=""
fi

# 1. 收集本次 commit 涉及的 Python 文件
step "收集本次变更的 Python 文件"
PY_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.py$' || true)
if [ -z "$PY_FILES" ]; then
    ok "无 Python 文件变更，跳过质量门禁"
    exit 0
fi
echo "待检查文件："
echo "$PY_FILES" | sed 's/^/  - /'

# 2. isort：仅 import 排序
step "[1/3] isort 检查 import 顺序"
if $RUN isort --profile black --line-length 88 --check-only --diff $PY_FILES; then
    ok "isort 通过"
else
    die "isort 失败，请执行 'uv run isort --profile black <file>' 修复"
fi

# 3. black：代码格式化
step "[2/3] black 检查代码格式"
if $RUN black --check --diff --line-length 88 $PY_FILES; then
    ok "black 通过"
else
    die "black 失败，请执行 'uv run black <file>' 修复"
fi

# 4. flake8：风格 + 错误检查
step "[3/3] flake8 静态检查"
if $RUN flake8 --max-line-length=88 --extend-ignore=E203,W503 $PY_FILES; then
    ok "flake8 通过"
else
    die "flake8 失败，请修复上述问题后再提交"
fi

ok "全部检查通过 ✓"
