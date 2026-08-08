## Definition of Ready: vtp-s1 — Consolidate validate-trace.sh's checks into a single Python pass

**Story:** artefacts/2026-08-08-validate-trace-perf/stories/vtp-s1-consolidate-validate-trace-checks.md
**Review artefact:** artefacts/2026-08-08-validate-trace-perf/review/vtp-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-08-validate-trace-perf/test-plans/vtp-s1-test-plan.md
**Date:** 2026-08-08

---

### Scope contract

**Files in scope (exact touchpoints):**
- `scripts/validate-trace.sh` — consolidate the 6 checks' `python3`/`grep` subprocess usage into a single Python entry point that loads `pipeline-state.json` and `trace-validation.yml` once and shares the parsed result across all checks; `check_discovery_approved`'s per-directory `grep` loop moves into that same Python pass.
- `tests/check-vtp-s1-*.js` (new) — golden-file and spawn-count regression tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `.github/trace-validation.yml` — schema unchanged; consumed, not modified.
- `.github/pipeline-state.json` / `pipeline-state.schema.json` — schema unchanged; consumed, not modified.
- `node bin/skills validate` (the CLI wrapper) — no change; it calls `validate-trace.sh --check <name>`, which must keep working identically per AC3.
- `.github/workflows/*` — no workflow YAML changes; this story is transparent to CI callers.

### Architecture Constraints

No structural or architectural decision is introduced — this consolidates existing logic within the same bash-orchestrating-Python pattern already used throughout the file. No ADR required. The main risk is behavioural drift across the 6 checks' edge cases (track exemptions, `reference_dirs`, discovery-stage skip, archived test-plan path fallback, epic-nested vs flat story arrays) — AC1's golden-file diff is the primary safeguard against this.

### Human oversight

**Low** — mechanical refactor of a single, self-contained script with a strong automated equivalence check (AC1) as the safety net. No sign-off required beyond this DoR artefact. Not time-critical (unlike `lccf-s1`) — this can be executed at normal pace since the immediate incident is already mitigated by the T6 timeout bump.

### Coding Agent Instructions

1. Capture golden-file fixtures FIRST, before making any change: run current `validate-trace.sh --ci` and save `trace-validation-report.json`; run `validate-trace.sh --check <name>` for each of the 6 check names and save exit code + stdout for each.
2. Design a single Python script (invoked once via a heredoc or a new `scripts/validate-trace.py` helper — coding agent's choice, consistent with the existing file's style) that: loads `pipeline-state.json`, `trace-validation.yml`, and the `artefacts/` directory listing once; computes all 6 checks' verdicts from that shared in-memory state; and emits a structured (e.g. one-line-per-record) output that the bash side parses into `record_pass`/`record_warn`/`record_fail` calls, exactly as today.
3. For `check_discovery_approved` specifically: replace the per-directory `grep -qi 'status.*approved'`/`'status.*draft'` subprocess calls with an in-Python regex check against each `discovery.md`'s already-read content (the file still needs to be opened per directory since content differs per feature — the fix is eliminating the subprocess spawn per file, not the file read itself).
4. Preserve `--check <name>` mode: it may still pay the cost of loading shared state (that's fine, single-check invocations are rare/manual), but must produce the same verdict as before.
5. Write the golden-file and spawn-count tests per the test plan; confirm AC1's diff is empty and AC2's spawn count drops as expected.
6. Re-run `tests/check-p4-enf-second-line.js` (T6) and note the new observed timing in the PR description per AC4.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — this is a backend/CI script with no UI)

**PROCEED: Yes**
