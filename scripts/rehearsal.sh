#!/usr/bin/env bash
# =============================================================================
# 青年周刊 · 出刊演练脚本（rehearsal）
# -----------------------------------------------------------------------------
# 在临时目录跑完整出刊流程：collect → issue → update_readme → generate → validate，
# 验证流水线可用而不污染真实仓库（结束后自动清理临时 WORKDIR）。
#
# 用法（仓库根目录）:
#   bash scripts/rehearsal.sh              # 默认：使用样例策展数据，跳过网络采集
#   bash scripts/rehearsal.sh --real       # 真实网络采集（需要网络 + YOUTH_WEEKLY_LLM_API_KEY）
#   bash scripts/rehearsal.sh --keep       # 结束后保留 WORKDIR 便于检查（默认自动清理）
#
# 环境变量:
#   REHEARSAL_KEEP=1        同 --keep
#   REHEARSAL_REAL_COLLECT=1 同 --real
#
# 原理：通过 YOUTH_WEEKLY_ROOT 环境变量把项目根重定向到临时 WORKDIR，
# 所有写入（docs/issues/NNN、README、web/public/*.json、scripts/dist/*）都落在 WORKDIR；
# 脚本只向 WORKDIR 拷贝所需骨架（config.yaml / README / content_sources.yaml /
# 封面模板 / update_readme.py），不复制仓库代码与依赖。
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$REPO_ROOT/scripts"
SAMPLE_CURATED="$REPO_ROOT/docs/examples/curated.sample.json"

KEEP=0
REAL_COLLECT=0
for arg in "$@"; do
  case "$arg" in
    --keep) KEEP=1 ;;
    --real) REAL_COLLECT=1 ;;
    -h | --help)
      sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "未知参数：$arg（支持 --keep / --real）" >&2
      exit 2
      ;;
  esac
done
[ "${REHEARSAL_KEEP:-0}" = "1" ] && KEEP=1
[ "${REHEARSAL_REAL_COLLECT:-0}" = "1" ] && REAL_COLLECT=1

WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/youth-weekly-rehearsal.XXXXXX")"
cleanup() {
  if [ "$KEEP" -eq 1 ]; then
    echo "（演练模式：保留 WORKDIR，供检查 → $WORKDIR)"
  else
    rm -rf "$WORKDIR"
    echo "（已清理临时 WORKDIR)"
  fi
}
trap cleanup EXIT

echo "=============================================="
echo "青年周刊 · 出刊演练开始"
echo "真实仓库：$REPO_ROOT"
echo "演练目录：$WORKDIR"
echo "采集模式：$([ "$REAL_COLLECT" -eq 1 ] && echo '真实网络采集（--real）' || echo '样例策展数据（离线）')"
echo "=============================================="

# ---------------------------------------------------------------------------
# 0. 准备临时工作区（只拷贝所需骨架）
# ---------------------------------------------------------------------------
echo "==> [0/5] 准备临时工作区"
mkdir -p "$WORKDIR/docs" "$WORKDIR/web/public" \
  "$WORKDIR/scripts/templates" "$WORKDIR/scripts/dist"
cp "$REPO_ROOT/config.yaml" "$WORKDIR/config.yaml"
cp "$REPO_ROOT/README.md" "$WORKDIR/README.md"
cp "$REPO_ROOT/docs/README.md" "$WORKDIR/docs/README.md"
cp "$SCRIPTS_DIR/content_sources.yaml" "$WORKDIR/scripts/content_sources.yaml"
cp "$SCRIPTS_DIR/templates/cover-template.png" "$WORKDIR/scripts/templates/cover-template.png"
cp "$SCRIPTS_DIR/update_readme.py" "$WORKDIR/scripts/update_readme.py"

# ---------------------------------------------------------------------------
# 1. collect
# ---------------------------------------------------------------------------
if [ "$REAL_COLLECT" -eq 1 ]; then
  echo "==> [1/5] collect：真实网络采集（--real)"
  (
    cd "$SCRIPTS_DIR"
    YOUTH_WEEKLY_ROOT="$WORKDIR" uv run youth-weekly collect
  )
  if [ ! -f "$WORKDIR/scripts/.curated_content.json" ]; then
    echo "!! 真实采集未产出策展数据（可能无网络/无 API key），演练终止" >&2
    exit 1
  fi
else
  echo "==> [1/5] collect：演练模式（样例策展数据替代网络采集)"
  echo "    （真实发布时执行：make collect)"
  cp "$SAMPLE_CURATED" "$WORKDIR/scripts/.curated_content.json"
fi

# ---------------------------------------------------------------------------
# 2. issue
# ---------------------------------------------------------------------------
echo "==> [2/5] issue：生成新一期"
(
  cd "$SCRIPTS_DIR"
  YOUTH_WEEKLY_ROOT="$WORKDIR" uv run youth-weekly issue
)

# ---------------------------------------------------------------------------
# 3. update_readme
# 用 WORKDIR 内的 update_readme.py（其 ROOT 按 __file__ 解析为 WORKDIR），
# 避免写入真实仓库的 README.md / docs/README.md。
# ---------------------------------------------------------------------------
echo "==> [3/5] update_readme：同步 README 最新一期与索引表"
(
  cd "$SCRIPTS_DIR"
  YOUTH_WEEKLY_ROOT="$WORKDIR" uv run python "$WORKDIR/scripts/update_readme.py"
)

# ---------------------------------------------------------------------------
# 4. generate
# ---------------------------------------------------------------------------
echo "==> [4/5] generate：重建站点 JSON 产物"
(
  cd "$SCRIPTS_DIR"
  YOUTH_WEEKLY_ROOT="$WORKDIR" uv run youth-weekly generate
)

# ---------------------------------------------------------------------------
# 5. validate
# ---------------------------------------------------------------------------
echo "==> [5/5] validate：校验 frontmatter 与资产引用"
(
  cd "$SCRIPTS_DIR"
  YOUTH_WEEKLY_ROOT="$WORKDIR" uv run youth-weekly validate
)

# ---------------------------------------------------------------------------
# 结果汇总
# ---------------------------------------------------------------------------
NEW_ISSUE="$(ls -1 "$WORKDIR/docs/issues" | sort | tail -1)"
JSON_COUNT="$(ls -1 "$WORKDIR/web/public"/*.json 2>/dev/null | wc -l | tr -d ' ')"
echo ""
echo "=============================================="
echo "✅ 出刊演练成功"
echo "  - 新一期：$WORKDIR/docs/issues/$NEW_ISSUE/"
echo "  - README 最新一期区块：$WORKDIR/README.md"
echo "  - 索引表：$WORKDIR/docs/README.md"
echo "  - 站点 JSON：$WORKDIR/web/public/*.json（$JSON_COUNT 个)"
echo "  - RSS/统计：$WORKDIR/scripts/dist/"
echo "=============================================="

# ---------------------------------------------------------------------------
# 真实仓库洁净检查：证明演练未污染仓库
# ---------------------------------------------------------------------------
REPO_DIRTY="$(git -C "$REPO_ROOT" status --porcelain)"
if [ -n "$REPO_DIRTY" ]; then
  echo "⚠️ 警告：演练后真实仓库出现变更，请检查！" >&2
  echo "$REPO_DIRTY" >&2
  exit 1
fi
echo "✔ 真实仓库无残留变更（演练未污染仓库)"
