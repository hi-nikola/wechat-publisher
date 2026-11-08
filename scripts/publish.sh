#!/usr/bin/env bash
set -euo pipefail
skill_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$skill_dir/scripts/publish.mjs" "$@"
