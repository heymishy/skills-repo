## Test Plan: Fix validate-trace.ps1's discovery_approved check to suppress false positives on already-Approved features

**Story reference:** artefacts/2026-10-04-trace-validation-ps1-parity-fix/stories/tvpf-s1-fix-discovery-approved-false-positive.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js` (read directly from `package.json`'s own `scripts.test` entry). This story's own tests extend the existing dedicated test file `tests/check-p3.5-validate-trace.js` (not a new file — matches "test files mirror source files" and avoids a second, parallel test file for the same script).

**Real architecture grounding (confirmed by direct code read and live execution, 2026-10-04):**
- `scripts/validate-trace.ps1`'s `Check-DiscoveryApproved` (lines 156-186) checks `$content -match '(?i)status.*draft'` against the whole file (`Get-Content -Raw`), with no corresponding `status.*approved` suppression check.
- `scripts/validate-trace.sh`'s equivalent Python logic (lines 268-269) already computes both `approved` and `draft` booleans per-line, and the bash verdict logic (lines 474-480) only fails on `draft_flag` when `approved_flag != "1"` — the suppression the `.ps1` version lacks.
- `validate-trace.ps1 -check <name>` (single-check mode, line 352-363) runs exactly one named check in isolation and sets the exit code from that check's own `$Failures` count only — confirmed live. This lets tests target `discovery_approved` without needing a fully valid fixture for every other check (schema, test-plan-coverage, blockers, eval-mode).
- `$RepoRoot = Split-Path -Parent $ScriptDir` is derived from the `.ps1` file's own location (line 24), not `$PWD` — confirmed live and already exploited by the existing `ps1-exits-nonzero-on-missing-required-field` test's own tmpDir-copy technique, which this plan's new tests reuse.
- Real repo state confirmed live (2026-10-04): `new-feature-2b74a292` and `new-feature-af17f555` are real, current false positives under the pre-fix script.

**E2E/browser-layout detection (Step 3a):** N/A — this is a CLI/PowerShell script with no rendered UI. No E2E test required.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Approved feature with co-occurring status/draft text elsewhere is not flagged | — | 1 test | — | — | — | 🟢 |
| AC2 | Genuinely Draft feature (no approved match) is still flagged | — | 1 test | — | — | — | 🟢 |
| AC3 | Real repo's 2 known false positives are resolved | — | 1 test | — | — | — | 🟢 |
| AC4 | `.ps1` and `.sh` produce identical verdicts on the same real repo state | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Fixtures — temp directories with controlled `discovery.md`/`.github/pipeline-state.json` content, built using the existing test file's own tmpDir-copy-the-ps1 technique. AC3/AC4 additionally exercise this repo's own real `artefacts/`/`.github/pipeline-state.json` state (read-only, no fixture needed).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A temp `artefacts/feat-approved-with-note/discovery.md` containing `**Status:** Approved` plus a separate sentence like `(status corrected from stale "Draft")` | Fixture | None | Mirrors the real `new-feature-2b74a292` shape exactly |
| AC2 | A temp `artefacts/feat-genuinely-draft/discovery.md` containing only `**Status:** Draft`, no approved match anywhere | Fixture | None | Negative control — must still fail |
| AC3 | This repo's own real `artefacts/`, `.github/pipeline-state.json` | Real repo (read-only) | None | Proves the real false positives are gone |
| AC4 | Same real repo state, run through both scripts | Real repo (read-only) | None | Cross-script parity check |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — this story's logic lives entirely inside a PowerShell script invoked as a subprocess; there is no in-process unit boundary to test below the integration level (matching the existing test file's own established pattern — all of its tests spawn `pwsh` and assert on exit code/output).

---

## Integration Tests

### ps1 discovery_approved does not flag an Approved feature whose discovery.md separately contains a status/draft co-occurrence

- **Verifies:** AC1
- **Components involved:** `validate-trace.ps1`'s `Check-DiscoveryApproved` function, invoked via `-check discovery_approved`
- **Precondition:** A temp dir fixture (reusing the existing invalid-JSON test's own tmpDir-copy-the-ps1 technique) with `artefacts/feat-approved-with-note/discovery.md` containing `**Status:** Approved` and, elsewhere, `(status corrected from stale "Draft")`
- **Action:** Run `pwsh -NonInteractive -File <tmpDir copy of validate-trace.ps1> -check discovery_approved` with `cwd` set to the tmpDir
- **Expected result:** Exit code `0` — the feature is NOT flagged as Draft

### ps1 discovery_approved still flags a genuinely Draft feature with no approved match

- **Verifies:** AC2
- **Components involved:** Same as above
- **Precondition:** The same tmpDir fixture, plus a second feature `artefacts/feat-genuinely-draft/discovery.md` containing only `**Status:** Draft` (no approved match anywhere in that file)
- **Action:** Run the same single-check invocation
- **Expected result:** Exit code `1` — `feat-genuinely-draft` IS flagged (confirms the fix doesn't over-suppress real failures); stdout/`trace-validation-report.json` names `feat-genuinely-draft` specifically, not `feat-approved-with-note`

### Real repo: the 2 known false positives (new-feature-2b74a292, new-feature-af17f555) are resolved

- **Verifies:** AC3
- **Components involved:** The fixed `scripts/validate-trace.ps1` run directly against this repo's own real `artefacts/`/`.github/pipeline-state.json`
- **Precondition:** None — real repo state, read-only
- **Action:** Run `pwsh -NonInteractive -File scripts/validate-trace.ps1 -check discovery_approved` from the real repo root
- **Expected result:** Exit code `0` for this specific check — neither `new-feature-2b74a292` nor `new-feature-af17f555` appears in the failures list (confirmed by inspecting `trace-validation-report.json` or stdout)

### Real repo: validate-trace.ps1 and validate-trace.sh produce the same discovery_approved verdict

- **Verifies:** AC4
- **Components involved:** Both scripts, run against the same real repo state
- **Precondition:** None — real repo state, read-only. Skipped gracefully (not failed) if a POSIX shell (bash/WSL) isn't available in the test environment to run `validate-trace.sh` — matching this test file's own existing `hasPwsh()` skip-pattern precedent for environment-conditional tooling.
- **Action:** Run both `pwsh -File scripts/validate-trace.ps1 -check discovery_approved` and `bash scripts/validate-trace.sh` (or the repo's documented equivalent invocation) against the real repo
- **Expected result:** Both report the identical set of features flagged as Draft for `discovery_approved` (today: the empty set, post-fix) — proving true parity, not just "fixed in isolation"

---

## NFR Tests

None — confirmed "None identified" in the story's own NFR section; no dedicated NFR test needed.

---

## Out of Scope for This Test Plan

- Any test of `Check-SchemaValid`, `Check-DiscoveryExists`, `Check-TestPlanCoverage`, `Check-UnresolvedBlockers`, or `Check-NoEvalModeArtefacts` — unchanged by this story, already covered by `check-p3.5-validate-trace.js`'s own existing tests (not duplicated here)
- Rewriting the detection to parse only the literal `**Status:**` line — explicitly out of scope per the story's own Out of Scope section

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4's cross-script parity test depends on a POSIX shell being available in the local Windows dev environment, which may not always be true | `validate-trace.sh` is the CI/Linux path; a Windows-only local dev environment may lack bash/WSL | Skip gracefully (not fail) when unavailable, matching the existing `hasPwsh()` skip pattern — CI itself already runs `.sh` on every PR, providing real parity coverage there even when this specific local test skips |
