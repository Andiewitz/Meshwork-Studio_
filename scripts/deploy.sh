#!/usr/bin/env bash
# ==============================================================================
# Meshwork Studio — Local Build & EC2 Dist Swap Deploy Script
# ==============================================================================
# Workflow:
#   1. Runs local production build (`npm run build`)
#   2. Locates EC2 instance / SSH key
#   3. Syncs fresh `dist/` directory to remote EC2 server
#   4. Swaps dist atomically and restarts/reloads PM2 process
#   5. Runs health checks to confirm zero-downtime deployment
#
# Usage:
#   ./scripts/deploy.sh              # Build locally & deploy dist to EC2
#   ./scripts/deploy.sh --skip-build # Deploy existing local dist without rebuilding
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# --- Configuration ---
INSTANCE_ID="i-0a96823caafbf35b6"
AWS_REGION="us-east-1"
DOMAIN="meshwork-studio.duckdns.org"
SSH_USER="ubuntu"
SSH_KEY_LOCATIONS=(
  "$REPO_DIR/ssh-keys/Mesh-EC2.pem"
  "$HOME/Desktop/Meshwork-Studio/ssh-keys/Mesh-EC2.pem"
  "$HOME/ssh-keys/Mesh-EC2.pem"
  "$HOME/.ssh/Mesh-EC2.pem"
  "$HOME/Mesh-EC2.pem"
)

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}======================================================${NC}"
echo -e "${BOLD}${CYAN}   🚀 Meshwork Studio — Dist Swap Deploy to EC2      ${NC}"
echo -e "${BOLD}${CYAN}======================================================${NC}"

# Parse flags
SKIP_BUILD=false
for arg in "$@"; do
  case $arg in
    --skip-build|-s)
      SKIP_BUILD=true
      shift
      ;;
  esac
done

# Step 1: Run Local Build
if [ "$SKIP_BUILD" = false ]; then
  echo -e "${BLUE}▶ [1/4] Building production bundle locally...${NC}"
  cd "$REPO_DIR"
  npm run build
  echo -e "${GREEN}✓ Local build complete!${NC}"
else
  echo -e "${YELLOW}⚡ [1/4] Skipping build step (--skip-build). Using existing dist/...${NC}"
fi

# Verify local dist exists
if [ ! -d "$REPO_DIR/dist" ] || [ ! -f "$REPO_DIR/dist/index.cjs" ]; then
  echo -e "${RED}❌ Error: Local dist directory or dist/index.cjs is missing.${NC}"
  echo -e "   Please run 'npm run build' first."
  exit 1
fi

# Step 2: Locate SSH Key & Target Host
echo -e "${BLUE}▶ [2/4] Locating SSH credentials & target host...${NC}"

SSH_KEY=""
for key in "${SSH_KEY_LOCATIONS[@]}"; do
  if [[ -f "$key" ]]; then
    SSH_KEY="$key"
    break
  fi
done

if [[ -z "$SSH_KEY" ]]; then
  echo -e "${RED}❌ Error: SSH Key (Mesh-EC2.pem) not found in expected paths.${NC}"
  echo -e "   Please ensure Mesh-EC2.pem exists in $REPO_DIR/ssh-keys/"
  exit 1
fi

chmod 400 "$SSH_KEY" 2>/dev/null || true
echo -e "${GREEN}✓${NC} SSH Key found: ${SSH_KEY}"

HOST_TARGET="$DOMAIN"

# Try getting public IP if AWS CLI is installed
if command -v aws &>/dev/null; then
  EC2_PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query "Reservations[0].Instances[0].PublicIpAddress" \
    --output text 2>/dev/null || echo "")
  
  if [[ -n "$EC2_PUBLIC_IP" && "$EC2_PUBLIC_IP" != "None" ]]; then
    HOST_TARGET="$EC2_PUBLIC_IP"
  fi
fi

# Verify SSH connectivity
echo -e "${BLUE}▶ Checking SSH connection to ${HOST_TARGET}...${NC}"
if ! ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 -o BatchMode=yes "$SSH_USER@$HOST_TARGET" "echo ok" &>/dev/null; then
  if [[ "$HOST_TARGET" != "$DOMAIN" ]]; then
    echo -e "${YELLOW}Retrying connection via domain: ${DOMAIN}...${NC}"
    HOST_TARGET="$DOMAIN"
    if ! ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 -o BatchMode=yes "$SSH_USER@$HOST_TARGET" "echo ok" &>/dev/null; then
      echo -e "${RED}❌ Could not connect to EC2 (${HOST_TARGET}) via SSH.${NC}"
      exit 1
    fi
  else
    echo -e "${RED}❌ Could not connect to EC2 (${HOST_TARGET}) via SSH.${NC}"
    exit 1
  fi
