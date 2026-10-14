#!/usr/bin/env bash

# Thai Spray Shop - Development Startup Script
# Runs both independent applications (two backends and two frontends).

set -Eeuo pipefail

readonly APP_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

declare -a PIDS=()

install_dependencies() {
  local app_dir="$1"

  if [[ ! -d "${APP_ROOT}/${app_dir}/node_modules" ]]; then
    printf '%b\n' "${YELLOW}Installing dependencies for ${app_dir}...${NC}"
    (cd "${APP_ROOT}/${app_dir}" && npm install)
  fi
}

require_backend_env() {
  local app_dir="$1"

  if [[ ! -f "${APP_ROOT}/${app_dir}/.env" ]]; then
    printf '%b\n' "${YELLOW}Missing ${app_dir}/.env; copy it from .env.example and configure it first.${NC}" >&2
    return 1
  fi
}

prepare_frontend_env() {
  local app_dir="$1"

  if [[ ! -f "${APP_ROOT}/${app_dir}/.env" ]]; then
    cp "${APP_ROOT}/${app_dir}/.env.example" "${APP_ROOT}/${app_dir}/.env"
    printf '%b\n' "${YELLOW}Created ${app_dir}/.env from .env.example.${NC}"
  fi
}

start_process() {
  local app_dir="$1"
  shift

  (
    cd "${APP_ROOT}/${app_dir}"
    exec "$@"
  ) &
  PIDS+=("$!")
}

cleanup() {
  local status=$?
  trap - EXIT INT TERM

  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done

  wait "${PIDS[@]}" 2>/dev/null || true
  exit "$status"
}

trap cleanup EXIT INT TERM

printf '%b\n' "${GREEN}Starting Thai Spray Shop development environment...${NC}"

for app_dir in \
  user_ecommere/backend \
  user_ecommere/frontend \
  admin_ecommere/backend \
  admin_ecommere/frontend; do
  install_dependencies "$app_dir"
done

require_backend_env user_ecommere/backend
require_backend_env admin_ecommere/backend
prepare_frontend_env user_ecommere/frontend
prepare_frontend_env admin_ecommere/frontend

printf '%b\n' "${BLUE}User backend:  http://localhost:4000${NC}"
printf '%b\n' "${BLUE}User frontend: http://localhost:5173${NC}"
printf '%b\n' "${BLUE}Admin backend: http://localhost:4001${NC}"
printf '%b\n' "${BLUE}Admin frontend: http://localhost:5174${NC}"
printf '%b\n' "${YELLOW}Press Ctrl+C to stop all four processes.${NC}"

start_process user_ecommere/backend npm run start:dev
start_process user_ecommere/frontend npm run dev
start_process admin_ecommere/backend npm run start:dev
start_process admin_ecommere/frontend npm run dev

wait -n "${PIDS[@]}"
