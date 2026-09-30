## Test Plan: Reconcile check-pipeline-state-integrity.js's rules with the actual JSON schema

**Story reference:** artefacts/2026-09-30-pipeline-state-integrity-schema-reconciliation/stories/psir-s1.md
**Test plan author:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

---

## AC Coverage

| AC | Description | Unit (self-test) | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Feature missing `name`/`health` → fail | 4 tests | — | — | — | — | 🟢 |
| AC2 | Invalid `health` enum (feature + epic-nested story) → fail | 6 tests | — | — | — | — | 🟢 |
| AC3 | Epic-nested story missing `name`/`stage`/`health` → fail | 6 tests | — | — | — | — | 🟢 |
| AC4 | Invalid `dorStatus`/`reviewStatus`/`verifyStatus` enum → fail | 9 tests | — | — | — | — | 🟢 |
| AC5 | `guardrails[]` missing fields / invalid `category`/`status` enum → fail | 8 tests | — | — | — | — | 🟢 |
| AC6 | `tasks[]` missing `id`/`name`; invalid `tddState` enum → fail | 6 tests | — | — | — | — | 🟢 |
| AC7 | `spikes[]` missing fields / invalid `verdict` enum → fail | 6 tests | — | — | — | — | 🟢 |
| AC8 | 0 new failures against real, current `pipeline-state.json` | — | 1 check | — | — | — | 🟢 |

**Note on "Unit" column:** this file's own established convention is a self-contained self-test harness embedded directly in `scripts/check-pipeline-state-integrity.js` itself (see the existing `selfAssert`/self-tests block, lines ~292–727 as of this writing) — there is no separate `tests/check-*.js` wrapper for this script. New tests are added to that same embedded harness, in the same style, immediately before the existing `AC6: fully-valid fixture` self-test (which must also be extended to confirm none of the new C15+ codes fire against it).

---

## Coverage gaps

None. All new checks are pure-logic, synchronous, no filesystem/network access required for the unit-level self-tests. AC8 requires the real `pipeline-state.json` on disk, matching this script's own existing "integration check" section that already runs after all self-tests pass.

---

## Test Data Strategy

**Source:** Synthetic — small inline object literals passed directly to `checkFeature`/`checkStory`, exactly matching the existing file's own self-test style (e.g. `checkFeature({ slug: 'feat1', stage: 'implementation' })`). AC8 additionally uses the real `.github/pipeline-state.json`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC7 | Minimal object literals with exactly one property varied per test case (matching existing C1–C14 self-test granularity) | Synthetic | None | Each new code needs: 1 "missing/invalid → fail" case, 1 "valid/present → no fail" case, plus edge cases (absent field entirely vs. explicit `null`) where the schema's own distinction matters |
| AC8 | The real `.github/pipeline-state.json` at merge time | Real repo file | None (already public repo data) | Run `node scripts/check-pipeline-state-integrity.js` and separately the real Python `jsonschema` validator (`python -c "...jsonschema.Draft7Validator..."`, the exact command used to diagnose the original `name` gap) — cross-check both report 0 new findings before merge |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests (self-tests embedded in the script)

### AC1 — C15: feature missing `name`

- **Verifies:** AC1
- **Action:** `checkFeature({ slug: 'feat1', stage: 'branch-complete', track: 'short', health: 'green' })` (no `name`)
- **Expected result:** 1 finding, code `C15`, level `fail`
- **Edge case:** No

### AC1 — C15: feature with `name` present → no C15

- **Verifies:** AC1
- **Action:** same fixture plus `name: 'Feature'`
- **Expected result:** no finding with code `C15`

### AC1 — C16: feature missing `health`

- **Verifies:** AC1
- **Action:** `checkFeature({ slug: 'feat1', name: 'Feature', stage: 'branch-complete', track: 'short' })` (no `health`)
- **Expected result:** 1 finding, code `C16`, level `fail`

### AC1 — C16: feature with `health` present → no C16

- **Verifies:** AC1
- **Action:** same fixture plus `health: 'green'`
- **Expected result:** no finding with code `C16`

### AC2 — C17: feature `health` invalid enum value

- **Verifies:** AC2
- **Action:** `checkFeature({ slug: 'feat1', health: 'done' })`
- **Expected result:** 1 finding, code `C17`, level `fail`, message names `done` and the valid enum

### AC2 — C17: feature `health` valid values → no C17

- **Verifies:** AC2
- **Action:** `checkFeature({ slug: 'feat1', health: 'green' })`, `{ health: 'amber' }`, `{ health: 'red' }`
- **Expected result:** no `C17` finding for any of the 3

### AC2 — C17: feature `health` absent → no C17 (covered separately by C16)