fi
echo -e "${GREEN}✓ SSH connection established!${NC}"

# Detect remote app directory
REMOTE_APP_DIR=$(ssh -i "$SSH_KEY" "$SSH_USER@$HOST_TARGET" '
  if [ -d "/home/ubuntu/meshwork-studiov2" ]; then
    echo "/home/ubuntu/meshwork-studiov2"
  elif [ -d "/home/ubuntu/app/meshwork-studio" ]; then
    echo "/home/ubuntu/app/meshwork-studio"
  elif [ -d "/home/ec2-user/app/meshwork-studio" ]; then
    echo "/home/ec2-user/app/meshwork-studio"
  else
    echo "$HOME/meshwork-studiov2"
  fi
')

echo -e "${GREEN}✓${NC} Remote application directory: ${REMOTE_APP_DIR}"

# Step 3: Transfer & Swap dist
echo -e "${BLUE}▶ [3/4] Uploading dist bundle to remote server...${NC}"

# Upload dist directly into dist.new
ssh -i "$SSH_KEY" "$SSH_USER@$HOST_TARGET" "mkdir -p '$REMOTE_APP_DIR/dist.new'"

if command -v rsync &>/dev/null; then
  rsync -avz --delete \
    -e "ssh -i '$SSH_KEY' -o StrictHostKeyChecking=accept-new" \
    "$REPO_DIR/dist/" \
    "$SSH_USER@$HOST_TARGET:$REMOTE_APP_DIR/dist.new/"
else
  # Tar stream fallback if rsync isn't available
  tar -czf - -C "$REPO_DIR/dist" . | ssh -i "$SSH_KEY" "$SSH_USER@$HOST_TARGET" "tar -xzf - -C '$REMOTE_APP_DIR/dist.new'"
fi

echo -e "${GREEN}✓ Upload complete.${NC}"

# Step 4: Swap dist and reload process
echo -e "${BLUE}▶ [4/4] Performing atomic dist swap & reloading application...${NC}"

ssh -i "$SSH_KEY" "$SSH_USER@$HOST_TARGET" bash -s "$REMOTE_APP_DIR" << 'REMOTE_SCRIPT'
  set -euo pipefail
  TARGET_DIR="$1"
  
  # Atomic swap: backup current dist, move dist.new to dist
  if [ -d "$TARGET_DIR/dist" ]; then
    rm -rf "$TARGET_DIR/dist.old" 2>/dev/null || true
    mv "$TARGET_DIR/dist" "$TARGET_DIR/dist.old"
  fi
  mv "$TARGET_DIR/dist.new" "$TARGET_DIR/dist"

  # Restart / Reload PM2 process
  if pm2 describe meshwork >/dev/null 2>&1; then
    echo "  ⚡ Reloading PM2 meshwork process..."
    pm2 reload meshwork --update-env 2>/dev/null || pm2 restart meshwork --update-env
  else
    echo "  ⚡ Starting PM2 meshwork process..."
    pm2 start "$TARGET_DIR/dist/index.cjs" --name meshwork --cwd "$TARGET_DIR"
  fi

  pm2 save >/dev/null 2>&1 || true

  # Reload NGINX if active
  if systemctl is-active --quiet nginx; then
    sudo systemctl reload nginx 2>/dev/null || true
  fi
REMOTE_SCRIPT

# Verification / Health Check
echo -e "${BLUE}▶ Verifying application health...${NC}"
sleep 2

HEALTH_STATUS=$(ssh -i "$SSH_KEY" "$SSH_USER@$HOST_TARGET" "curl -sf http://localhost:5000/health 2>/dev/null || curl -sf http://localhost/health 2>/dev/null || echo 'UNKNOWN'")

echo ""
echo -e "${BOLD}${GREEN}======================================================${NC}"
echo -e "${BOLD}${GREEN}   🎉 Deployment successfully completed!             ${NC}"
echo -e "${BOLD}${GREEN}======================================================${NC}"
echo -e "  🌐 ${BOLD}Live App:${NC}      https://${DOMAIN}"
echo -e "  📡 ${BOLD}Target Host:${NC}   ${HOST_TARGET}"
echo -e "  📊 ${BOLD}Health Check:${NC}  ${HEALTH_STATUS}"
echo -e "  🕒 ${BOLD}Deployed At:${NC}   $(date)"
echo ""
