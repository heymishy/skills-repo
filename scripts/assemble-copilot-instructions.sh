#!/usr/bin/env bash
# =============================================================================
# assemble-copilot-instructions.sh — Skills Distribution Assembly Script
# =============================================================================
# Produces a three-layer copilot-instructions.md for a consuming squad repo.
#
# Distribution model: PULL
# Squad engineers run this script locally to generate or refresh their
# copilot-instructions.md from a versioned skills-repo reference.
# No CI scheduler required. No squad merge action required.
#
# Decision: 2026-04-10 | ARCH | p1.1 distribution model — pull model chosen
# See: artefacts/2026-04-09-skills-platform-phase1/decisions.md
#
# Usage:
#   bash scripts/assemble-copilot-instructions.sh [options]
#
# Options:
#   --skills-repo-path <path>  Path to local skills-repo clone
#                              (default: current directory if it is the skills-repo,
#                               otherwise detected from skills-upstream git remote)
#   --ref <ref>                Git ref (commit hash or tag) to record as platform
#                              version in the composition header.
#                              (default: HEAD commit hash of skills-repo-path)
#   --domain-layer <path>      Optional: path to domain-layer copilot-instructions.md
#                              If omitted, the domain layer is marked [absent].
#   --squad-layer <path>       Optional: path to squad-layer copilot-instructions.md
#                              If omitted, the squad layer is marked [absent].
#   --output <path>            Output file path.
#                              (default: .github/copilot-instructions.md)
#   --dry-run                  Print the assembled content to stdout; do not write file.
#
# Layer composition order (fixed):
#   1. core-platform  — from skills-repo at <ref>
#   2. domain         — from --domain-layer file, or [absent]
#   3. squad          — from --squad-layer file, or [absent]
#
# Security: this script never reads or writes credential values.
#           context.yml references credential names only (product constraint #12).
# =============================================================================

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
SKILLS_REPO_PATH=""
REF=""
DOMAIN_LAYER=""
SQUAD_LAYER=""
OUTPUT=".github/copilot-instructions.md"
DRY_RUN=false

# ── Colour helpers ─────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()    { echo -e "${CYAN}[assemble]${RESET} $*"; }
success() { echo -e "${GREEN}[✓]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[!]${RESET} $*"; }
error()   { echo -e "${RED}[✗]${RESET} $*" >&2; }

# ── Argument parsing ───────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skills-repo-path) SKILLS_REPO_PATH="$2"; shift 2 ;;
    --ref)              REF="$2"; shift 2 ;;
    --domain-layer)     DOMAIN_LAYER="$2"; shift 2 ;;
    --squad-layer)      SQUAD_LAYER="$2"; shift 2 ;;
    --output)           OUTPUT="$2"; shift 2 ;;
    --dry-run)          DRY_RUN=true; shift ;;
    *) error "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Resolve skills-repo path ───────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -z "$SKILLS_REPO_PATH" ]]; then
  # If running from inside the skills-repo itself, use the repo root
  if [[ -d "$REPO_ROOT/.github/skills" ]]; then
    SKILLS_REPO_PATH="$REPO_ROOT"
  else
    error "Could not detect skills-repo path. Use --skills-repo-path <path>."
    error "Example: bash scripts/assemble-copilot-instructions.sh --skills-repo-path /path/to/skills-repo"
    exit 1
  fi
fi

SKILLS_DIR="$SKILLS_REPO_PATH/.github/skills"
if [[ ! -d "$SKILLS_DIR" ]]; then
  error "Skills directory not found: $SKILLS_DIR"
  exit 1
fi

# ── Resolve platform version reference ────────────────────────────────────────
if [[ -z "$REF" ]]; then
  if command -v git &>/dev/null && [[ -d "$SKILLS_REPO_PATH/.git" ]]; then
    REF="$(git -C "$SKILLS_REPO_PATH" rev-parse HEAD 2>/dev/null || echo "unknown")"
  else
    REF="unknown"
  fi
fi

ASSEMBLED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u)"

