#!/usr/bin/env bash

# Check that the agent core and Prisma schemas are identical across backends.

set -euo pipefail

readonly REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

readonly CORE_FILES=(
  tools/tool.types.ts
  tools/tool.registry.ts
  tools/tool-result.util.ts
  tools/tool.registry.spec.ts
  agent/confirm-policy.ts
  agent/confirm-policy.spec.ts
  agent/prompts/system.prompt.ts
  agent/prompts/system.prompt.spec.ts
  agent/agent.config.ts
  agent/agent.config.spec.ts
  agent/llm.factory.ts
  agent/checkpointer.provider.ts
  agent/checkpointer.provider.spec.ts
  agent/history.ts
  agent/history.spec.ts
  agent/sse.frames.ts
  agent/sse.frames.spec.ts
  agent/thread.service.ts
  agent/thread.service.spec.ts
  agent/audit.service.ts
  agent/audit.service.spec.ts
  agent/agent.nodes.ts
  agent/agent.graph.ts
  agent/agent.graph.spec.ts
  agent/agent.runner.ts
  agent/agent.runner.spec.ts
  dtos/agent-client-context.dto.ts
  dtos/agent-message.dto.ts
  dtos/agent-resume.dto.ts
  dtos/agent-thread-query.dto.ts
)

readonly USER_CORE_DIR="${REPO_ROOT}/user_ecommere/backend/src/chatbot"
readonly ADMIN_CORE_DIR="${REPO_ROOT}/admin_ecommere/backend/src/chatbot"
readonly USER_SCHEMA="${REPO_ROOT}/user_ecommere/backend/prisma/schema.prisma"
readonly ADMIN_SCHEMA="${REPO_ROOT}/admin_ecommere/backend/prisma/schema.prisma"

has_mismatch=0

for entry in "${CORE_FILES[@]}"; do
  user_file="${USER_CORE_DIR}/${entry}"
  admin_file="${ADMIN_CORE_DIR}/${entry}"

  if [[ ! -f "$user_file" || ! -f "$admin_file" ]]; then
    printf 'MISSING: %s\n' "$entry"
    has_mismatch=1
  elif ! cmp -s "$user_file" "$admin_file"; then
    printf 'DRIFT: %s\n' "$entry"
    has_mismatch=1
  fi
done

if [[ ! -f "$USER_SCHEMA" || ! -f "$ADMIN_SCHEMA" ]]; then
  printf 'MISSING: prisma/schema.prisma\n'
  has_mismatch=1
elif ! cmp -s "$USER_SCHEMA" "$ADMIN_SCHEMA"; then
  printf 'DRIFT: prisma/schema.prisma\n'
  has_mismatch=1
fi

if [[ "$has_mismatch" -eq 0 ]]; then
  printf '%s\n' 'agent core in sync'
  exit 0
fi

exit 1
