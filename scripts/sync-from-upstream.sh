#!/usr/bin/env bash
# sync-from-upstream.sh
# Pulls the latest skills, templates, viz, and tooling from skills-upstream.
# Leaves untouched: artefacts/, contexts/, .github/context.yml,
#                   .github/pipeline-state.json, config.yml

set -e

REMOTE="${1:-skills-upstream}"
BRANCH="${2:-master}"
DRY_RUN="${3:-}"

PATHS=(
  ".github/skills/"
  ".github/templates/"
  "dashboards/pipeline-viz.html"
  ".github/copilot-instructions.md"
  ".github/pipeline-state.schema.json"
  ".github/architecture-guardrails.md"
  ".github/pull_request_template.md"
  ".github/standards/"
  ".github/workflows/"
  "scripts/"
  "tests/"
  "skill-pipeline-instructions.md"
  "CHANGELOG.md"
)

# ── 1. Verify remote exists ───────────────────────────────────────────────────
if ! git remote | grep -q "^${REMOTE}$"; then
  echo "Error: remote '$REMOTE' not found. Add it with:"
  echo "  git remote add $REMOTE https://github.com/heymishy/skills-repo.git"
  exit 1
fi

# ── 2. Fetch ──────────────────────────────────────────────────────────────────
echo "Fetching $REMOTE/$BRANCH..."
git fetch "$REMOTE"

# ── 3. Show diff summary before applying ─────────────────────────────────────
CHANGED=$(git diff --name-only HEAD "$REMOTE/$BRANCH" -- "${PATHS[@]}")

if [ -z "$CHANGED" ]; then
  echo "Already up to date."
  exit 0
fi

echo ""
echo "Files that will change:"
echo "$CHANGED" | sed 's/^/  /'

if [ "$DRY_RUN" = "--dry-run" ]; then
  echo ""
  echo "--dry-run: no changes applied."
  exit 0
fi

# ── 4. Apply ──────────────────────────────────────────────────────────────────
echo ""
echo "Applying..."
git checkout "$REMOTE/$BRANCH" -- "${PATHS[@]}"

# ── 5. Commit ─────────────────────────────────────────────────────────────────
DATE=$(date +%Y-%m-%d)
git commit -m "chore: sync skills from skills-upstream $DATE"

echo ""
echo "Done. Skills synced from $REMOTE/$BRANCH."
