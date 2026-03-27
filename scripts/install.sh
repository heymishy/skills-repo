#!/usr/bin/env bash
# =============================================================================
# install.sh — Skills Pipeline Installer
# =============================================================================
# Installs the heymishy/skills-repo SDLC pipeline into a target repository.
#
# Usage (from inside your target repo):
#   curl -fsSL https://raw.githubusercontent.com/heymishy/skills-repo/master/scripts/install.sh | bash
#
#   Or clone-then-run:
#   git clone https://github.com/heymishy/skills-repo /tmp/skills-repo
#   bash /tmp/skills-repo/scripts/install.sh [--target /path/to/your-repo] [--profile work]
#
# Options:
#   --target <path>             Target repo root (default: current working directory)
#   --profile <name>            Context profile to activate: personal | work (default: personal)
#   --overwrite                 Overwrite existing files (default: skip existing)
#   --dry-run                   Show what would be copied without writing anything
#   --upstream-strategy <mode>  none | remote | fork (default: none)
#                                 none   — one-time install, no remote added
#                                 remote — add heymishy/skills-repo as skills-upstream remote
#                                 fork   — add a private fork (requires --upstream-url)
#   --upstream-url <url>        Fork URL when using --upstream-strategy fork
# =============================================================================

set -euo pipefail

# ── Defaults ─────────────────────────────────────────────────────────────────
SKILLS_REPO_OWNER="heymishy"
SKILLS_REPO_NAME="skills-repo"
SKILLS_REPO_BRANCH="master"
BASE_URL="https://raw.githubusercontent.com/${SKILLS_REPO_OWNER}/${SKILLS_REPO_NAME}/${SKILLS_REPO_BRANCH}"

TARGET_DIR="$(pwd)"
PROFILE="personal"
OVERWRITE=false
DRY_RUN=false
UPSTREAM_STRATEGY="none"
UPSTREAM_URL=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$(dirname "$SCRIPT_DIR")"  # parent of scripts/ = repo root

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()    { echo -e "${CYAN}[install]${RESET} $*"; }
success() { echo -e "${GREEN}[✓]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[!]${RESET} $*"; }
error()   { echo -e "${RED}[✗]${RESET} $*" >&2; }

# ── Argument parsing ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)   TARGET_DIR="$2"; shift 2 ;;
    --profile)  PROFILE="$2"; shift 2 ;;
    --overwrite) OVERWRITE=true; shift ;;
    --dry-run)  DRY_RUN=true; shift ;;
    --upstream-strategy) UPSTREAM_STRATEGY="$2"; shift 2 ;;
    --upstream-url)      UPSTREAM_URL="$2"; shift 2 ;;
    *) error "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Resolve source ─────────────────────────────────────────────────────────────
# If this script is running from inside the skills repo itself, use local files.
# Otherwise, curl from GitHub.
if [[ -d "$SOURCE_ROOT/.github/skills" ]]; then
  USE_LOCAL=true
  info "Using local skills-repo at: $SOURCE_ROOT"
else
  USE_LOCAL=false
  info "Downloading from github.com/${SKILLS_REPO_OWNER}/${SKILLS_REPO_NAME}@${SKILLS_REPO_BRANCH}"
  # Require curl
  if ! command -v curl &>/dev/null; then
    error "curl is required but not installed."
    exit 1
  fi
fi

# ── Copy helper ────────────────────────────────────────────────────────────────
copy_file() {
  local src_rel="$1"   # relative path in skills repo
  local dst_abs="$2"   # absolute destination path
  local dst_dir
  dst_dir="$(dirname "$dst_abs")"

  if [[ "$DRY_RUN" == true ]]; then
    echo "  DRY-RUN: $src_rel → ${dst_abs#"$TARGET_DIR/"}"
    return
  fi

  if [[ -f "$dst_abs" && "$OVERWRITE" == false ]]; then
    warn "Skipping (exists): ${dst_abs#"$TARGET_DIR/"}"
    return
  fi

  mkdir -p "$dst_dir"

  if [[ "$USE_LOCAL" == true ]]; then
    cp "$SOURCE_ROOT/$src_rel" "$dst_abs"
  else
    curl -fsSL "${BASE_URL}/${src_rel}" -o "$dst_abs"
  fi

  success "Copied: ${dst_abs#"$TARGET_DIR/"}"
}

# ── Check target ───────────────────────────────────────────────────────────────
if [[ ! -d "$TARGET_DIR" ]]; then
  error "Target directory does not exist: $TARGET_DIR"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Skills Pipeline Installer"
