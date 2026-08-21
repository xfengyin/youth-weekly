#!/bin/bash
# =============================================================================
# 批量删除 GitHub Actions workflow runs（增强版）
# -----------------------------------------------------------------------------
# 用法：
#   GITHUB_TOKEN=xxx bash .github/cleanup_workflow_runs.sh            # 默认清理 30 天前失败/取消的 run
#   GITHUB_TOKEN=xxx DAYS=7  bash .github/cleanup_workflow_runs.sh    # 自定义时间窗（7 天前）
#   GITHUB_TOKEN=xxx DRY_RUN=1 bash .github/cleanup_workflow_runs.sh  # 只列出不删除
#   GITHUB_TOKEN=xxx CONFIRM=yes bash ...                             # 跳过交互确认（CI/脚本内使用）
#
# 或者直接在浏览器操作:
#   https://github.com/xfengyin/youth-weekly/actions → 搜索 status:failure → 全选删除
# =============================================================================

OWNER="xfengyin"
REPO="youth-weekly"
DAYS="${DAYS:-30}"        # 只清理 N 天前的 run（避免误删近期记录）
DRY_RUN="${DRY_RUN:-0}"   # 1 = 仅列出，不删除
CONFIRM="${CONFIRM:-no}"  # yes = 跳过交互确认（非交互环境）

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ 请设置 GITHUB_TOKEN 环境变量"
  echo ""
  echo "📋 步骤:"
  echo "1. 前往 https://github.com/settings/tokens/new?type=fine_grained"
  echo "2. 选择 Repository: $OWNER/$REPO"
  echo "3. 权限: Actions → Read and write"
  echo "4. 复制 token 后运行:"
  echo "   GITHUB_TOKEN=ghp_xxx bash .github/cleanup_workflow_runs.sh"
  echo ""
  echo "💡 或者直接在网页操作: https://github.com/$OWNER/$REPO/actions"
  exit 1
fi

echo "🔍 正在获取 workflow runs（status=failure/cancelled，$DAYS 天前）..."

# 使用 python3 拉取并过滤：失败/取消 且 created_at 早于 cutoff（带分页）
TMP_FILE=$(mktemp)
export GITHUB_TOKEN OWNER REPO DAYS
python3 - <<'PYEOF' > "$TMP_FILE"
import json, os, sys, urllib.request, datetime

owner, repo = os.environ["OWNER"], os.environ["REPO"]
token = os.environ["GITHUB_TOKEN"]
days = int(os.environ["DAYS"])
cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)
headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}

def fetch(url: str) -> dict:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:  # noqa: S310 - 固定 github.com API
        return json.load(resp)

targets = []
for status in ("failure", "cancelled"):   # 注意：API 参数是 failure（原脚本误写为 failed）
    page = 1
    while page <= 5:  # 最多 5 页（500 条），可自行调大
        try:
            data = fetch(
                f"https://api.github.com/repos/{owner}/{repo}/actions/runs"
                f"?per_page=100&page={page}&status={status}"
            )
        except Exception as exc:
            print(f"⚠️  拉取 status={status} 失败: {exc}", file=sys.stderr)
            break
        runs = data.get("workflow_runs", [])
        if not runs:
            break
        for run in runs:
            created = run.get("created_at", "")
            try:
                created_dt = datetime.datetime.fromisoformat(created.replace("Z", "+00:00"))
            except ValueError:
                continue
            if created_dt < cutoff:
                targets.append((run["id"], run.get("name", "?"), run.get("conclusion", "?"), created[:10]))
        page += 1

# 按 id 去重并排序
seen = set()
for t in sorted(targets, key=lambda x: x[0]):
    if t[0] not in seen:
        seen.add(t[0])
        print(f"{t[0]} | {t[1]} | {t[2]} | {t[3]}")
PYEOF

if [ ! -s "$TMP_FILE" ]; then
  echo "✅ 没有需要清理的 workflow runs"
  rm -f "$TMP_FILE"
  exit 0
fi

echo ""
echo "📊 待清理列表:"
cat "$TMP_FILE"
echo ""

if [ "$DRY_RUN" = "1" ]; then
  echo "🔎 DRY_RUN=1：仅列出，不删除（共 $(wc -l < "$TMP_FILE") 条）"
  rm -f "$TMP_FILE"
  exit 0
fi

if [ "$CONFIRM" != "yes" ]; then
  echo "⚠️  即将删除以上 $(wc -l < "$TMP_FILE") 条 workflow runs，确认继续？(y/N)"
  read -r confirm
  if [ "$confirm" != "y" ]; then
    echo "已取消"
    rm -f "$TMP_FILE"
    exit 0
  fi
fi

# 批量删除
count=0
while read -r line; do
  id=$(echo "$line" | cut -d'|' -f1 | tr -d ' ')
  [ -z "$id" ] && continue
  response=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    "https://api.github.com/repos/$OWNER/$REPO/actions/runs/$id")
  if [ "$response" = "204" ]; then
    count=$((count + 1))
    echo "✅ 已删除 run #$id"
  else
    echo "❌ 删除 run #$id 失败 (HTTP $response)"
  fi
done < "$TMP_FILE"
rm -f "$TMP_FILE"

echo ""
echo "🎉 清理完成，共删除 $count 个 workflow runs"
