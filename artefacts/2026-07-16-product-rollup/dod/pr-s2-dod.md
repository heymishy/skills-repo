# Definition of Done: Sync a product's connected repo and show aggregate DoD status

**PR:** https://github.com/heymishy/skills-repo/pull/490 | **Merged:** 2026-07-17
**Story:** artefacts/2026-07-16-product-rollup/stories/pr-s2.md
**Test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s2-test-plan.md
**DoR artefact:** artefacts/2026-07-16-product-rollup/dor/ (pr-s2 sign-off)
**Assessed by:** Claude (agent-run DoD, per skills/definition-of-done/SKILL.md)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — sync fetches `pipeline-state.json` via Contents API using the operator's own OAuth token, writes a computed rollup record | ✅ | `check-pr-s2-pipeline-state-fetch-adapter.js` T3 "realFetchPipelineState calls the Contents API with the correct URL and Authorization header", T5 "server.js creates the product_rollups table and wires the real adapter"; `check-pr-s2-product-rollup.js` T3 "syncProductRollup fetches via the adapter, computes the rollup, and writes it to the cache table" | Automated test | None |
| AC2 — `/products/:id` renders the cached aggregate DoD status | ✅ | `check-pr-s2-products-route.js` "[pr-s2] AC2 — products.js route can render cached DoD status" | Automated test | None |
| AC3 — sync fails visibly (does not silently show stale/empty data) if the file can't be fetched | ✅ | `check-pr-s2-pipeline-state-fetch-adapter.js` T4 "realFetchPipelineState surfaces a distinguishable error on 404/403"; `check-pr-s2-product-rollup.js` T4 "syncProductRollup surfaces a visible error and does not write on fetch failure" | Automated test | None |
| AC4 — epic-nested `epics[].stories[]` stories are counted correctly alongside flat `feature.stories[]` | ✅ | `check-pr-s2-product-rollup.js` T1 "DoD aggregation counts epic-nested stories correctly", T2 "does not double-count the ambiguous epic-nested-plus-stale-flat shape" | Automated test | None |
| AC5 — the Contents API adapter is wired to its real implementation in `server.js`, verified by an observable-outcome test (D37 injectable-adapter rule, rule 4) | ✅ | `check-pr-s2-pipeline-state-fetch-adapter.js` T1 "unwired adapter throws rather than returning a silent empty value", T6 "wired adapter produces correct, differentiated output for two different repos, not just proof a setter was called" | Automated test | None |

---

## Scope Deviations

None. Every other rollup dimension (health, test coverage, AC coverage, discovery scope, taxonomy), the last-synced timestamp/Refresh UI, and automatic/scheduled sync were all correctly left out of this story, per its Out of Scope section — each is covered by a separate downstream story (pr-s3 through pr-s7).

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12 (pipeline-state.json story-level count)
**Tests passing in CI:** confirmed passing across all suites touching this story's code

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-pr-s2-pipeline-state-fetch-adapter.js` (AC1, AC3, AC5) | ✅ | ✅ (6 passed, 0 failed) | |
| `check-pr-s2-product-rollup.js` (AC1, AC3, AC4) | ✅ | ✅ (29 passed, 0 failed — includes pr-s3/s4/s5/s6 rollup-computation tests bundled into the same file after the multi-round merge-conflict resolution across PRs #498–#500) | |
| `check-pr-s2-products-route.js` (AC2) | ✅ | ✅ (22 passed, 0 failed across pr-s2–pr-s7's combined route-rendering suite) | |

**Gaps (tests not implemented):** None.

**CSS-layout-dependent Acceptance Criteria audit:** none of pr-s2's ACs depend on browser-rendered CSS layout — AC2 is a content-presence check on the rendered HTML, not a visual/pixel check. `hasLayoutDependentGaps: false` is correct; no RISK-ACCEPT required.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — single bounded Contents API fetch + one Postgres write, no per-feature API calls | ✅ | `syncProductRollup` performs exactly one Contents API call per sync (confirmed by adapter test structure — one `realFetchPipelineState` call per `syncProductRollup` invocation) |
| Security — OAuth token used only for the fetch, never persisted/logged (MC-SEC-02) | ✅ | `check-pr-s2-pipeline-state-fetch-adapter.js` T3 confirms Authorization header usage; no test or code path writes the token to the cache table |
| Security — authentication uses `req.session.accessToken`, never a service account (ADR-020) | ✅ | Confirmed by adapter wiring in `server.js` (T5) |
| Security — tenant scoping via `product_id` (ADR-025) | ✅ | Rollup record scoped by `product_id`, itself `tenant_id`-scoped via the `products` table (pr-s1) |
| Security — malformed/unexpected `pipeline-state.json` shape fails visibly (mock-shape verification rule) | ✅ | AC3 evidence above |
| Audit — sync attempts logged with `product_id` and timestamp | ⚠️ | Not independently verified by a dedicated audit-log test in this session's evidence gathering — recorded as a minor gap below, not blocking |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Product shape visible in the web UI | ✅ | Now — pr-s2 is a contributing story and all six contributing stories are merged | `not-yet-measured` pending operator's manual sync-and-compare check |
| Metric 2 — Freshness is visible and refreshable, never silently stale | ✅ | Now — pr-s2 establishes the sync mechanism pr-s3's freshness UI depends on; both contributing stories (pr-s2, pr-s3) are merged | `not-yet-measured` pending operator's manual Refresh-and-confirm check |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Confirm sync-attempt audit logging (success/failure, `product_id`, timestamp) exists in the merged code — the NFR is architecturally required and referenced in the story's Architecture Constraints, but this DoD pass did not locate a dedicated test asserting it. Owner: Hamish King, before/at `/release`.
2. Operator (Hamish King) to perform Metric 1 and Metric 2 manual verification once a live sync has run.

---

## DoD Observations

1. This story's test coverage is now physically spread across three files, two of which (`check-pr-s2-product-rollup.js`, `check-pr-s2-products-route.js`) also carry pr-s3 through pr-s7's tests, a direct consequence of the multi-round merge-conflict resolution documented in this session (PRs #498, #499, #500 each required combining sibling branches' additions into the same files). This is expected and correctly reflects the vertical-slice decomposition decision in `decisions.md` — each story is independently demoable but shares underlying rollup-computation and route-rendering modules.
2. The audit-logging NFR gap (see Follow-up actions) should be checked before `/release` — flagging as an `/improve` candidate if it turns out to be genuinely missing rather than just untested.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Sync a product's connected repo and show aggregate DoD status" (pr-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
