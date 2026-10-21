# DoR Contract Proposal: Extend to full-feature capture loop with timing validation

**Story:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s2.md`
**Date:** 2026-10-21

---

## What will be built

- A `POST` "capture all evidence" endpoint that: builds the capture-all list from `ppc-s1`'s `captureTargets` (skipping untargeted ACs with a named reason), loops the single-AC mechanism from `ppc-s1` sequentially, blocks a second concurrent trigger for the same feature via an in-progress flag, measures and persists real elapsed wall-clock time, and logs a `decisions.md` SCOPE note if that time exceeds 60 seconds.
- A progress-reporting mechanism with an `aria-live` region for screen-reader announcement.
- Partial-failure handling: one AC's capture failure produces a retry-flagged entry without discarding the other ACs' successful results.

## What will NOT be built

- Rate limiting (`ppc-s3`).
- An async job queue — only if AC4's real-data trigger fires in practice, as its own new story, never built speculatively here.
- Video capture, redaction, ffmpeg polish (epic-level out of scope).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Loop over targeted ACs, reusing `ppc-s1`'s mechanism | unit + integration |
| AC2 | Loading state + concurrency block | integration |
| AC3 | Real elapsed time recorded | unit + integration |
| AC4 | >60s run logs a SCOPE note, doesn't fail the run | unit + integration |
| AC5 | Partial failure doesn't discard other results | unit |
| AC6 | Untargeted ACs skipped with a named reason | unit + integration |

## Assumptions

- `ppc-s1`'s session-to-Playwright adapter and `captureTargets` data shape are already implemented and merged before this story starts (per Dependencies below).
- The in-progress concurrency flag can be held in-memory per feature for the duration of a single capture-all run — no new durable table is needed for this (the run completes synchronously within one request/response cycle).

## Estimated touch points

**Files:** The route module from `ppc-s1` (extended with the capture-all endpoint), `src/web-ui/modules/journey-store.js` (list-building/skip-reason helper), a small progress-rendering component.
**Services:** Postgres (`journeys.data`), the `ppc-s1` Playwright adapter and `commitArtefact` extension (reused, not re-built).
**APIs:** No new external API surface.

## Schema Dependencies

`schemaDepends: []`

This story's upstream dependency on `ppc-s1` is at the application-code/data-model level (the `journeys.data.captureTargets` shape and the session-to-Playwright adapter), not a `pipeline-state.json` field dependency — H8-ext's schema check is about pipeline-state.json's own schema (`pipeline-state.schema.json`), which this story does not read or write. No fields declared because none apply.

---

## Contract Review

Checked against all 6 ACs and the test plan — no mismatches found.

✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | Tenant Product Owner |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | |
| H5 | Benefit linkage references a named metric | ✅ | Metric 2 — Time to DoD sign-off |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Run 2: 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` — application-level dependency on `ppc-s1`, not a pipeline-state.json field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | |
| H-E2E | CSS-layout-dependent AC gate | ✅ (N/A) | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | None identified |
| H-NFR3 | Data classification not blank | ✅ | Confidential (feature-level profile) |
| H-NFR-profile | NFR profile exists | ✅ | |
| H-GOV | Discovery `## Approved By` populated, non-engineering entry | ✅ | Same discovery artefact as `ppc-s1` |
| H-ADAPTER | New adapter wiring AC | ✅ (N/A) | No new adapter — reuses `ppc-s1`'s session-to-Playwright adapter unchanged |
| H-INF / H-MIG / H-DESIGN | Track-specific gates | ✅ (skipped) | All three track flags absent on this feature |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | |
| W2 | Scope stability declared | ✅ | — | |
| W3 | MEDIUM findings acknowledged | ✅ | — (0 MEDIUM remain) | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet walked through before coding starts | RISK-ACCEPT — Hamish King, 2026-10-22, see `decisions.md` |
| W5 | No UNCERTAIN gap-table items | ✅ | — | |

---

## Standards injection

Domain tags: `[web-ui]`
Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extend to full-feature capture loop with timing validation — artefacts/2026-10-20-production-playback-capture/stories/ppc-s2.md
Test plan: artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS modules (require), matching this repo's existing src/web-ui/ convention.
- Reuse ppc-s1's session-to-Playwright adapter and commitArtefact extension as-is —
  do not build a second, parallel capture mechanism.
- Capture stays synchronous for this story (per discovery.md's own trigger-mechanics
  decision) — do not introduce a job queue even if AC4's threshold fires; log the
  SCOPE note in decisions.md instead and stop there.
- Progress indicator must use an aria-live region, not a purely visual indicator.
- Rate limiting, video capture, redaction, and ffmpeg polish are explicitly out of
  scope — do not build them in this story's PR.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium

## Applicable standards

### From .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)
[Full file content applies wherever relevant to this story's extension of the
existing route — injectable adapter pattern (D37/ADR-009, not re-triggered here
since no new adapter is introduced), progress display invariant section, and the
silent-fallback three-path test coverage requirement if any fallback behaviour is
introduced for the partial-failure handling in AC5.]
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Share the DoR artefact with the tech lead (operator awareness stands in).
**Signed off by:** Hamish King (Platform Owner), 2026-10-22

**Definition of ready: PROCEED**
