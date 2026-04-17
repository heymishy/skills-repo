#!/usr/bin/env bash
# validate-trace.sh
# Validates the traceability chain across all artefacts and pipeline-state.json
# 
# Usage:
#   bash scripts/validate-trace.sh            # interactive output
#   bash scripts/validate-trace.sh --ci       # machine-readable JSON report + exit code
#   bash scripts/validate-trace.sh --check discovery_exists  # run single check
#
# Exit codes:
#   0 = all hard-fail checks passed (warnings may exist)
#   1 = one or more hard-fail checks failed

set -euo pipefail

# ── Setup ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ARTEFACTS="$REPO_ROOT/artefacts"
GITHUB_DIR="$REPO_ROOT/.github"
STATE_FILE="$GITHUB_DIR/pipeline-state.json"
SCHEMA_FILE="$GITHUB_DIR/pipeline-state.schema.json"
CONFIG_FILE="$GITHUB_DIR/trace-validation.yml"
REPORT_FILE="$REPO_ROOT/trace-validation-report.json"

CI_MODE=false
SINGLE_CHECK=""

for arg in "$@"; do
    case "$arg" in
        --ci) CI_MODE=true ;;
        --check) SINGLE_CHECK="${2:-}" ;;
    esac
done

# ── Colour helpers ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RESET='\033[0m'

info() { echo -e "${CYAN}[trace]${RESET} $*"; }
ok()   { echo -e "  ${GREEN}✓${RESET} $*"; }
warn() { echo -e "  ${YELLOW}⚠${RESET} $*"; }
fail() { echo -e "  ${RED}✗${RESET} $*"; }

# ── Check helpers ──────────────────────────────────────────────────────────────
FAILURES=()
WARNINGS=()
PASSES=()

record_pass() { PASSES+=("$1"); }
record_warn() { WARNINGS+=("$1: $2"); }
record_fail() { FAILURES+=("$1: $2"); }

is_hard_fail() {
    # Returns 0 (true) if check should hard-fail, 1 (false) for warn-only
    local check="$1"
    if [[ ! -f "$CONFIG_FILE" ]]; then return 0; fi
    python3 - "$check" "$CONFIG_FILE" <<'PYTHON'
import sys, yaml
check_name = sys.argv[1]
with open(sys.argv[2]) as f:
    config = yaml.safe_load(f)
checks = config.get('checks', {})
entry = checks.get(check_name, {})
hard_fail = entry.get('hard_fail', True)
sys.exit(0 if hard_fail else 1)
PYTHON
}

# ── Check: pipeline-state.json exists and is valid JSON ──────────────────────
check_schema_valid() {
    info "Checking: pipeline-state.json is schema-valid"
    if [[ ! -f "$STATE_FILE" ]]; then
        record_fail "schema_valid" "pipeline-state.json not found at $STATE_FILE"
        return
    fi
    if [[ -f "$SCHEMA_FILE" ]]; then
        if python3 -c "
import json, jsonschema
with open('$STATE_FILE') as f: state = json.load(f)
with open('$SCHEMA_FILE') as f: schema = json.load(f)
jsonschema.validate(state, schema)
print('Valid')
" 2>/dev/null; then
            record_pass "schema_valid"
            ok "pipeline-state.json is schema-valid"
        else
            record_fail "schema_valid" "pipeline-state.json failed schema validation"
        fi
    else
        if python3 -c "import json; json.load(open('$STATE_FILE'))" 2>/dev/null; then
            record_pass "schema_valid"
            ok "pipeline-state.json is valid JSON (no schema file to validate against)"
        else
            record_fail "schema_valid" "pipeline-state.json is not valid JSON"
        fi
    fi
}