# ── Progressive disclosure skill lists ────────────────────────────────────────
OUTER_LOOP_SKILLS=(
  "discovery"
  "benefit-metric"
  "definition"
  "review"
  "test-plan"
  "definition-of-ready"
  "workflow"
  "decisions"
)

INNER_LOOP_SKILLS=(
  "tdd"
  "implementation-plan"
  "subagent-execution"
  "verify-completion"
  "branch-setup"
  "branch-complete"
)

# ── Helper: get skill description from SKILL.md frontmatter ───────────────────
get_skill_description() {
  local skill_file="$1"
  if [[ ! -f "$skill_file" ]]; then
    echo "(skill file not found)"
    return
  fi
  # Extract the description field from YAML frontmatter
  awk '/^description:/{found=1; gsub(/^description: *>? */,""); print; next}
       found && /^  /{gsub(/^  /,""); printf " %s", $0; next}
       found{exit}' "$skill_file" | sed 's/^ //'
}

# ── Helper: get skill triggers from SKILL.md frontmatter ──────────────────────
get_skill_triggers() {
  local skill_file="$1"
  if [[ ! -f "$skill_file" ]]; then
    return
  fi
  awk '/^triggers:/{found=1; next}
       found && /^  - /{gsub(/^  - "/,""); gsub(/"$/,""); printf "    - %s\n", $0; next}
       found && /^[a-z]/{exit}' "$skill_file"
}

# ── Build composition header ───────────────────────────────────────────────────
DOMAIN_LABEL="[absent]"
if [[ -n "$DOMAIN_LAYER" ]]; then
  DOMAIN_LABEL="$DOMAIN_LAYER"
fi

SQUAD_LABEL="[absent]"
if [[ -n "$SQUAD_LAYER" ]]; then
  SQUAD_LABEL="$SQUAD_LAYER"
fi

SKILLS_REPO_URL=""
if command -v git &>/dev/null && [[ -d "$SKILLS_REPO_PATH/.git" ]]; then
  SKILLS_REPO_URL="$(git -C "$SKILLS_REPO_PATH" remote get-url origin 2>/dev/null || echo "heymishy/skills-repo")"
fi
if [[ -z "$SKILLS_REPO_URL" ]]; then
  SKILLS_REPO_URL="heymishy/skills-repo"
fi

