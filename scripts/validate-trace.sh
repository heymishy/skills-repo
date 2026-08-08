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

# ── Consolidated check runner (vtp-s1) ─────────────────────────────────────────
# Every check below used to spawn its own python3 process to independently
# re-read and re-parse pipeline-state.json / trace-validation.yml / list
# artefacts/, and check_discovery_approved additionally spawned up to 2 `grep`
# subprocesses per artefact directory. As artefacts/ has grown (149+ feature
# directories), that unscaled cost started intermittently timing out callers
# (see tests/check-p4-enf-second-line.js's T6 sub-check).
#
# This single Python invocation loads pipeline-state.json, trace-validation.yml,
# and the artefacts/ listing exactly once, computes every check's inputs from
# that shared in-memory state, and prints one section per check delimited by
# ===<NAME>_START===/===<NAME>_END=== markers. Each check_* function below
# extracts its own section and runs the SAME bash-side parsing loop the
# original per-check python invocation fed into — only how that input is
# obtained changed, not how it's interpreted. See
# artefacts/2026-08-08-validate-trace-perf/ for the story, review, and test
# plan this refactor is scoped against (in particular AC1's requirement that
# every check's pass/fail semantics stay byte-identical to before).
CONSOLIDATED_OUTPUT=""
CONSOLIDATED_RUN=false

