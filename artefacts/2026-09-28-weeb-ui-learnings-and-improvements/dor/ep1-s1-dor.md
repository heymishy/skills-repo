# Definition of Ready: Signals aggregator module — read all 12 sources and normalize to Signal shape

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s1.md
**Test plan reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

**Rebuild note:** Replaces a prior, non-conformant DoR file at this path that declared "PROCEED — Signed off for inner loop" with no Hard Blocks table and no real gate verification behind it — a real casualty of the pre-Sonnet-routing-fix Haiku bug documented in `decisions.md`. This is a genuine, fresh DoR pass.

---

## Contract Proposal

**What will be built:**
A new server-side module `src/web-ui/modules/signals-aggregator.js` exporting `getSignals(repoPath)`, which reads all 12 workspace/framework signal sources (capture-log, learnings, proposals, suite, results, traces, decisions, DoD, reference, estimation-norms, pipeline-state, architecture-guardrails) using built-in `fs`/`path` only, and returns a normalized, sorted `Signal[]` array. An injectable file-read adapter (D37, throwing stub default) so tests can stub disk access.

**What will NOT be built:**
No per-source parsing robustness beyond basic string/JSON tolerance (deferred to Epic 2). No caching. No dashboard rendering or display logic — this module's output is consumed by `ep1-s2`'s route handler, not rendered directly.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real aggregator run against a fixture workspace covering all 12 sources | Integration |
| AC2 | Inspect returned Signal shape for required/optional fields | Unit |
| AC3 | Inject a malformed source, confirm parse-error signal + continued parsing | Unit |
| AC4 | Inspect sort order across mixed-timestamp fixture | Unit |
| AC5 | Compare source entry count to aggregator output count | Unit/Integration |

**Assumptions:**
Fixture workspace files can be committed under `tests/fixtures/signal-workspace/` for stable, repeatable tests. The injectable file-read adapter's default stub throws (D37-compliant) — production wiring happens in `server.js` at startup, same pattern as every other D37 adapter in this codebase.

**Estimated touch points:**
Files: `src/web-ui/modules/signals-aggregator.js` (new), `tests/signals-aggregator.test.js` (new), `tests/fixtures/signal-workspace/` (new, optional fixture files).
Services: None new.
APIs: None (this module has no HTTP surface — `ep1-s2` provides that).

## Contract Review

✅ **Contract review passed** — proposed implementation directly satisfies AC1–AC5; no mismatch between the contract and the story's stated ACs or test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "Solo operator (you, today)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test in the test plan | ✅ | 10/10 tests, 0 gaps |
| H4 | Out-of-scope populated | ✅ | 5 items |
| H5 | Benefit linkage names a metric | ✅ | "Metric 2 — Improvement signal surfacing (benefit-metric.md)" |
| H6 | Complexity rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review Run 2: 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: "None" — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-028, D37 both correctly cited; review Category E: no violations |
| H-E2E | CSS-layout-dependent gap without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs — server-side module only |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-28-weeb-ui-learnings-and-improvements/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence | ✅ | Story declares NFRs; profile present |
| H-GOV | Governance approval (discovery `## Approved By`) | ✅ | "Hamish King — Operator / Product Owner — 2026-09-29" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | Story's own Architecture Constraints names the injectable file-read adapter with a throwing stub; production wiring in `server.js` is a required, named implementation-plan task |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ N/A | Review Run 2: 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ Not yet done | Script may not perfectly reflect real-world usage nuance | Pending — operator to review `verification-scripts/ep1-s1-verification.md` before assigning to a coding agent |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table: None | — |

**W4 is open** — flagged, not silently passed. Recommend the operator review the verification script before coding begins; this does not block DoR sign-off itself (per this repo's own established solo-operator RISK-ACCEPT posture) but should be closed before assigning to a coding agent for maximum confidence.

---

## Standards Injection

Story has no `domain` field — skipped silently, matching this repo's own convention for stories without a declared domain.

---

## Oversight Level

**Epic oversight:** Medium (per `epics/signals-foundation-launcher-redesign.md`) — "The signals aggregator touches 12 different file types and formats across the workspace, requiring robust parsing and error handling." DoR artefact to be shared before assigning.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Signals aggregator module: read all 12 sources and normalize to Signal shape
Story artefact: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s1.md
Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New module src/web-ui/modules/signals-aggregator.js exporting
  getSignals(repoPath) -- built-in fs/path only, no new npm dependencies.
- Injectable file-read adapter (D37): default stub MUST throw, not return
  empty/null. Production wiring in server.js is a SEPARATE implementation
  task from the aggregator module itself (D37 rule).
- Parse failures on individual sources surface as signal-type: parse-error
  entries -- never thrown as exceptions that abort the whole aggregation.
- Canonical builder pattern (ADR-028): this module is the single source of
  truth for signal aggregation. Do not let ep1-s2's route handler or any
  other code re-derive this logic.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests, add a PR
  comment describing the specific blocker and stop -- do not improvise.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness only
**Signed off by:** Not required (Medium oversight, DoR PROCEED: Yes)
