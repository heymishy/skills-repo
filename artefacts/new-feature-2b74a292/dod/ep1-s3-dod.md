# Definition of Done: Feature Inherits Product Default Pod on Creation (ep1-s3)

**PR:** https://github.com/heymishy/skills-repo/pull/899 | **Merged:** 2026-09-17
**Story:** artefacts/new-feature-2b74a292/stories/ep1-s3.md
**Test plan:** artefacts/new-feature-2b74a292/test-plans/ep1-s3-test-plan.md
**DoR artefact:** artefacts/new-feature-2b74a292/dor/ep1-s3-dor.md — note: the DoR's own touch-points and response-shape assumptions were wrong (see decisions.md, 2026-09-17); this story's real implementation targets `handlePostProductFeature` in `products.js`, not the assumed `features.js`/`/api/features`.
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-ep1-s3-feature-pod-inheritance.js` Part 2 (real handler call via `handlePostProductFeature`, asserts a real `pod_assignments` row with `feature_id = journeyId`, correct `pod_id`, correct `assignment_type`) + `tests/e2e/ep1-s3-feature-pod-inheritance.spec.js` (real HTTP dispatch through the real server, real `fake-test-db.js`, asserting `podAssignmentCount === 1` via a purpose-built test-only DB-state-read endpoint). | `integration-real-code` (unit) + `live-verified` (E2E, real server process, staging CI) | None |
| AC2 | ✅ | `tests/check-ep1-s3-feature-pod-inheritance.js` Part 3 (exactly 3 `feature_collaborators` rows, matching all 3 named pod members, each referencing the source pod) + E2E test (`collaboratorCount === 2`, matching the E2E fixture's own real pod membership). | `integration-real-code` (unit) + `live-verified` (E2E) | None |
| AC3 | ✅ | `tests/check-ep1-s3-feature-pod-inheritance.js` Part 4 (roles asserted against exact expected values per person, with a deliberately shuffled `pod_members` insertion order proving lookup is by `userId` not array position, plus a row-count guard against a masked duplicate). | `integration-real-code` (unit) | See NFR/Metric notes below — no E2E-level role assertion, since this story's E2E scope only proves the dispatch path writes data at all (via counts), not per-row role correctness; that's fully covered at the unit level against the real handler instead. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The "Out of Scope" items (overriding the pod assignment during creation, listing pod members in the creation UI, `getFeatureCollaborators()` as a public canonical-builder API) were not implemented — confirmed against the full diff during final review: only `feature-collaborator-store.js` (new), `pod-assignment-store.js` (one new function, `setFeatureDefaultPod`), `products.js` (the pod-inheritance injection), `server.js` (schema wiring + one test-only endpoint), `fake-test-db.js`, and tests were touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 8/8 planned (3 unit, 2 integration/tenant-isolation, 3 NFR) — plus significant additions the review cycle surfaced as necessary beyond the original plan: a corrected (non-vacuous) tenant-isolation test with a positive control, a missing row-count assertion, and — most substantially — the entire real end-to-end HTTP-level verification mechanism (the `/test/pod-inheritance-state/:sessionId` endpoint), which the original plan's own design incorrectly assumed was unnecessary (it reasoned a successful redirect was sufficient proof; this was disproven during review).
**Tests passing in CI:** 23/23 unit assertions, 1/1 E2E test, and the full `npm test` suite (671 files, only the pre-existing, unrelated `tests/check-p3.5-validate-trace.js` failure).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 pod_assignments recorded (unit) | ✅ | ✅ | Part 2 |
| AC2 feature_collaborators pre-populated (unit) | ✅ | ✅ | Part 3 |
| AC3 role accuracy (unit) | ✅ | ✅ | Part 4, with an added row-count guard found missing by review |
| Tenant isolation (integration) | ✅ (corrected during review — original version was vacuous) | ✅ | Part 5 |
| Real end-to-end HTTP dispatch (E2E) | ✅ (the E2E design itself was corrected during review — original was vacuous) | ✅ | `tests/e2e/ep1-s3-feature-pod-inheritance.spec.js` |
| NFR-Perf-1 (creation + inheritance ≤2s) | ❌ | N/A | Not automated — see NFR section |
| NFR "collaborators visible in feature settings immediately" | ❌ | N/A | No UI exists yet to verify this against (deferred to Epic 2, per the DoR's own explicit scope) |

**Gaps (tests not implemented):**
1. NFR-Perf-1 has no automated timing assertion — same class of gap as `ep1-s1`/`ep1-s2`'s own NFR-Perf-1 entries. RISK-ACCEPTed below.
2. "Collaborators visible in feature settings immediately" cannot be verified at all yet, since no UI surfaces feature collaborators — this is an honest, structural gap (not a test-writing gap), explicitly anticipated by the DoR's own "Out of Scope" framing (no collaborator-listing UI this story).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Feature creation with default pod inheritance completes within 2 seconds | ⚠️ | No automated measurement. RISK-ACCEPT logged below. |
| Collaborators are visible in feature settings immediately after creation (no additional query needed) | ⚠️ | Cannot be verified — no UI exists to observe this yet. The underlying data (`feature_collaborators`) IS written immediately and synchronously during feature creation (confirmed by the unit/E2E tests), so the data-layer half of this NFR is satisfied; the UI-visibility half is unverifiable until Epic 2 builds that UI. |
| Roles are correctly preserved (no defaults, no drops) | ✅ | Unit test Part 4, exact per-person role assertions |

---

## Metric Signal

**Observation (same structural gap already noted in `ep1-s1`/`ep1-s2`'s own DoDs):** `new-feature-2b74a292`'s `pipeline-state.json` feature entry still has no `metrics[]` array populated. `benefit-metric.md`'s "Synchronous team access" indicator conceptually reaches its full walking-skeleton completion with this story — ep1-s1 creates a pod, ep1-s2 assigns it as a product default, ep1-s3 makes feature creation actually consume that default — but the indicator isn't wired into the structured format this skill reads from.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Synchronous team access (benefit-metric.md indicator, not yet in pipeline-state.json `metrics[]`) | ❌ — not structurally wired | **Now, structurally** — this story is the last piece of the 3-story "walking skeleton" (ep1-s1 → ep1-s2 → ep1-s3). A team of 3 people can now: exist as a pod (ep1-s1), be assigned as a product's default (ep1-s2), and be automatically inherited by every new feature under that product (ep1-s3) — the full loop the original discovery/benefit-metric artefact described. No UI yet exposes this end-to-end to a real user (feature collaborators aren't shown anywhere), so a genuine operator-observed measurement still isn't possible, but the data-layer capability is now complete. | Same structural gap already flagged in ep1-s1/ep1-s2's DoDs; not re-fixing here to avoid an unreviewed change to shared feature-level state outside this story's own scope. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. NFR-Perf-1 (2s latency target) has no automated measurement — RISK-ACCEPT logged in `decisions.md`.
2. "Collaborators visible in feature settings" NFR cannot be verified until Epic 2 builds a UI surface for it — tracked as a structural, not a testing, gap.
3. `new-feature-2b74a292`'s `pipeline-state.json` `metrics[]` array remains unpopulated — same carried-forward note as ep1-s1/ep1-s2's own DoDs; worth a single pipeline-bookkeeping pass across all three once convenient, not per-story.
4. **Two `/improve` candidates surfaced by this story's review cycle**, both logged in `decisions.md` and worth feeding back into the pipeline's own skill files:
   - `/definition-of-ready`'s touch-point estimation step could benefit from a quick grep-verification pass against the real codebase before sign-off (this story's DoR assumed an entire architecture — `features.js`, `/api/features`, a `featureId` table — that simply doesn't exist).
   - `/implementation-plan`'s own reasoning about "what counts as sufficient E2E proof" needs a stronger default: a redirect/200-status-only assertion is not sufficient proof of correctness whenever the underlying handler wraps its own logic in non-fatal error handling — this exact pattern (silent, swallowed failure + a coarse success signal) produced a genuinely vacuous E2E test that took a dedicated review pass to catch, and the fix uncovered a second, real data-corruption bug (test-double INSERT-prefix collision) that had been silently masking failures in this story's own write path the whole time.

---

## DoD Observations

1. **The story's own architecture assumptions were comprehensively wrong, caught before any code was written.** The DoR named `src/web-ui/routes/features.js` and `POST /api/features` as touch points, and assumed a `features` table with a `featureId` primary key and a JSON response body. None of this exists: the real handler is `handlePostProductFeature` in `products.js` (already extended once by `ep1-s2`), "features" are `journeys` in this codebase's real domain model, and the real response is an HTTP redirect with no body. This is the same class of gap already found in `ep1-s2`'s own DoR (a route-prefix assumption, a nonexistent page) but materially deeper here — it was the entire data model, not a URL convention. Caught during planning by reading the actual codebase rather than trusting the DoR's literal text, before any implementation began.
2. **A cross-cutting, unrelated sibling story's own test needed a genuine update.** `das-s2`'s NFR test (`tests/check-das-s2-require-connected-repo.js`) asserted `handlePostProductFeature` issues exactly 1 SQL query — a reasonable regression guard against N+1 bugs when it was written, before this story added a real, necessary, unavoidable second query (`getProductDefaultPod`) to that same shared handler. Updated the assertion from 1 to 2 and renamed the test to reflect its real intent (a bounded-query-count guard, not a literal-1 guard), with the change independently verified as a real architectural consequence, not test-gaming, before being accepted.
3. **The most significant finding this story produced: a genuinely vacuous E2E test, and what fixing it uncovered.** The implementer's own plan (this session's own design, not an artefact inherited from `/test-plan`) reasoned that a successful HTTP redirect was sufficient proof the pod-inheritance dispatch path executed correctly, since no UI exists to inspect the written data and the real handler has no JSON response. This reasoning was empirically wrong: because `handlePostProductFeature`'s pod-inheritance block is deliberately non-fatal (wrapped in try/catch, matching this handler's own established resilience pattern for its other side effects), and because `fake-test-db.js`'s own unhandled-query fallback silently returns empty rows rather than throwing, the exact same passing redirect occurred whether pod-inheritance worked correctly, failed silently, or was entirely absent — proven by temporarily reverting the entire `fake-test-db.js` extension and re-running the E2E spec, which still passed 1/1. Fixed with a new test-only, `NODE_ENV=test`-gated DB-state-read endpoint (the first `/test/*` endpoint in this codebase that reads rather than seeds state), and while wiring it, found and fixed a SECOND, more serious, unrelated bug: `fake-test-db.js` had a single branch matching `INSERT INTO pod_assignments (` as a bare prefix, ambiguously catching both `ep1-s2`'s 6-param product-level upsert and `ep1-s3`'s own 7-param feature-level insert — silently corrupting a tenant's product-level default-pod row every time a feature-level assignment was written, in every test using the fake DB. This second bug had been invisible to this story's own Tasks 1-5 (23 unit assertions, all passing) specifically because those tests use a separate, simpler, correct mock local to the test file itself — only Task 7's E2E spec routes through the real server + `fake-test-db.js`, which is exactly why building a genuine (non-vacuous) E2E check mattered here far beyond process box-ticking. Both fixes independently re-verified (including confirming zero collateral impact on `ep1-s2`'s own full 38-test suite) before this DoD was written. **/improve candidate:** flag this pattern (non-fatal error handling + a coarse-grained success signal = insufficient E2E proof) as a named anti-pattern for `/implementation-plan`'s own guidance, not just a lesson learned once in this story's `decisions.md`.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep1-s3 (Feature Inherits Product Default Pod on Creation).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
