# Definition of Done: Define `workspace/capture-log.md` schema and `/capture` operator command

**PR:** https://github.com/heymishy/skills-repo/pull/200 | **Merged:** 2026-04-28
**Story:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.1.md
**Test plan:** artefacts/2026-04-28-inflight-learning-capture/test-plans/ilc.1-test-plan.md
**DoR artefact:** artefacts/2026-04-28-inflight-learning-capture/dor/ilc.1-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `capture-instruction-present`, `capture-schema-five-fields`, `capture-signal-types-enumerated` — all 5 fields and 6 signal-type values present in `copilot-instructions.md` | automated test (check-ilc1-capture-schema.js) | None |
| AC2 | ✅ | `capture-append-preserves-existing`, `capture-append-no-truncate` — second append does not modify earlier entry | automated test | None |
| AC3 | ✅ | `capture-source-operator-manual` — operator-invoked entry uses `source: operator-manual` | automated test | None |
| AC4 | ✅ | `capture-blank-guard` — instruction contains explicit guard against writing a blank entry; requires operator input before writing | automated test | None |
| AC5 | ✅ | `capture-new-session-appends`, `capture-new-session-no-overwrite` — prior session entries preserved on new invocation; file grows, never empties | automated test | None |
| AC6 | ✅ | `gitignore-excludes-capture-log` — `workspace/capture-log.md` is excluded via `.gitignore` entry | automated test | None |

**Deviations:** None.

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12 total
**Tests passing in CI:** 12 / 12 implemented

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| capture-instruction-present | ✅ | ✅ | |
| capture-schema-five-fields | ✅ | ✅ | |
| capture-signal-types-enumerated | ✅ | ✅ | |
| capture-append-preserves-existing | ✅ | ✅ | |
| capture-append-no-truncate | ✅ | ✅ | |
| capture-source-operator-manual | ✅ | ✅ | |
| capture-blank-guard | ✅ | ✅ | |
| capture-new-session-appends | ✅ | ✅ | |
| capture-new-session-no-overwrite | ✅ | ✅ | |
| gitignore-excludes-capture-log | ✅ | ✅ | |
| capture-append-no-parser-dependency | ✅ | ✅ | NFR |
| capture-entry-is-plain-markdown | ✅ | ✅ | NFR |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Durability — append-only write; file never truncated or overwritten | ✅ | `capture-append-no-truncate` and `capture-new-session-no-overwrite` pass; instruction text uses "always append after existing entries; never truncated or overwritten" |
| Portability — plain markdown format; no parser or external dependency required | ✅ | `capture-entry-is-plain-markdown` passes; entry is plain YAML-in-markdown string; no require() calls in implementation |
| No external dependencies — `/capture` implementation must not introduce new npm packages | ✅ | `capture-append-no-parser-dependency` passes (0 new production dependencies); implementation is instruction text only |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Signal loss rate (≤1 loss event across 3 consecutive sessions) | ✅ (5 documented loss events in April 2026) | After first 3 post-delivery sessions | Mechanism now active: `/capture` command available; `capture-log.md` runtime file created on first use |
| M2 — In-session agent capture rate (≥80% sessions with ≥1 agent-auto entry) | ❌ (baseline is 0%) | After ilc.2 merges (agent self-recording instruction) | ilc.1 delivers the file convention; agent auto-writes require ilc.2 instruction |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None — M2 measurement depends on ilc.2 (merged same day). Monitor M1 over next 3 sessions.

---

## DoD Observations

1. Test count in `pipeline-state.json` at PR open recorded as 12 (correct). `totalTests` and `passing` counts confirmed accurate.
2. `prStatus` was incorrectly showing `"draft"` in pipeline-state.json at time of DoD — corrected as part of this DoD run to `"merged"`.
