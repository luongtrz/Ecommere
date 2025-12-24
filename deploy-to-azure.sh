#!/bin/bash

# Deploy Thai Spray Shop to Azure VM
# Usage: ./deploy-to-azure.sh

set -e

echo "🚀 Deploying Thai Spray Shop to Azure VM..."

# Configuration
REMOTE_USER="luongazure"
REMOTE_HOST="20.2.66.240"
REMOTE_PATH="~/shopeeThai"
SSH_KEY="C:/Users/ADMIN/.ssh/id_rsa_azure_luong"

# Files and folders to exclude
EXCLUDE_PATTERNS=(
  ".git"
  "node_modules"
  "dist"
  "build"
  ".next"
  "coverage"
  ".vscode"
  ".idea"
  "*.log"
  ".env.local"
  ".env.development.local"
  ".env.test.local"
  ".env.production.local"
  "uploads/*"
  "backend/uploads/*"
  "frontend/dist"
  "frontend/node_modules"
  "backend/node_modules"
  "backend/dist"
  ".DS_Store"
  "*.swp"
  "*.swo"
  ".cache"
  "tmp"
  "temp"
)

# Build rsync exclude flags
EXCLUDE_FLAGS=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  EXCLUDE_FLAGS="$EXCLUDE_FLAGS --exclude='$pattern'"
done

echo "📦 Syncing files to Azure VM..."
echo "   Source: $(pwd)"
echo "   Destination: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"
echo ""

# Use rsync to sync files (more efficient than scp)
rsync -avz --progress \
  -e "ssh -i $SSH_KEY -p 22" \
  --delete \
  ${EXCLUDE_FLAGS} \
  ./ \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

echo ""
echo "✅ Files synced successfully!"
echo ""
echo "📝 Next steps on Azure VM:"
echo "   1. SSH into VM: ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST"
echo "   2. cd $REMOTE_PATH"
echo "   3. Run setup: ./setup-azure.sh"
echo ""
echo "🎉 Deployment complete!"
