#!/usr/bin/env bash
# Deploy the ChessV2 client to the aaPanel server (chessv2.com).
# Host/user/path live in the git-ignored .deploy.env (see .deploy.env.example).
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .deploy.env ]; then
  # shellcheck disable=SC1091
  source .deploy.env
fi
DEPLOY_HOST="${DEPLOY_HOST:?set DEPLOY_HOST in .deploy.env}"
DEPLOY_PATH="${DEPLOY_PATH:?set DEPLOY_PATH in .deploy.env}"

echo "Building client..."
(cd client && npm run build)

echo "Deploying to ${DEPLOY_HOST}:${DEPLOY_PATH} ..."
# --delete keeps the web root clean of stale hashed assets; never touch
# dotfiles (.htaccess/.user.ini/.well-known belong to the panel).
rsync -az --delete \
  --exclude='.htaccess' --exclude='.user.ini' --exclude='.well-known' \
  client/dist/ "$DEPLOY_HOST:$DEPLOY_PATH/"

# .user.ini is chattr +i (panel-owned) — chown everything else
ssh "$DEPLOY_HOST" "find '$DEPLOY_PATH' -name .user.ini -prune -o -exec chown www:www {} + 2>/dev/null || true"
echo "Deployed. Verify at https://chessv2.com"