run_consolidated_checks() {
    if [[ "$CONSOLIDATED_RUN" == "true" ]]; then return; fi
    CONSOLIDATED_RUN=true
    CONSOLIDATED_OUTPUT=$(ARTEFACTS_DIR="$ARTEFACTS" STATE_FILE="$STATE_FILE" SCHEMA_FILE="$SCHEMA_FILE" CONFIG_FILE="$CONFIG_FILE" python3 - <<'PYTHON'
import os, sys, re, json

artefacts   = os.environ.get('ARTEFACTS_DIR', 'artefacts')
state_file  = os.environ.get('STATE_FILE', '')
schema_file = os.environ.get('SCHEMA_FILE', '')
config_file = os.environ.get('CONFIG_FILE', '')

try:
    import yaml
    has_yaml = True
except ImportError:
    has_yaml = False

# ── Load shared inputs exactly once ────────────────────────────────────────
state = None
if state_file and os.path.exists(state_file):
    try:
        with open(state_file, encoding='utf-8') as f:
            state = json.load(f)
    except Exception:
        state = None

# Raw config, loaded once. Each check below applies its OWN original default
# fallback behaviour on top of this shared value -- the two checks that read
# tracks_without_discovery historically defaulted differently when the key
# (or the file) was absent, and that distinction is preserved deliberately.
config = None
if config_file and os.path.exists(config_file) and has_yaml:
    try:
        with open(config_file) as f:
            config = yaml.safe_load(f) or {}
    except Exception:
        config = None

artefacts_isdir = os.path.isdir(artefacts)
entries = []
entries_error = None
if artefacts_isdir:
    try:
        entries = sorted(os.listdir(artefacts))
    except Exception as ex:
        entries_error = str(ex)

track_map = {}
stage_map = {}
if state:
    for feature in state.get('features', []):
        slug = feature.get('slug', '')
        if slug:
            track_map[slug] = feature.get('track', 'standard')
            stage_map[slug] = feature.get('stage', '')

# ═══════════════════════════════════════════════════════════════════════════
print('===SCHEMA_VALID_START===')
if not state_file or not os.path.exists(state_file):
    print('EXIT:1')
    print('MISSING_STATE_FILE:' + state_file)
elif schema_file and os.path.exists(schema_file):
    try:
        import jsonschema
        with open(state_file, encoding='utf-8') as f:
            raw_state = f.read()
        with open(schema_file, encoding='utf-8') as f:
            schema = json.load(f)
        try:
            parsed_state = json.loads(raw_state)
        except Exception:
            parsed_state = None
        if parsed_state is None:
            print('EXIT:1')
            print('INVALID_JSON:1')
        else:
            v = jsonschema.Draft7Validator(schema)
            errs = list(v.iter_errors(parsed_state))
            if not errs:
                print('EXIT:0')
                print('Valid')
            else:
                print('EXIT:1')
                print(str(len(errs)) + ' violation(s) found:')
                for e in sorted(errs, key=lambda x: list(x.absolute_path))[:10]:
                    path_str = ' > '.join(str(p) for p in e.absolute_path) or '(root)'
                    print('  ' + path_str + ': ' + e.message[:120])
                if len(errs) > 10:
                    print('  ... and ' + str(len(errs) - 10) + ' more — run validate-trace.sh locally to see all')
    except Exception:
        print('EXIT:1')
        print('SCHEMA_CHECK_ERROR:1')
else:
    if state is not None:
        print('EXIT:0')
        print('pipeline-state.json is valid JSON (no schema file to validate against)')
    else:
        print('EXIT:1')
        print('INVALID_JSON:1')
print('===SCHEMA_VALID_END===')

# ═══════════════════════════════════════════════════════════════════════════
print('===DISCOVERY_EXISTS_START===')
if not artefacts_isdir:
    print('EMPTY:1')
else:
    reference_dirs = set()
    tracks_without_discovery = {'short', 'defect', 'library', 'spike'}
    if config is not None:
        reference_dirs = set(config.get('reference_dirs', []))
        if 'tracks_without_discovery' in config:
            tracks_without_discovery = set(config['tracks_without_discovery'])

    if entries_error is not None:
        print('ERROR:' + entries_error)
    else:
        for entry in entries:
            feature_dir = os.path.join(artefacts, entry)
            if not os.path.isdir(feature_dir) or entry.startswith('.'):
                continue
            if entry in reference_dirs:
                print('SKIP_REF:' + entry)
                continue
            feature_track = track_map.get(entry, '')
            if feature_track in tracks_without_discovery:
                print('SKIP_TRACK:' + entry + ':' + feature_track)
                continue
            if not os.path.exists(os.path.join(feature_dir, 'discovery.md')):
                track_hint = ('track: ' + feature_track) if feature_track else 'not registered in pipeline-state — add to reference_dirs or pipeline-state with correct track'
                print('MISSING:' + entry + ':' + track_hint)
print('===DISCOVERY_EXISTS_END===')

# ═══════════════════════════════════════════════════════════════════════════
# discovery_approved needs: (1) "slug|stage|track" lines for the grep -m1
# lookup the bash side used to do against a python3-computed feature_meta
# blob, (2) the exempt-tracks list (its OWN original default, which included
# 'programme' whenever the config key was absent OR the file didn't load --
# not the same default check_discovery_exists used), and (3) each candidate
# feature directory's discovery.md content so the bash side's `grep -qi
# 'status.*approved'` / `'status.*draft'` calls can be replaced with an
# equivalent in-process per-line regex search (same case-insensitive,
# single-line semantics grep -i provides; no DOTALL).
print('===DISCOVERY_APPROVED_FEATURE_META_START===')
if state:
    for feature in state.get('features', []):
        slug = feature.get('slug', '')
        stage = feature.get('stage', '')
        track = feature.get('track', 'standard')
        if slug:
            print(slug + '|' + stage + '|' + track)
print('===DISCOVERY_APPROVED_FEATURE_META_END===')

print('===DISCOVERY_APPROVED_EXEMPT_TRACKS_START===')
_approved_default = ['short', 'defect', 'library', 'spike', 'programme']
if config is not None:
    print(' '.join(config.get('tracks_without_discovery', _approved_default)))
else:
    print(' '.join(_approved_default))
print('===DISCOVERY_APPROVED_EXEMPT_TRACKS_END===')

print('===DISCOVERY_APPROVED_STATUS_START===')
if artefacts_isdir:
    for entry in entries:
        feature_dir = os.path.join(artefacts, entry)
        if not os.path.isdir(feature_dir):
            continue
        discovery = os.path.join(feature_dir, 'discovery.md')
        if not os.path.exists(discovery):
            continue
        try:
            with open(discovery, encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
        except Exception:
            lines = []
        approved = any(re.search(r'status.*approved', l, re.IGNORECASE) for l in lines)
        draft    = any(re.search(r'status.*draft', l, re.IGNORECASE) for l in lines)
        print(entry + '|' + ('1' if approved else '0') + '|' + ('1' if draft else '0'))
print('===DISCOVERY_APPROVED_STATUS_END===')

# ═══════════════════════════════════════════════════════════════════════════
print('===TEST_PLAN_COVERAGE_START===')
if state is None:
    print('EXIT:0')
else:
    test_plan_exempt = set()
    if config is not None:
        test_plan_exempt = set(config.get('test_plan_exempt_features', []))

    stages_needing_test_plan = {'test-plan','definition-of-ready','implementation','done','definition-of-done'}
    missing = []
    for feature in state.get('features', []):
        feature_slug = feature.get('slug', 'unknown')
        if feature_slug in test_plan_exempt:
            continue
        stories = [s for s in feature.get('stories', []) if isinstance(s, dict)]
        if not stories:
            for epic in feature.get('epics', []):
                stories += [s for s in epic.get('stories', []) if isinstance(s, dict)]
        for story in stories:
            stage = story.get('stage', '')
            if stage not in stages_needing_test_plan:
                continue
            direct_artefact = story.get('testPlan', {}).get('artefact', '')
            if direct_artefact:
                test_plan_path = direct_artefact
            else:
                artefact = story.get('artefact', '')
                if artefact:
                    file_slug = os.path.basename(artefact).replace('.md', '')
                else:
                    file_slug = story.get('slug') or story.get('id', 'unknown')
                test_plan_path = os.path.join('artefacts', feature_slug, 'test-plans', f'{file_slug}-test-plan.md')
            if not os.path.exists(test_plan_path):
                normalized = test_plan_path.replace(os.sep, '/')
                if normalized.startswith('artefacts/'):
                    archived_path = 'artefacts/archived/' + normalized[len('artefacts/'):]
                else:
                    archived_path = normalized
                if not os.path.exists(archived_path):
                    print(f'MISSING: {test_plan_path}')
                    missing.append(test_plan_path)
    print('EXIT:' + ('1' if missing else '0'))
print('===TEST_PLAN_COVERAGE_END===')

# ═══════════════════════════════════════════════════════════════════════════
print('===UNRESOLVED_BLOCKERS_START===')
if state is None:
    print('EXIT:0')
else:
    found = False
    for feature in state.get('features', []):
        feature_slug = feature.get('slug', 'unknown')
        if feature.get('health') == 'red' and not feature.get('blocker'):
            print(f'UNRESOLVED BLOCKER: feature {feature_slug} has health=red but no blocker recorded')
            found = True
        all_stories = [s for s in feature.get('stories', []) if isinstance(s, dict)]
        for epic in feature.get('epics', []):
            all_stories += [s for s in epic.get('stories', []) if isinstance(s, dict)]
        for story in all_stories:
            story_slug = story.get('slug') or story.get('id', 'unknown')
            if story.get('health') == 'red' and not story.get('blocker'):
                print(f'UNRESOLVED BLOCKER: {feature_slug}/{story_slug} has health=red but no blocker recorded')
                found = True
    print('EXIT:' + ('1' if found else '0'))
print('===UNRESOLVED_BLOCKERS_END===')

# ═══════════════════════════════════════════════════════════════════════════
# no_eval_mode_artefacts originally spawned one `grep -qF` subprocess PER
# markdown file found by `find` -- 3,691 files under artefacts/ as of this
# date, the single worst instance of the subprocess-per-item pattern this
# story exists to fix (worse than discovery_approved's ~300). Same marker
# string, same recursive scope, checked in-process instead.
print('===NO_EVAL_MODE_ARTEFACTS_START===')
if artefacts_isdir:
    for dirpath, dirnames, filenames in os.walk(artefacts):
        for fn in filenames:
            if not fn.endswith('.md'):
                continue
            fp = os.path.join(dirpath, fn)
            try:
                with open(fp, encoding='utf-8', errors='ignore') as f:
                    content = f.read()
            except Exception:
                continue
            if '<!-- eval-mode: true -->' in content:
                print('FOUND:' + fp)
print('===NO_EVAL_MODE_ARTEFACTS_END===')
PYTHON
    )
}

# ── Check: pipeline-state.json exists and is valid JSON ──────────────────────
check_schema_valid() {
    info "Checking: pipeline-state.json is schema-valid"
    run_consolidated_checks
    local section exit_code
    section=$(sed -n '/===SCHEMA_VALID_START===/,/===SCHEMA_VALID_END===/p' <<< "$CONSOLIDATED_OUTPUT" | sed '1d;$d')
    exit_code=$(grep -m1 '^EXIT:' <<< "$section" | cut -d: -f2)
    if [[ -z "$exit_code" ]]; then
        record_fail "schema_valid" "pipeline-state.json not found at $STATE_FILE"
        return
    fi
    if grep -q '^MISSING_STATE_FILE:' <<< "$section"; then
        record_fail "schema_valid" "pipeline-state.json not found at $STATE_FILE"
        return
    fi
    # Print any non-marker detail lines (violations / status text) exactly as
    # the original per-check python invocation printed them to stdout.
    while IFS= read -r line; do
        [[ "$line" == EXIT:* ]] && continue
        [[ -n "$line" ]] && echo "$line"
    done <<< "$section"
    if [[ "$exit_code" == "0" ]]; then
        if grep -q 'no schema file to validate against' <<< "$section"; then
            record_pass "schema_valid"
            ok "pipeline-state.json is valid JSON (no schema file to validate against)"
        else
            record_pass "schema_valid"
            ok "pipeline-state.json is schema-valid"
        fi
    else
        if grep -q '^INVALID_JSON:' <<< "$section"; then
            record_fail "schema_valid" "pipeline-state.json is not valid JSON"
        else
            record_fail "schema_valid" "pipeline-state.json failed schema validation — see violations above"
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
    run_consolidated_checks
    local check_output missing_count
    missing_count=0
    check_output=$(sed -n '/===DISCOVERY_EXISTS_START===/,/===DISCOVERY_EXISTS_END===/p' <<< "$CONSOLIDATED_OUTPUT" | sed '1d;$d')
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
    run_consolidated_checks
    local feature_meta exempt_tracks status_lines
    feature_meta=$(sed -n '/===DISCOVERY_APPROVED_FEATURE_META_START===/,/===DISCOVERY_APPROVED_FEATURE_META_END===/p' <<< "$CONSOLIDATED_OUTPUT" | sed '1d;$d')
    exempt_tracks=$(sed -n '/===DISCOVERY_APPROVED_EXEMPT_TRACKS_START===/,/===DISCOVERY_APPROVED_EXEMPT_TRACKS_END===/p' <<< "$CONSOLIDATED_OUTPUT" | sed '1d;$d')
    status_lines=$(sed -n '/===DISCOVERY_APPROVED_STATUS_START===/,/===DISCOVERY_APPROVED_STATUS_END===/p' <<< "$CONSOLIDATED_OUTPUT" | sed '1d;$d')
    local unapproved=0
    while IFS= read -r sline; do
        [[ -z "$sline" ]] && continue
        local feature approved_flag draft_flag
        feature="${sline%%|*}"
        local rest="${sline#*|}"
        approved_flag="${rest%%|*}"
        draft_flag="${rest#*|}"
        local feat_line feat_stage feat_track
        feat_line=$(echo "$feature_meta" | grep -m1 "^${feature}|" || true)
        feat_stage=$(echo "$feat_line" | cut -d'|' -f2)
        feat_track=$(echo "$feat_line" | cut -d'|' -f3)
        if [[ "$feat_stage" == "discovery" ]]; then
            ok "Skipping: $feature (stage: discovery — approval pending)"
            continue
        fi
        if echo " $exempt_tracks " | grep -qw "$feat_track"; then
            ok "Skipping: $feature (track: $feat_track — discovery not required on this track)"
            continue
        fi
        if [[ "$approved_flag" != "1" ]]; then
            if [[ "$draft_flag" == "1" ]]; then
                record_fail "discovery_approved" "$feature: discovery.md status is still Draft"
                fail "$feature: discovery.md is still Draft"
                ((unapproved++)) || true
            fi
        fi
    done <<< "$status_lines"
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
    run_consolidated_checks
    local section exit_code
    section=$(sed -n '/===TEST_PLAN_COVERAGE_START===/,/===TEST_PLAN_COVERAGE_END===/p' <<< "$CONSOLIDATED_OUTPUT" | sed '1d;$d')
    exit_code=$(grep -m1 '^EXIT:' <<< "$section" | cut -d: -f2)
    while IFS= read -r line; do
        [[ "$line" == EXIT:* ]] && continue
        [[ -n "$line" ]] && echo "$line"
    done <<< "$section"
    if [[ "$exit_code" == "0" ]]; then
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
    run_consolidated_checks
    local section exit_code
    section=$(sed -n '/===UNRESOLVED_BLOCKERS_START===/,/===UNRESOLVED_BLOCKERS_END===/p' <<< "$CONSOLIDATED_OUTPUT" | sed '1d;$d')
    exit_code=$(grep -m1 '^EXIT:' <<< "$section" | cut -d: -f2)
    while IFS= read -r line; do
        [[ "$line" == EXIT:* ]] && continue
        [[ -n "$line" ]] && echo "$line"
    done <<< "$section"
    if [[ "$exit_code" == "0" ]]; then
        record_pass "unresolved_blockers"
        ok "No unresolved blockers found"
    else
        record_fail "unresolved_blockers" "Stories have red health with no blocker recorded — see output above"
    fi
}

# ── Check: no eval-mode artefacts in production paths ────────────────────────
check_no_eval_mode_artefacts() {
    info "Checking: no eval-mode artefacts committed to production paths"
    if [[ ! -d "$ARTEFACTS" ]]; then
        record_pass "no_eval_mode_artefacts"
        ok "artefacts/ is empty — nothing to check"
        return
    fi
    run_consolidated_checks
    local section found
    section=$(sed -n '/===NO_EVAL_MODE_ARTEFACTS_START===/,/===NO_EVAL_MODE_ARTEFACTS_END===/p' <<< "$CONSOLIDATED_OUTPUT" | sed '1d;$d')
    found=0
    while IFS= read -r line; do
        case "$line" in
            FOUND:*)
                local file="${line#FOUND:}"
                record_fail "no_eval_mode_artefacts" "$(basename "$file"): contains eval-mode marker — eval artefacts must not be committed to artefacts/"
                fail "Eval-mode artefact in production path: $file"
                ((found++)) || true
                ;;
        esac
    done <<< "$section"
    if [[ $found -eq 0 ]]; then
        record_pass "no_eval_mode_artefacts"
        ok "No eval-mode artefacts found in artefacts/"
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
    check_no_eval_mode_artefacts
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
