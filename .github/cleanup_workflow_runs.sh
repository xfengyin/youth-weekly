#!/bin/bash
# 批量删除 GitHub Actions workflow runs
# 使用方法: 
#   1. 生成 Personal Access Token (Fine-grained)，授予 Actions write 权限
#   2. 运行: GITHUB_TOKEN=your_token bash .github/cleanup_workflow_runs.sh
#
# 或者直接在浏览器操作:
#   https://github.com/xfengyin/youth-weekly/actions → 搜索 status:failure → 全选删除

OWNER="xfengyin"
REPO="youth-weekly"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ 请设置 GITHUB_TOKEN 环境变量"
  echo ""
  echo "📋 步骤:"
  echo "1. 前往 https://github.com/settings/tokens/new?type=fine_grained"
  echo "2. 选择 Repository: xfengyin/youth-weekly"
  echo "3. 权限: Actions → Read and write"
  echo "4. 复制 token 后运行:"
  echo "   GITHUB_TOKEN=ghp_xxx bash .github/cleanup_workflow_runs.sh"
  echo ""
  echo "💡 或者直接在网页操作: https://github.com/$OWNER/$REPO/actions"
  exit 1
fi

echo "🔍 正在获取 workflow runs..."

# 获取所有失败和取消的 run IDs
IDS=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/actions/runs?per_page=100&status=failed" | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
for run in data.get('workflow_runs', []):
    print(f\"{run['id']} | {run['name']} | {run['conclusion']} | {run['created_at'][:10]}\")
" 2>/dev/null)

if [ -z "$IDS" ]; then
  echo "✅ 没有需要清理的 workflow runs"
  exit 0
fi

echo ""
echo "📊 待清理列表:"
echo "$IDS"
echo ""
echo "⚠️  即将删除以上所有 workflow runs，确认继续？(y/N)"
read -r confirm
if [ "$confirm" != "y" ]; then
  echo "已取消"
  exit 0
fi

# 获取 run IDs
RUN_IDS=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/actions/runs?per_page=100&status=failed" | \
  python3 -c "import json,sys; [print(r['id']) for r in json.load(sys.stdin).get('workflow_runs',[])]")

# 批量删除
count=0
for id in $RUN_IDS; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    "https://api.github.com/repos/$OWNER/$REPO/actions/runs/$id")
  
  if [ "$response" = "204" ]; then
    count=$((count + 1))
    echo "✅ 已删除 run #$id"
  else
    echo "❌ 删除 run #$id 失败 (HTTP $response)"
  fi
done

echo ""
echo "🎉 清理完成，共删除 $count 个 workflow runs"
