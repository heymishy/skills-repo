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
import json, jsonschema, sys
with open('$STATE_FILE', encoding='utf-8') as f: state = json.load(f)
with open('$SCHEMA_FILE', encoding='utf-8') as f: schema = json.load(f)
v = jsonschema.Draft7Validator(schema)
errs = list(v.iter_errors(state))
if not errs:
    print('Valid')
    sys.exit(0)
print(str(len(errs)) + ' violation(s) found:')
for e in sorted(errs, key=lambda x: list(x.absolute_path))[:10]:
    path_str = ' > '.join(str(p) for p in e.absolute_path) or '(root)'
    print('  ' + path_str + ': ' + e.message[:120])
if len(errs) > 10:
    print('  ... and ' + str(len(errs) - 10) + ' more — run validate-trace.sh locally to see all')
sys.exit(1)"; then
            record_pass "schema_valid"
            ok "pipeline-state.json is schema-valid"
        else
            record_fail "schema_valid" "pipeline-state.json failed schema validation — see violations above"
        fi
    else
        if python3 -c "import json; json.load(open('$STATE_FILE', encoding='utf-8'))" 2>/dev/null; then
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
    # Delegate entirely to Python so we can read pipeline-state.json for track-based
    # auto-exemption and emit structured diagnostic lines for each feature.
    local check_output missing_count
    missing_count=0
    check_output=$(ARTEFACTS_DIR="$ARTEFACTS" STATE_FILE="$STATE_FILE" CONFIG_FILE="$CONFIG_FILE" python3 - <<'PYTHON' 2>&1
import os, json, sys
try:
    import yaml
    has_yaml = True
except ImportError:
    has_yaml = False

artefacts  = os.environ.get('ARTEFACTS_DIR', 'artefacts')
state_file = os.environ.get('STATE_FILE', '')
config_file = os.environ.get('CONFIG_FILE', '')

# Load reference_dirs and tracks_without_discovery from trace-validation.yml
reference_dirs = set()
tracks_without_discovery = {'short', 'defect', 'library', 'spike'}
if config_file and os.path.exists(config_file) and has_yaml:
    with open(config_file) as f:
        config = yaml.safe_load(f) or {}
    reference_dirs = set(config.get('reference_dirs', []))
    if 'tracks_without_discovery' in config:
        tracks_without_discovery = set(config['tracks_without_discovery'])

# Build feature slug → track map from pipeline-state.json
track_map = {}
if state_file and os.path.exists(state_file):
    try:
        with open(state_file, encoding='utf-8') as f:
            state = json.load(f)
        for feature in state.get('features', []):
            slug  = feature.get('slug', '')
            track = feature.get('track', 'standard')
            if slug:
                track_map[slug] = track
    except Exception:
        pass  # if state is unreadable, proceed without track info

missing = 0
try:
    entries = sorted(os.listdir(artefacts))
except Exception as ex:
    print('ERROR:' + str(ex))
    sys.exit(2)

for entry in entries:
    feature_dir = os.path.join(artefacts, entry)
    if not os.path.isdir(feature_dir) or entry.startswith('.'):
        continue
    # reference_dirs: manual skip-list for directories that are not pipeline features
    if entry in reference_dirs:
        print('SKIP_REF:' + entry)
        continue
    # track-based auto-exemption: features on non-standard tracks do not require discovery.md
    feature_track = track_map.get(entry, '')
    if feature_track in tracks_without_discovery:
        print('SKIP_TRACK:' + entry + ':' + feature_track)
        continue
    if not os.path.exists(os.path.join(feature_dir, 'discovery.md')):
        track_hint = ('track: ' + feature_track) if feature_track else 'not registered in pipeline-state — add to reference_dirs or pipeline-state with correct track'
        print('MISSING:' + entry + ':' + track_hint)
        missing += 1

sys.exit(1 if missing else 0)
PYTHON
    )
    while IFS= read -r line; do
        case "$line" in
            SKIP_REF:*)
                ok "Skipping reference dir: artefacts/${line#SKIP_REF:}"
                ;;
            SKIP_TRACK:*)
                local ts="${line#SKIP_TRACK:}"
                ok "Skipping: artefacts/${ts%%:*} (track: ${ts#*:} — discovery not required on this track)"
                ;;
            MISSING:*)
                local ms="${line#MISSING:}"
                record_fail "discovery_exists" "${ms%%:*} is missing discovery.md (${ms#*:})"
                fail "Missing: artefacts/${ms%%:*}/discovery.md  [${ms#*:}]"
                ((missing_count++)) || true
                ;;
            ERROR:*)
                fail "discovery_exists check internal error: ${line#ERROR:}"
                record_fail "discovery_exists" "Internal error — ${line#ERROR:}"
                ((missing_count++)) || true
                ;;
        esac
    done <<< "$check_output"
    if [[ $missing_count -eq 0 ]]; then
        record_pass "discovery_exists"
        ok "All standard-track features have discovery.md"
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
                # Phase 3+ stories use 'id' key; Phase 1/2 stories use 'slug' key
                file_slug = story.get('slug') or story.get('id', 'unknown')
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
