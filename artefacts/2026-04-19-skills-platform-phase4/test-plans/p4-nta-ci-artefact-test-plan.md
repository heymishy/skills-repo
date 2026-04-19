# Test Plan: p4-nta-ci-artefact — CI integration for non-git-native governance surfaces

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-ci-artefact.md
**Epic:** E4 — Non-technical access
**Dependency:** Spike D PROCEED verdict; p4-nta-artefact-parity and p4-nta-gate-translation must be complete

## Scope

Tests verify the CI reporter produces a warning (not a failure) for `standards_injected: false` artefacts (AC3), no surface-specific annotation exists in the CI summary (AC4), and existing governance check scripts are free of bot-specific bypasses (MC-CORRECT-02). No new check categories are introduced.

**Implementation module:** `src/teams-bot/ci-reporter.js`

---

## Test Cases

### T1 — Module exists and exports checkBotArtefact

**Type:** Unit
**Check:** `src/teams-bot/ci-reporter.js` exists and exports `checkBotArtefact` as a function.

### T2 — standards_injected: false → warning (not error)

**Type:** Unit — AC3
**Given:** `{ artefactPath: 'artefacts/test-feature/discovery.md', standardsInjected: false }`.
**When:** `checkBotArtefact(input)` is called.
**Then:** Returns `{ level: 'warning', artefactPath: string, message: string }` — `level` is `"warning"`, not `"error"` or `"failure"`.

### T3 — standards_injected: true → null (no warning)

**Type:** Unit
**Given:** `{ artefactPath: '...', standardsInjected: true }`.
**When:** `checkBotArtefact(input)` is called.
**Then:** Returns `null` or `undefined` — no warning or error emitted.

### T4 — Warning message identifies artefact path and flag

**Type:** Unit — AC3
**Given:** `{ artefactPath: 'artefacts/my-feature/discovery.md', standardsInjected: false }`.
**When:** Warning result examined.
**Then:** `message` contains the artefact path and "standards_injected" text.

### T5 — standards_injected: false never produces level: error

**Type:** Unit
**Given:** Any artefact with `standardsInjected: false`.
**When:** `checkBotArtefact` called.
**Then:** `result.level` is not `"error"` and not `"failure"` — PR can proceed (AC3: warning not blocking).

### T6 — Governance check scripts contain no bot-specific bypass

**Type:** Static / source scan — MC-CORRECT-02
**Check:** `tests/` directory files do not contain patterns like `if (botArtefact)`, `skipIfBot`, `isBotProduced`, or special-case logic that skips checks for bot-produced artefacts.

### T7 — CI summary has no surface-specific annotation

**Type:** Unit — AC4
**Given:** `checkBotArtefact` called with `standardsInjected: true`.
**When:** Result inspected.
**Then:** Result is null (no annotation emitted for clean artefacts) — CI output does not say "bot artefact validated" or add surface-specific labels.

### T8 — No credentials in CI reporter output (MC-SEC-02)

**Type:** Unit
**Given:** Any input to `checkBotArtefact`.
**When:** Return value is stringified.
**Then:** Output does not contain `Bearer`, `secret`, `password`, `token` values — no credentials in warning messages.

### T-NFR1 — No hardcoded artefact paths in ci-reporter (ADR-004)

**Type:** Static / source scan
**Check:** Source does not contain hardcoded feature-slug paths — artefact path is passed in as a parameter, not hard-coded.

### T-NFR2 — MC-CORRECT-02: level values are only "warning" or null

**Type:** Unit
**Check:** `checkBotArtefact` only ever returns `null` or `{ level: "warning", ... }` — no `level: "error"`, `level: "info"`, or other new categories introduced.

---

## Verification script

`artefacts/2026-04-19-skills-platform-phase4/verification-scripts/p4-nta-ci-artefact-verification.md`

## Test file

`tests/check-p4-nta-ci-artefact.js`

## Pass criteria

All 12 test assertions pass with 0 failures. TDD red baseline: all fail before `src/teams-bot/ci-reporter.js` is implemented.