- **Verifies:** AC2
- **Action:** `checkFeature({ slug: 'feat1' })`
- **Expected result:** no `C17` finding (C16 fires instead, for absence — the two checks are independent and both may fire, but this case only exercises C17's own absence handling)

### AC2 — C17: epic-nested story `health` invalid enum value

- **Verifies:** AC2
- **Action:** `checkStory('f', { id: 's1', slug: 's1', name: 'Story', stage: 'test-plan', health: 'unknown' }, true)`
- **Expected result:** 1 finding, code `C17`, level `fail` (same code reused across both contexts, matching the file's own precedent of `checkStory` being shared logic for flat and epic-nested shapes)

### AC2 — C17: epic-nested story `health` valid value → no C17

- **Verifies:** AC2
- **Action:** same fixture with `health: 'amber'`
- **Expected result:** no `C17` finding

### AC3 — C18: epic-nested story missing `name`

- **Verifies:** AC3
- **Action:** `checkStory('f', { id: 's1', slug: 's1', stage: 'test-plan', health: 'green' }, true)` (no `name`)
- **Expected result:** 1 finding, code `C18`, level `fail`

### AC3 — C18: epic-nested story with `name` → no C18

- **Verifies:** AC3
- **Action:** same fixture plus `name: 'Story'`
- **Expected result:** no `C18` finding

### AC3 — C18: flat story missing `name` → no C18 (schema does not require `name` on flat stories)

- **Verifies:** AC3
- **Action:** `checkStory('f', { id: 's1' }, false)`
- **Expected result:** no `C18` finding (flat `feature.stories[]` items only require `id` per schema — see C10)

### AC3 — C19: epic-nested story missing `stage`

- **Verifies:** AC3
- **Action:** `checkStory('f', { id: 's1', slug: 's1', name: 'Story', health: 'green' }, true)` (no `stage`)
- **Expected result:** 1 finding, code `C19`, level `fail`

### AC3 — C19: epic-nested story with `stage` → no C19

- **Verifies:** AC3
- **Action:** same fixture plus `stage: 'test-plan'`
- **Expected result:** no `C19` finding

### AC3 — C20: epic-nested story missing `health`

- **Verifies:** AC3
- **Action:** `checkStory('f', { id: 's1', slug: 's1', name: 'Story', stage: 'test-plan' }, true)` (no `health`)
- **Expected result:** 1 finding, code `C20`, level `fail` (distinct from `C17`'s enum-validity concern — `C20` is presence, `C17` is validity; both may reference the same field but check different failure modes, matching the file's own `C11`/`C7` precedent for `track`/`stage`)

### AC4 — C21: invalid `dorStatus` enum value

- **Verifies:** AC4
- **Action:** `checkStory('f', { id: 's1', dorStatus: 'complete' })`
- **Expected result:** 1 finding, code `C21`, level `fail`

### AC4 — C21: valid `dorStatus` values → no C21

- **Verifies:** AC4
- **Action:** `dorStatus: 'not-started'`, `'blocked'`, `'signed-off'` — each in a separate call
- **Expected result:** no `C21` finding for any of the 3

### AC4 — C21: `dorStatus` absent → no C21

- **Verifies:** AC4
- **Action:** `checkStory('f', { id: 's1' })`
- **Expected result:** no `C21` finding

### AC4 — C22: invalid `reviewStatus` enum value (epic-nested)

- **Verifies:** AC4
- **Action:** `checkStory('f', { id: 's1', slug: 's1', reviewStatus: 'in-review' }, true)`
- **Expected result:** 1 finding, code `C22`, level `fail`

### AC4 — C22: valid `reviewStatus` values → no C22

- **Verifies:** AC4
- **Action:** `'not-started'`, `'passed'`, `'has-findings'`
- **Expected result:** no `C22` finding for any

### AC4 — C22: `reviewStatus` absent → no C22

- **Verifies:** AC4
- **Action:** `checkStory('f', { id: 's1' }, true)`
- **Expected result:** no `C22` finding

### AC4 — C23: invalid `verifyStatus` enum value (epic-nested)

- **Verifies:** AC4
- **Action:** `checkStory('f', { id: 's1', slug: 's1', verifyStatus: 'done' }, true)`
- **Expected result:** 1 finding, code `C23`, level `fail`

### AC4 — C23: valid `verifyStatus` values → no C23

- **Verifies:** AC4
- **Action:** `'not-started'`, `'running'`, `'passed'`
- **Expected result:** no `C23` finding for any

### AC5 — C24: `guardrails[]` entry missing required field(s)

- **Verifies:** AC5
- **Action:** a new `checkGuardrails(featureSlug, guardrails)` helper (or inline logic in `checkFeature`) called with `[{ id: 'ADR-1', category: 'adr', label: 'x' }]` (missing `status`)
- **Expected result:** 1 finding, code `C24`, level `fail`, naming `status` as the missing field
- **Edge case:** test each of the 4 required fields (`id`, `category`, `label`, `status`) missing independently — 4 sub-cases

### AC5 — C24: fully-populated `guardrails[]` entry → no C24

- **Verifies:** AC5
- **Action:** `[{ id: 'ADR-1', category: 'adr', label: 'x', status: 'met' }]`
- **Expected result:** no `C24` finding

### AC5 — C25: `guardrails[]` invalid `category` enum value

- **Verifies:** AC5
- **Action:** `[{ id: 'X', category: 'random', label: 'x', status: 'met' }]`
- **Expected result:** 1 finding, code `C25`, level `fail`

### AC5 — C25: valid `category` values → no C25

- **Verifies:** AC5
- **Action:** each of `mandatory-constraint | adr | nfr | compliance-framework | pattern | anti-pattern`
- **Expected result:** no `C25` finding for any

### AC5 — C26: `guardrails[]` invalid `status` enum value

- **Verifies:** AC5
- **Action:** `[{ id: 'X', category: 'adr', label: 'x', status: 'pass' }]` (an informal synonym CLAUDE.md explicitly calls out as wrong)
- **Expected result:** 1 finding, code `C26`, level `fail`

### AC5 — C26: valid `status` values → no C26

- **Verifies:** AC5
- **Action:** each of `met | not-met | na | excepted | not-assessed | active`
- **Expected result:** no `C26` finding for any

### AC6 — C4 extension: `tasks[]` entry missing `id` or `name`

- **Verifies:** AC6
- **Action:** `checkStory('f', { id: 's1', tasks: [{ tddState: 'green' }] })` (missing both `id` and `name`)
- **Expected result:** finding(s) for the missing field(s) — extends the existing `C4` check (which currently only checks `tddState`) rather than introducing a new code, since it is the same "task object missing a required field" concern the header comment already describes

### AC6 — C27: `tasks[]` entry's `tddState` present but invalid enum value

- **Verifies:** AC6
- **Action:** `checkStory('f', { id: 's1', tasks: [{ id: 't1', name: 'T1', tddState: 'in-progress' }] })`
- **Expected result:** 1 finding, code `C27`, level `fail` (distinct from `C4`'s presence-only check)

### AC6 — C27: valid `tddState` values → no C27

- **Verifies:** AC6
- **Action:** each of `not-started | committed | green | refactor | done`
- **Expected result:** no `C27` finding for any

### AC7 — C28: `spikes[]` entry missing `id` or `storySlug`

- **Verifies:** AC7
- **Action:** a new `checkSpikes(featureSlug, spikes)` helper (or inline logic in `checkFeature`) called with `[{ storySlug: 's1' }]` (missing `id`) and `[{ id: 'spike-a' }]` (missing `storySlug`)
- **Expected result:** 1 finding per case, code `C28`, level `fail`

### AC7 — C28: fully-populated `spikes[]` entry → no C28

- **Verifies:** AC7
- **Action:** `[{ id: 'spike-a', storySlug: 's1' }]`
- **Expected result:** no `C28` finding

### AC7 — C29: `spikes[]` invalid `verdict` enum value

- **Verifies:** AC7
- **Action:** `[{ id: 'spike-a', storySlug: 's1', verdict: 'MAYBE' }]`
- **Expected result:** 1 finding, code `C29`, level `fail`

### AC7 — C29: `verdict: null` → no C29 (schema explicitly allows null)

- **Verifies:** AC7
- **Action:** `[{ id: 'spike-a', storySlug: 's1', verdict: null }]`
- **Expected result:** no `C29` finding

### AC7 — C29: valid non-null `verdict` values → no C29

- **Verifies:** AC7
- **Action:** each of `PROCEED | REDESIGN | DEFER | REJECT`
- **Expected result:** no `C29` finding for any

### AC8 — extend the existing "AC6: fully-valid fixture" self-test

- **Verifies:** AC8 (partially — the full AC8 confirmation is the integration step below, not a self-test)
- **Action:** extend the existing fully-valid fixture (feature + story object) to include a fully-valid `guardrails[]` entry, `tasks[]` entry, and `spikes[]` entry, and assert none of the new `C15`–`C29` codes fire against it
- **Expected result:** no new code fires against a fixture that is valid by construction

---

## Integration Tests

### Real `pipeline-state.json` shows 0 new failures after the extension

- **Verifies:** AC8
- **Precondition:** All new checks implemented and merged into the same script
- **Action:** Run `node scripts/check-pipeline-state-integrity.js` against the real, current `.github/pipeline-state.json` on the feature branch (rebased on latest `master`). Separately, run the real Python `jsonschema` validator (the exact command already used this session: `python -c "import json, jsonschema; ... Draft7Validator(schema).iter_errors(data) ..."`) against the same file.
- **Expected result:** the extended script reports the same 0-fail count it already does today (no new findings against real, already-valid data), AND the Python validator independently confirms 0 violations — cross-checked, not just self-reported by the script being extended
- **Edge case:** No

---

## NFR Tests

None — confirmed with story owner. Story's own NFR section states all 4 categories as Not Applicable.

---

## Out of Scope for This Test Plan

- Any new `tests/check-*.js` wrapper file — this script's own established convention is a self-contained embedded self-test harness; a separate wrapper would duplicate, not extend, existing coverage.
- Testing `programmes[]`, `spikes[].verdict` cross-referencing against `$defs.phase4.spikes`, or any of the fleet-registry (`$defs.fleetSquad`/`fleetStateEntry`/`fleetState`) schema definitions — explicitly out of this story's scope (see story's Out of Scope section).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
