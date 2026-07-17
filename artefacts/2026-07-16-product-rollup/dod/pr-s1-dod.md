# Definition of Done: Designate Product as a named primitive and register skills-framework as a product

**PR:** https://github.com/heymishy/skills-repo/pull/489 | **Merged:** 2026-07-17
**Story:** artefacts/2026-07-16-product-rollup/stories/pr-s1.md
**Test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-16-product-rollup/dor/ (pr-s1 sign-off)
**Assessed by:** Claude (agent-run DoD, per skills/definition-of-done/SKILL.md)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — a `products` row is created scoped to the operator's `tenant_id` | ✅ | `check-pr-s1-self-registration.js` T1 "registerSelfAsProduct creates a product row when none exists", T2 "is idempotent across repeated calls" | Automated test (`tests/check-pr-s1-self-registration.js`) | None |
| AC2 — `/products/:id` returns HTTP 200 and renders skills-framework's product like any other | ✅ | `check-pr-s1-self-registration.js` T7 "GET /products/:id renders skills-framework's product like any other existing product" | Automated test | None |
| AC3 — `docs/concepts/README.md` primitives list gains an eighth "Product" entry | ✅ | `check-pr-s1-primitives-doc.js` "primitives list contains Product as an eighth entry" | Automated test (`tests/check-pr-s1-primitives-doc.js`) | None |
| AC4 — cross-tenant isolation on the product row | ✅ | `check-pr-s1-self-registration.js` T3 "tenant A never sees tenant B's product row", T4 (reverse direction) | Automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The sync mechanism (pr-s2) and any UI beyond the existing product view were correctly left untouched by this story, per its Out of Scope section.

**Bookkeeping deviation (minor):** `.github/pipeline-state.json` records `acTotal: 5, acVerified: 5` for pr-s1, but the story artefact defines only four real Acceptance Criteria (AC1–AC4, all satisfied above). The fifth count traces to `task-5` ("AC5 — confirm adapter wiring not applicable to this story"), a Definition of Ready (D37 injectable-adapter-rule) applicability check, not a genuine acceptance criterion — pr-s1 introduces no injectable adapter, so the check correctly resolved to "not applicable" rather than gating on a real AC5. Corrected to `acTotal: 4, acVerified: 4` as part of this Definition of Done's state write, below.

---

## Test Plan Coverage

**Tests from plan implemented:** 13 / 13
**Tests passing in CI:** 13 / 13

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-pr-s1-self-registration.js` (T1–T4, T7 — AC1, AC2, AC4) | ✅ | ✅ (7 passed, 0 failed) | Full suite result confirmed in this session's `npm test` run |
| `check-pr-s1-primitives-doc.js` (AC3) | ✅ | ✅ (6 passed, 0 failed) | |

**Gaps (tests not implemented):** None.

**CSS-layout-dependent Acceptance Criteria audit:** none of pr-s1's ACs depend on browser-rendered CSS layout (AC2 is an HTTP-status + content-presence check, not a visual/pixel check). `hasLayoutDependentGaps: false` in `pipeline-state.json` is correct; no RISK-ACCEPT required.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — not applicable (one-time row creation, not a runtime hot path) | ✅ | Confirmed: `registerSelfAsProduct` runs once at startup/seed, not per-request |
| Security — no credentials/tokens stored on the product row | ✅ | `repo_owner`/`repo_name` columns only, matching the `prc-s1.1` convention (nfr-profile.md, Security table) |
| Security — tenant scoping (ADR-025) | ✅ | AC4 cross-tenant tests above |
| Accessibility — not applicable (no new UI) | ✅ | Confirmed — story renders through the existing `/products/:id` view unchanged |
| Audit — logged via existing `products.js` creation path | ✅ | `registerSelfAsProduct` uses the same product-creation code path as `prc-s2.1` (create product), no new logging mechanism introduced |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Product shape visible in the web UI | ✅ (0% baseline recorded in benefit-metric.md) | Now — pr-s1 is the first of six contributing stories (pr-s1, pr-s2, pr-s4, pr-s5, pr-s6, pr-s7) and all six are now merged | Full measurement (Metric 1's manual verification: trigger sync, compare `/products/:id` against a hand-computed `pipeline-state.json` aggregate) is an operator action not yet performed — recorded as `not-yet-measured` in pipeline-state.json pending Hamish King's manual check |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

The only deviation is the minor `acTotal`/`acVerified` bookkeeping mismatch noted above (corrected in this Definition of Done's state write) — no AC, scope, test, or NFR gap exists.

**Follow-up actions:**
1. Operator (Hamish King) to perform Metric 1's manual verification once a live sync has run against skills-framework's own product row (blocked on no single story — this is a whole-feature, post-pr-s2-sync action).

---

## DoD Observations

1. Bookkeeping discrepancy found and corrected: `pipeline-state.json`'s `acTotal`/`acVerified` for pr-s1 (5) did not match the story artefact's real AC count (4). Root cause: a Definition of Ready task-level check (D37 applicability confirmation) was counted as if it were an AC. Not a `/improve` candidate on its own, but worth naming if this pattern recurs across other stories in this feature (checked: none of pr-s2 through pr-s7 show the same task-vs-AC count mismatch).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Designate Product as a named primitive and register skills-framework as a product" (pr-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
