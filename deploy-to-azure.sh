#!/usr/bin/env bash

# Sync the repository to a remote host.
# Required variables: REMOTE_USER, REMOTE_HOST, SSH_KEY
# Optional variables: REMOTE_PATH (default: /home/$REMOTE_USER/thaispray), SSH_PORT

set -Eeuo pipefail

readonly APP_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
: "${REMOTE_USER:?Set REMOTE_USER before deploying}"
: "${REMOTE_HOST:?Set REMOTE_HOST before deploying}"
: "${SSH_KEY:?Set SSH_KEY to the local private key path before deploying}"
readonly REMOTE_PATH="${REMOTE_PATH:-/home/${REMOTE_USER}/thaispray}"
readonly SSH_PORT="${SSH_PORT:-22}"

cd "$APP_ROOT"

rsync -avz --progress --delete \
  -e "ssh -i ${SSH_KEY} -p ${SSH_PORT}" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='coverage' \
  --exclude='.vscode' \
  --exclude='.idea' \
  --exclude='*.log' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='uploads/*' \
  --exclude='**/uploads/*' \
  --exclude='*.swp' \
  --exclude='*.swo' \
  --exclude='.cache' \
  --exclude='tmp' \
  --exclude='temp' \
  ./ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

printf '%s\n' "Files synced to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
printf '%s\n' 'Create the production .env files on the remote host, then run ./setup-azure.sh there.'
