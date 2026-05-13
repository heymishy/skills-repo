# Definition of Ready: p4-obs-archive — Story/epic archive toggle for viz

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-obs-archive.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-obs-archive-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-obs-archive-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-20
Epic: E5 — Platform Observability & Measurement
Oversight level: Medium — standard peer review required before merge

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: platform operator reviewing the pipeline dashboard. All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 5 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 5 ACs covered — see test plan. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M2 — Consumer confidence named. |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 1 MEDIUM, 1 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 5 ACs covered. |
| H9 | Architecture constraints section populated | ✅ PASS | Single-file HTML viz, psa.1 extension only, schema constraint, CSS kebab-case, MC-SEC-02. |
| H-E2E | CSS/layout check | ✅ PASS | AC3/AC4 describe viz behaviour; MEDIUM finding 1-M1 (no external JS) acknowledged; governance test T-NFR2 covers it. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | No regulatory requirements. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no credentials in archive payload. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02), Correctness (round-trip fidelity), Performance (AC5 — viz 50+ stories ≤2s), Schema integrity (archivedStoryCount in schema.json). |
| W2 | Scope stability declared | ✅ STABLE | Stable — extends psa.1; viz change is additive only. |
| W3 | MEDIUM findings acknowledged | ✅ | 1-M1 acknowledged — no new external JS files; T-NFR2 governance test covers this. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W3 and W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — Medium oversight; standard peer review required before merge.**

**Upstream gate:** psa.1 (`archive-completed-features.js`) must be present — this story extends it. It is DoD-complete ✅.

**Scope contract:**
- Extend `scripts/archive-completed-features.js`: add `archiveStories(activeState, archiveState, featureSlug)` export. Do not modify existing `archive()` or `mergeState()` function signatures or behaviour.
- AC1: `archiveStories` moves stories with `dodStatus: "complete"` from active feature to archive under parent feature key; active state gets `archivedStoryCount` incremented.
- AC2: Extended `mergeState()` (or confirm existing handles it) reconstitutes archived stories with `archived: true` flag alongside active stories.
- AC3: `dashboards/pipeline-viz.html` — add toggle logic inline. Epic card with `archivedStoryCount > 0` shows "{n} archived" badge. Clicking badge expands/collapses archived story rows. Archived rows hidden by default.
- AC4: `?showArchived=true` query param — when parsed, all archived story rows are visible with muted/greyed CSS class.
- AC5: 50+ story fixture renders without error; expand/collapse completes.
- Add `archivedStoryCount` field to `.github/pipeline-state.schema.json` (under epic or story shape as appropriate).
- Create `tests/check-p4-obs-archive.js` covering all 12 test IDs (T1–T10, T-NFR1, T-NFR2).
- CSS class names: `story-row-archived`, `epic-archive-badge` (kebab-case per arch constraint).
- Do NOT create any new `.js` file in `dashboards/` — all viz logic inline in pipeline-viz.html.

**Architecture constraints:**
- ADR-001: CommonJS (`require`/`module.exports`) for the script extension
- Single-file HTML constraint: all viz JS/CSS inline in `pipeline-viz.html`; no external files
- Schema: `archivedStoryCount` must be added to `pipeline-state.schema.json` before use in viz
- CSS: kebab-case class names; no new external CSS files
- MC-SEC-02: no credentials in archive payload

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — peer review required before merge (Medium oversight)
Date: 2026-04-20

All hard blocks: PASS
Warnings acknowledged: W3 (1-M1 — no external JS; T-NFR2 covers it), W4 (verification script)
Upstream gate: psa.1 DoD-complete ✅
