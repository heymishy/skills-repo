# Definition of Ready: Signals panel route handler — `/api/signals` endpoint

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s2.md
**Test plan reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s2-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

**Rebuild note:** Replaces a prior, non-conformant DoR file at this path (same pattern as `ep1-s1-dor.md` — see `decisions.md`).

---

## Contract Proposal

**What will be built:**
A new route file `src/web-ui/routes/signals.js` registering `GET /api/signals` in `server.js`, calling `ep1-s1`'s `getSignals(repoPath)` on every request (on-demand, no caching), returning the result as JSON with HTTP 200, or HTTP 500 with a structured `{error, timestamp}` body if the aggregator throws. A test-only `setSignalsAggregator(fn)` override for stubbing in tests.

**What will NOT be built:**
No signal filtering, no caching, no HTML rendering (JSON-only; dashboard JavaScript owns rendering — that's `ep1-s3`/future work), no multi-tenant isolation.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real router dispatch with stubbed aggregator, confirm 200 + array passthrough | Unit + Integration |
| AC2 | Inspect response fields with/without optional context | Unit |
| AC3 | Stubbed aggregator throws, confirm 500 + structured error, real dispatch too | Unit + Integration |
| AC4 | Timed call with artificial aggregator delay | Unit |
| AC5 | Two successive calls, compare responses | Unit |

**Assumptions:**
`ep1-s1`'s aggregator interface (`getSignals(repoPath)`) is frozen and stable enough for `ep1-s2` to implement against, even before `ep1-s1`'s own PR merges — matches the story's own stated "may run in parallel if the aggregator interface is frozen and documented before implementation" dependency note.

**Estimated touch points:**
Files: `src/web-ui/routes/signals.js` (new), `server.js` (1 new route registration + require), `tests/signals-route.test.js` (new).
Services: None new.
APIs: 1 new route (`GET /api/signals`) on existing infrastructure.

## Contract Review

✅ **Contract review passed** — proposed implementation directly satisfies AC1–AC5; no mismatch.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "Solo operator (you, today)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test in the test plan | ✅ | 10/10 tests, 0 gaps |
| H4 | Out-of-scope populated | ✅ | 5 items |
| H5 | Benefit linkage names a metric | ✅ | "Metric 2 — Improvement signal surfacing (benefit-metric.md)" |
| H6 | Complexity rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review Run 2: 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies names `ep1-s1` as upstream — `schemaDepends: ["dorStatus", "prStatus"]` declared; both fields confirmed present in `.github/pipeline-state.schema.json` |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-024 correctly cited; review Category E: no violations |
| H-E2E | CSS-layout-dependent gap without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs — JSON API route only |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-28-weeb-ui-learnings-and-improvements/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence | ✅ | Story declares NFRs; profile present |
| H-GOV | Governance approval (discovery `## Approved By`) | ✅ | "Hamish King — Operator / Product Owner — 2026-09-29" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | `setSignalsAggregator` is a same-process test-only override, not a D37 external-boundary adapter — matches this story's own explicit design decision (carried forward from the recovered "Decision 5" content) |
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
| W4 | Verification script reviewed by a domain expert | ⚠️ Not yet done | Script may not perfectly reflect real-world usage nuance | Pending — same as `ep1-s1`, recommend operator review before coding |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table: None | — |

---

## Standards Injection

Story has no `domain` field — skipped silently.

---

## Oversight Level

**Epic oversight:** Medium (per `epics/signals-foundation-launcher-redesign.md`). DoR artefact to be shared before assigning.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Signals panel route handler: `/api/signals` endpoint
Story artefact: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s2.md
Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New route file src/web-ui/routes/signals.js, registering GET /api/signals
  in server.js using this codebase's existing dispatch pattern.
- Calls ep1-s1's getSignals(repoPath) on every request -- on-demand, no
  server-side caching.
- Returns JSON array only, HTTP 200 on success.
- If the aggregator throws, returns HTTP 500 with a structured
  { error, timestamp } body -- never a partial 200.
- Provide a test-only setSignalsAggregator(fn) override so tests can stub
  ep1-s1's aggregator without depending on its real file-reading behaviour.
- Do NOT modify ep1-s1's own aggregator module.
- Do NOT build any HTML rendering -- API route only, JSON response.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. ADR-024 (GET response shape contract) is directly relevant.
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