# ── Assemble the output ────────────────────────────────────────────────────────
assemble() {
  # ── Composition header ──────────────────────────────────────────────────────
  cat <<HEADER
<!-- ASSEMBLED COPILOT INSTRUCTIONS
  assembled-at:         ${ASSEMBLED_AT}
  platform-version:     ${REF}
  distribution-model:   pull

  Layer composition (in order):
    1. core-platform    ${SKILLS_REPO_URL}@${REF}
    2. domain           ${DOMAIN_LABEL}
    3. squad            ${SQUAD_LABEL}

  To regenerate: bash scripts/assemble-copilot-instructions.sh
  Reference: artefacts/2026-04-09-skills-platform-phase1/decisions.md
-->

HEADER

  # ── Progressive disclosure section ─────────────────────────────────────────
  cat <<'DISCLOSURE'
# Copilot Instructions

## Progressive Skill Disclosure

Skills are loaded in two phases to keep the session-start context within the
token budget (≤ 8,000 tokens). Outer loop skills are available immediately.
Inner loop skills are available on demand via `/load [skill-name]`.

### Outer loop — loaded at session start

DISCLOSURE

  for skill in "${OUTER_LOOP_SKILLS[@]}"; do
    local skill_file="$SKILLS_DIR/$skill/SKILL.md"
    local desc
    desc="$(get_skill_description "$skill_file")"
    echo "- **/$skill** — $desc"
  done

  echo ""
  cat <<'DEFERRED'

### Inner loop — deferred (available on demand)

Use `/load [skill-name]` to add any of the following to your current session.
The skill loads from the versioned platform reference in the composition header
above. No session restart required.

DEFERRED

  for skill in "${INNER_LOOP_SKILLS[@]}"; do
    echo "- $skill"
  done

  cat <<'LOAD_HANDLER'

### `/load` handler

When you see `/load [skill-name]` in a user message:
1. Identify the skill name from the list above (or any core platform skill).
2. Read the skill instructions from the platform version recorded in the
   composition header at the top of this file.
3. Apply the skill for the remainder of this session without restart.
4. Confirm: "Loaded: /[skill-name] — available for this session."

If the skill is not in the inner loop list above, check whether it is a valid
core platform skill name. If unrecognised, respond: "Unknown skill: [name]."

LOAD_HANDLER

  # ── Core platform layer ─────────────────────────────────────────────────────
  cat <<'CORE_HEADER'
---

## Core Platform Layer

*Source: core-platform — see composition header for version reference.*

The following outer loop skills are active at session start.
Use `/load [skill-name]` for any skill (including inner loop) to get full instructions.

CORE_HEADER

  for skill in "${OUTER_LOOP_SKILLS[@]}"; do
    local skill_file="$SKILLS_DIR/$skill/SKILL.md"
    if [[ -f "$skill_file" ]]; then
      local desc
      desc="$(get_skill_description "$skill_file")"
      local triggers
      triggers="$(get_skill_triggers "$skill_file")"
      echo "#### /$skill"
      echo ""
      echo "$desc" | sed 's/^ //'
      if [[ -n "$triggers" ]]; then
        echo ""
        echo "Triggers: $(get_skill_triggers "$skill_file" | tr '\n' ',' | sed 's/, *$//' | sed 's/^    - //g' | sed 's/    - /, /g')"
      fi
      echo ""
    else
      warn "Skill file not found: $skill_file"
    fi
  done

  # ── Domain layer ────────────────────────────────────────────────────────────
  cat <<'DOMAIN_HEADER'
## Domain Layer

DOMAIN_HEADER

  if [[ -n "$DOMAIN_LAYER" && -f "$DOMAIN_LAYER" ]]; then
    echo "*Source: domain — $DOMAIN_LAYER*"
    echo ""
    cat "$DOMAIN_LAYER"
    echo ""
  else
    echo "*[absent — no domain layer configured]*"
    echo ""
    echo "To add a domain layer:"
    echo "\`\`\`bash"
    echo "bash scripts/assemble-copilot-instructions.sh --domain-layer path/to/domain-instructions.md"
    echo "\`\`\`"
    echo ""
  fi

  echo "---"
  echo ""

  # ── Squad layer ─────────────────────────────────────────────────────────────
  cat <<'SQUAD_HEADER'
## Squad Layer

SQUAD_HEADER

  if [[ -n "$SQUAD_LAYER" && -f "$SQUAD_LAYER" ]]; then
    echo "*Source: squad — $SQUAD_LAYER*"
    echo ""
    cat "$SQUAD_LAYER"
    echo ""
  else
    echo "*[absent — no squad layer configured]*"
    echo ""
    echo "To add a squad layer:"
    echo "\`\`\`bash"
    echo "bash scripts/assemble-copilot-instructions.sh --squad-layer path/to/squad-instructions.md"
    echo "\`\`\`"
    echo ""
  fi
}

# ── Run ────────────────────────────────────────────────────────────────────────
info "Assembling copilot-instructions.md"
info "Platform version: $REF"
info "Skills repo: $SKILLS_REPO_PATH"
info "Domain layer: ${DOMAIN_LAYER:-[absent]}"
info "Squad layer:  ${SQUAD_LAYER:-[absent]}"
info "Output:       ${OUTPUT}"

if [[ "$DRY_RUN" == true ]]; then
  assemble
else
  OUTPUT_DIR="$(dirname "$OUTPUT")"
  mkdir -p "$OUTPUT_DIR"
  assemble > "$OUTPUT"
  success "Assembled: $OUTPUT"
  success "Platform version recorded: $REF"
  success "Distribution model: pull (regenerate any time by re-running this script)"
fi