echo "  Target : $TARGET_DIR"
echo "  Profile: $PROFILE"
echo "  Mode   : $([ "$DRY_RUN" == true ] && echo 'DRY RUN' || echo 'INSTALL')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ -d "$TARGET_DIR/.github/skills" && "$OVERWRITE" == false ]]; then
  warn ".github/skills/ already exists in target repo."
  warn "Existing files will be skipped. Use --overwrite to replace them."
  echo ""
fi

# ── Step 1: Core .github files ─────────────────────────────────────────────────
info "Step 1/5: Core pipeline files"

copy_file ".github/copilot-instructions.md"    "$TARGET_DIR/.github/copilot-instructions.md"
copy_file ".github/pull_request_template.md"   "$TARGET_DIR/.github/pull_request_template.md"
copy_file ".github/architecture-guardrails.md" "$TARGET_DIR/.github/architecture-guardrails.md"
copy_file ".github/pipeline-state.json"        "$TARGET_DIR/.github/pipeline-state.json"
copy_file ".github/pipeline-state.schema.json" "$TARGET_DIR/.github/pipeline-state.schema.json"
copy_file ".github/pipeline-viz.html"          "$TARGET_DIR/.github/pipeline-viz.html"

# ── Step 2: Context profiles ───────────────────────────────────────────────────
info "Step 2/5: Context profiles"

copy_file "contexts/personal.yml" "$TARGET_DIR/contexts/personal.yml"
copy_file "contexts/work.yml"     "$TARGET_DIR/contexts/work.yml"

# Activate the chosen profile
if [[ "$DRY_RUN" == false ]]; then
  cp "$TARGET_DIR/contexts/${PROFILE}.yml" "$TARGET_DIR/.github/context.yml"
  success "Activated context profile: $PROFILE → .github/context.yml"
fi

# ── Step 3: Skills ─────────────────────────────────────────────────────────────
info "Step 3/5: Skill files"

SKILLS=(
  benefit-metric bootstrap branch-complete branch-setup clarify
  coverage-map decisions definition definition-of-done definition-of-ready
  discovery ea-registry ideate implementation-plan implementation-review
  levelup loop-design metric-review org-mapping programme
  record-signal release reverse-engineer review scale-pipeline
  spike subagent-execution systematic-debugging tdd test-plan
  token-optimization trace verify-completion workflow
)

for skill in "${SKILLS[@]}"; do
  skill_file=".github/skills/${skill}/SKILL.md"
  copy_file "$skill_file" "$TARGET_DIR/$skill_file"
done

# ── Step 4: Templates ─────────────────────────────────────────────────────────
info "Step 4/5: Templates"

TEMPLATES=(
  ac-verification-script.md architecture-guardrails.md benefit-metric.md
  change-request.md compliance-bundle.md consumer-registry.md coverage-map.md
  decision-log.md definition-of-done.md definition-of-ready-checklist.md
  deployment-checklist.md discovery.md epic.md ideation.md
  implementation-plan.md implementation-review.md loop-design.md
  metric-review.md migration-story.md nfr-profile.md org-mapping.md
  programme.md reference-index.md release-notes-plain.md
  release-notes-technical.md reverse-engineering-report.md review-report.md
  scale-pipeline.md spike-outcome.md spike-output.md story.md test-plan.md
  token-optimization.md trace-report.md vendor-qa-tracker.md verify-completion.md
)

for tmpl in "${TEMPLATES[@]}"; do
  copy_file ".github/templates/${tmpl}" "$TARGET_DIR/.github/templates/${tmpl}"
done

# ── Step 5: Optional extras ────────────────────────────────────────────────────
info "Step 5/5: Optional extras"

# artefacts placeholder
if [[ "$DRY_RUN" == false ]]; then
  mkdir -p "$TARGET_DIR/artefacts"
  touch "$TARGET_DIR/artefacts/.gitkeep"
  success "Created: artefacts/.gitkeep"
fi

# standards scaffold
copy_file ".github/standards/index.yml" "$TARGET_DIR/.github/standards/index.yml"

# product context scaffold
copy_file ".github/product/mission.md"    "$TARGET_DIR/.github/product/mission.md"
copy_file ".github/product/roadmap.md"    "$TARGET_DIR/.github/product/roadmap.md"
copy_file ".github/product/tech-stack.md" "$TARGET_DIR/.github/product/tech-stack.md"
copy_file ".github/product/constraints.md" "$TARGET_DIR/.github/product/constraints.md"

copy_file "config.yml" "$TARGET_DIR/config.yml"

# GitHub Actions CI integration — only if target repo uses github-actions
CONTEXT_YML="$TARGET_DIR/.github/context.yml"
if [[ -f "$CONTEXT_YML" ]] && grep -qE '^\s+ci:\s+github-actions' "$CONTEXT_YML" 2>/dev/null; then
  info "GitHub Actions CI detected — copying trace-validation workflow"
  copy_file ".github/workflows/trace-validation.yml" "$TARGET_DIR/.github/workflows/trace-validation.yml"