# ── Check: discovery artefacts exist for all active features ──────────────────
check_discovery_exists() {
    info "Checking: discovery artefacts exist"
    if [[ ! -d "$ARTEFACTS" ]]; then
        record_pass "discovery_exists"
        ok "artefacts/ is empty — no features to check"
        return
    fi
    # Load reference_dirs skip list from trace-validation.yml
    local ref_dirs_pattern=""
    if [[ -f "$CONFIG_FILE" ]]; then
        ref_dirs_pattern=$(python3 - "$CONFIG_FILE" <<'PYTHON' 2>/dev/null || echo "")
import sys, yaml
with open(sys.argv[1]) as f:
    config = yaml.safe_load(f)
dirs = config.get('reference_dirs', [])
print('|'.join(dirs))
PYTHON
    fi
    local missing=0
    for feature_dir in "$ARTEFACTS"/*/; do
        [[ -d "$feature_dir" ]] || continue
        local feature
        feature="$(basename "$feature_dir")"
        [[ "$feature" == ".*" ]] && continue
        # Skip directories explicitly listed as reference-only in trace-validation.yml
        if [[ -n "$ref_dirs_pattern" ]] && echo "$feature" | grep -qE "^(${ref_dirs_pattern})$" 2>/dev/null; then
            ok "Skipping reference dir: artefacts/$feature (listed in reference_dirs)"
            continue
        fi
        if [[ ! -f "$feature_dir/discovery.md" ]]; then
            record_fail "discovery_exists" "$feature is missing discovery.md"
            fail "Missing: artefacts/$feature/discovery.md"
            ((missing++)) || true
        fi
    done
    if [[ $missing -eq 0 ]]; then
        record_pass "discovery_exists"
        ok "All features have discovery.md"
    fi
}

# ── Check: discovery artefacts are Approved ───────────────────────────────────
check_discovery_approved() {
    info "Checking: discovery artefacts are Approved"
    if [[ ! -d "$ARTEFACTS" ]]; then
        record_pass "discovery_approved"
        ok "artefacts/ is empty — nothing to check"
        return
    fi
    local unapproved=0
    for feature_dir in "$ARTEFACTS"/*/; do
        [[ -d "$feature_dir" ]] || continue
        local feature
        feature="$(basename "$feature_dir")"
        local discovery="$feature_dir/discovery.md"
        [[ -f "$discovery" ]] || continue
        if ! grep -qi 'status.*approved' "$discovery" 2>/dev/null; then
            if grep -qi 'status.*draft' "$discovery" 2>/dev/null; then
                record_fail "discovery_approved" "$feature: discovery.md status is still Draft"
                fail "$feature: discovery.md is still Draft"
                ((unapproved++)) || true
            fi
        fi
    done
    if [[ $unapproved -eq 0 ]]; then
        record_pass "discovery_approved"
        ok "All discoveries are Approved (or not yet at approval stage)"
    fi
}

# ── Check: test plan coverage ─────────────────────────────────────────────────
check_test_plan_coverage() {
    info "Checking: all stories have test plans"
    if [[ ! -f "$STATE_FILE" ]]; then
        record_pass "test_plan_coverage"
        ok "No pipeline-state.json — skipping"
        return
    fi
    if python3 - <<PYTHON
import json, os, sys

with open('$STATE_FILE') as f:
    state = json.load(f)

stages_needing_test_plan = {'test-plan','definition-of-ready','implementation','done','definition-of-done'}
missing = []
for feature in state.get('features', []):
    feature_slug = feature.get('slug', 'unknown')

    # Collect all story objects. Phase 3+ stores full objects in feature.stories[];
    # Phase 1/2 stores full objects nested inside epic.stories[].
    # Epic.stories[] may also contain plain string slugs (Phase 3) — skip those.
    stories = [s for s in feature.get('stories', []) if isinstance(s, dict)]
    if not stories:
        for epic in feature.get('epics', []):
            stories += [s for s in epic.get('stories', []) if isinstance(s, dict)]

    for story in stories:
        stage = story.get('stage', '')
        if stage not in stages_needing_test_plan:
            continue
        # Use testPlan.artefact directly when the pipeline-state records it explicitly.
        # This handles cases where the test plan filename uses a short slug (e.g. spc.1-test-plan.md)
        # rather than the full story slug (spc.1-context-yml-instrumentation-config-test-plan.md).
        direct_artefact = story.get('testPlan', {}).get('artefact', '')
        if direct_artefact:
            test_plan_path = direct_artefact
        else:
            # Fallback: derive the file slug from the story artefact path basename,
            # so that both short slugs (e.g. "p3.1a") and full slugs resolve correctly.
            artefact = story.get('artefact', '')
            if artefact:
                file_slug = os.path.basename(artefact).replace('.md', '')
            else:
                file_slug = story.get('slug', 'unknown')
            test_plan_path = os.path.join('artefacts', feature_slug, 'test-plans', f'{file_slug}-test-plan.md')
        if not os.path.exists(test_plan_path):
            print(f'MISSING: {test_plan_path}')
            missing.append(test_plan_path)
sys.exit(1 if missing else 0)
PYTHON
    then
        record_pass "test_plan_coverage"
        ok "All in-flight stories have test plans"
    else
        record_fail "test_plan_coverage" "One or more stories are missing test plans — see output above"
    fi
}