elif [[ "$DRY_RUN" == false ]]; then
  DETECTED_CI=$(grep -oP '(?<=^\s{2}ci:\s)\S+' "$CONTEXT_YML" 2>/dev/null || echo "none")
  warn "CI platform is '${DETECTED_CI}' — skipping GitHub Actions workflow."
  warn "See .github/skills/trace/SKILL.md CI usage section for your platform's integration snippet."
fi

# ── Placeholder prompts ───────────────────────────────────────────────────────
if [[ "$DRY_RUN" == false ]]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Two required placeholders need filling:"
  echo ""

  read -r -p "  1. Product context (one sentence — what does this repo build?): " PRODUCT_CONTEXT
  read -r -p "  2. Coding standards (language + test framework, e.g. TypeScript + Vitest): " CODING_STANDARDS

  # Substitute into copilot-instructions.md
  INSTR_FILE="$TARGET_DIR/.github/copilot-instructions.md"
  if [[ -f "$INSTR_FILE" ]]; then
    # Replace the first [FILL IN BEFORE COMMITTING] with product context
    # and the second with coding standards (using awk for reliable multi-line replace)
    python3 - <<PYEOF
import re, sys

with open('$INSTR_FILE', 'r') as f:
    content = f.read()

replacements = [
    ('$PRODUCT_CONTEXT', '$CODING_STANDARDS')
]

count = 0
def replace_nth(m):
    global count
    count += 1
    return replacements[0][count - 1] if count <= len(replacements[0]) else m.group(0)

# Replace first two occurrences of the placeholder
result = re.sub(r'\[FILL IN BEFORE COMMITTING\]', replace_nth, content, count=2)

with open('$INSTR_FILE', 'w') as f:
    f.write(result)

print("  Placeholders substituted in copilot-instructions.md")
PYEOF
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  success "Install complete."
  echo ""
  echo "  Next steps:"
  echo "    1. Review .github/product/ and fill in your product context"
  echo "    2. Review .github/standards/ and add your coding standards"
  echo "    3. Open pipeline-viz.html in VS Code Live Preview"
  echo "    4. Run /workflow in GitHub Copilot to start your first feature"
  echo ""
fi

# ── Upstream remote setup ─────────────────────────────────────────────────────
if [[ "$DRY_RUN" == false && "$UPSTREAM_STRATEGY" != "none" ]]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  info "Setting up skills-upstream remote (strategy: $UPSTREAM_STRATEGY)"

  if [[ "$UPSTREAM_STRATEGY" == "remote" ]]; then
    REMOTE_URL="https://github.com/${SKILLS_REPO_OWNER}/${SKILLS_REPO_NAME}.git"
  elif [[ "$UPSTREAM_STRATEGY" == "fork" ]]; then
    if [[ -z "$UPSTREAM_URL" ]]; then
      read -r -p "  Fork URL (e.g. https://github.com/your-org/sdlc-skills.git): " UPSTREAM_URL
    fi
    REMOTE_URL="$UPSTREAM_URL"
  fi

  pushd "$TARGET_DIR" > /dev/null
  if git remote get-url skills-upstream &>/dev/null; then
    warn "'skills-upstream' remote already exists — updating URL"
    git remote set-url skills-upstream "$REMOTE_URL"
  else
    git remote add skills-upstream "$REMOTE_URL"
  fi
  git fetch skills-upstream --quiet
  success "'skills-upstream' remote added: $REMOTE_URL"
  popd > /dev/null

  # Append skills_upstream block to context.yml
  CONTEXT_YML="$TARGET_DIR/.github/context.yml"
  if [[ -f "$CONTEXT_YML" ]]; then
    FORK_OF_LINE=""
    if [[ "$UPSTREAM_STRATEGY" == "fork" ]]; then
      FORK_OF_LINE="\n  fork_of: https://github.com/${SKILLS_REPO_OWNER}/${SKILLS_REPO_NAME}.git"
    fi
    printf "\nskills_upstream:\n  remote: skills-upstream\n  repo: %s\n  sync_paths:\n    - .github/skills/\n    - .github/templates/\n    - scripts/\n  strategy: manual%s\n" \
      "$REMOTE_URL" "$FORK_OF_LINE" >> "$CONTEXT_YML"
    success "skills_upstream block written to context.yml"
  fi

  echo ""
  echo "  To pull future skills updates:"
  echo "    git fetch skills-upstream"
  echo "    git checkout skills-upstream/master -- .github/skills/ .github/templates/ scripts/"
  echo "    git diff --staged   # review changes"
  echo "    git commit -m \"chore: sync skills from skills-upstream [date]\""
  echo ""
fi