# ── Check: unresolved blockers ────────────────────────────────────────────────
check_unresolved_blockers() {
    info "Checking: no unresolved blockers"
    if [[ ! -f "$STATE_FILE" ]]; then
        record_pass "unresolved_blockers"
        ok "No pipeline-state.json — skipping"
        return
    fi
    python3 - <<PYTHON
import json, sys

with open('$STATE_FILE') as f:
    state = json.load(f)

found = False
for feature in state.get('features', []):
    feature_slug = feature.get('slug', 'unknown')
    # Check feature-level health
    if feature.get('health') == 'red' and not feature.get('blocker'):
        print(f'UNRESOLVED BLOCKER: feature {feature_slug} has health=red but no blocker recorded')
        found = True
    # Check story-level health
    for epic in feature.get('epics', []):
        for story in epic.get('stories', []):
            if not isinstance(story, dict):
                continue  # epics may store stories as string slugs rather than full objects
            story_slug = story.get('slug', 'unknown')
            if story.get('health') == 'red' and not story.get('blocker'):
                print(f'UNRESOLVED BLOCKER: {feature_slug}/{story_slug} has health=red but no blocker recorded')
                found = True
sys.exit(1 if found else 0)
PYTHON
    if [[ $? -eq 0 ]]; then
        record_pass "unresolved_blockers"
        ok "No unresolved blockers found"
    else
        record_fail "unresolved_blockers" "Stories have red health with no blocker recorded — see output above"
    fi
}

# ── Main ───────────────────────────────────────────────────────────────────────
echo ""
info "Trace Validation — $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

if [[ -n "$SINGLE_CHECK" ]]; then
    "check_$SINGLE_CHECK"
else
    check_schema_valid
    check_discovery_exists
    check_discovery_approved
    check_test_plan_coverage
    check_unresolved_blockers
fi

echo ""
info "Results: ${#PASSES[@]} passed, ${#WARNINGS[@]} warnings, ${#FAILURES[@]} failed"

for w in "${WARNINGS[@]}"; do warn "$w"; done
for f in "${FAILURES[@]}"; do fail "$f"; done

# ── JSON report ───────────────────────────────────────────────────────────────
if [[ "$CI_MODE" == "true" ]]; then
  # Pass arrays via env vars (newline-delimited) to avoid bash-in-Python expansion bugs
  PASSES_STR="$(printf '%s\n' "${PASSES[@]}")"
  WARNINGS_STR="$(printf '%s\n' "${WARNINGS[@]}")"
  FAILURES_STR="$(printf '%s\n' "${FAILURES[@]}")"
  export PASSES_STR WARNINGS_STR FAILURES_STR REPORT_FILE
  python3 - <<'PYTHON'
import json, os
def to_list(s): return [x for x in s.split('\n') if x] if s else []
report = {
    "passed":   to_list(os.environ.get("PASSES_STR",   "")),
    "warnings": to_list(os.environ.get("WARNINGS_STR", "")),
    "failures": to_list(os.environ.get("FAILURES_STR", "")),
}
with open(os.environ["REPORT_FILE"], 'w') as f:
    json.dump(report, f, indent=2)
print(f"Report written to {os.environ['REPORT_FILE']}")
PYTHON
fi

# Exit with failure if any hard-fail checks failed
if [[ ${#FAILURES[@]} -gt 0 ]]; then
    echo ""
    fail "Trace validation FAILED — ${#FAILURES[@]} hard-fail check(s) did not pass."
    exit 1
fi

echo ""
ok "Trace validation passed."
exit 0
