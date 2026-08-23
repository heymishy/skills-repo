# Definition of Done: Wire the viewer-write-block gate to Credits/billing routes

**PR:** https://github.com/heymishy/skills-repo/pull/758 | **Merged:** 2026-08-23
**Story:** artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s3-credits-billing.md
**Test plan:** artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s3-test-plan.md
**DoR artefact:** artefacts/2026-08-21-viewer-role-no-enforcement/dor/vrne-s3-dor.md
**Assessed by:** Claude (agent) + Hamish King (Founder/Operator)
**Date:** 2026-08-23

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Viewer denied on `POST /billing/checkout`, no Stripe Checkout session created | `tests/check-vrne-s3-billing-gate.js` (AC1 unit test) + real-dispatch integration test | None |
| AC2 | ✅ | `engineer`/`admin` roles proceed with no regression | `tests/check-vrne-s3-billing-gate.js` (AC2 regression tests, both roles) | None |
| AC3 | ✅ | Denial logged with `personId`, `tenantId`, `timestamp`, `route` | `tests/check-vrne-s3-billing-gate.js` (AC3 unit test) + observed in integration test | None |
| AC4 | ✅ | `POST /webhook/stripe` unaffected by the gate | `tests/check-vrne-s3-billing-gate.js` (AC4 static-source regression guard, re-confirmed post-wiring by final reviewer) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

No deviations. Smallest and cleanest story in the epic — 1 call site, 4 ACs, no AC-wording gaps like `vrne-s1`'s AC4 role enumeration and no cross-story regression like `vrne-s2`'s mock-session gap. Pre-verified before implementation (via a source read of the two pre-existing checkout/CSRF test files) that no such regression risk existed here, and the final reviewer confirmed that analysis was correct.

---

## Scope Deviations

None. Diff touched only `src/web-ui/server.js`'s `/billing/checkout` branch (8 lines) and the new test file. `src/web-ui/routes/billing.js` (Stripe checkout handler, credit logic) and `src/web-ui/middleware/require-non-viewer.js` (the shared gate) were confirmed byte-for-byte unmodified.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (5 planned + 1 real-dispatch integration test, matching the sibling stories' established pattern)
**Tests passing in CI:** 6 / 6, plus full suite 537/537 files passing

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 — viewer denied | ✅ | ✅ | `tests/check-vrne-s3-billing-gate.js` |
| AC2 — engineer/admin unaffected (2 tests) | ✅ | ✅ | |
| AC3 — denial logged | ✅ | ✅ | |
| AC4 — webhook unaffected (static-source regression guard) | ✅ | ✅ | Re-confirmed true post-wiring, not just trivially true pre-wiring |
| Integration — real `server.js` dispatch | ✅ | ✅ | Same lazy-`require()` pattern established in `vrne-s2`, independently re-derived by the implementer and verified by the reviewer |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new query pattern | ✅ | Reuses `requireNonViewer` unmodified |
| Security — prevents a read-only-intended role from initiating a real payment-adjacent action | ✅ | AC1 verified; AC2/AC4 are the regression guards |
| Audit — every denial logged | ✅ | AC3 test + observed in integration test |
| Data residency, Availability, Accessibility | N/A | Same rationale as `vrne-s1`/`vrne-s2` |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 (Metric 1 — Viewer role actually enforces read-only access) | ✅ | 2026-08-23 | Now 45/45 routes enforced across Products + Features/journeys (33), Skill sessions (11), Credits/billing (1). Epic-wide target (all 5 route groups) not yet reached — `vrne-s4` still pending. Signal: **on-track**. |
| M2 (Metric 2 — Enumerated viewer-role write actions blocked, Tier 3 risk-reduction) | ✅ | 2026-08-23 | Same evidence as M1: 45 of the epic's total enumerated routes now enforced (up from 44). Epic-wide target of 0 remaining unenforced routes not yet reached. Signal: **on-track**. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required for this story. Epic-level follow-up: `vrne-s4` (edge cases) remains the last story, still at DoR-signed-off.

---

## DoD Observations

1. **Loop-design.md metric overrun found and logged in real time.** This 3-task story ran the full test suite 4 times (branch-setup baseline, `/subagent-execution` Task 3's check, the final AC-review agent's own fresh run, and one extra run dispatched at `/verify-completion` before recognizing the final review's run had already satisfied the Iron Law evidence requirement) — against `loop-design.md`'s target of ≤2 for the 1–3 task band. Logged transparently in the PR body's Notes section and in `workspace/capture-log.md`. `/improve` candidate: `loop-design.md`'s guidance on full-suite run scope should more explicitly instruct checking for an already-fresh same-session result before dispatching another run, not just naming the 3 anchor points.
2. **Two independent agents (the Task 2 implementer, then the Task 2 spec reviewer) both correctly re-derived and verified the same lazy-`require()` fix** that `vrne-s2` needed for its own integration test, without being told the exact fix — only that the plan's literal code sample had the same underlying risk. This is a positive signal that the pattern is now well-enough understood across dispatches that it doesn't need to be spelled out verbatim in every future story's plan; a one-line pointer to the precedent may be sufficient going forward.
3. **A review-dispatch scoping mistake by the orchestrating session caused an initial false "Critical" finding on Task 1**, later corrected by re-dispatching with clarified scope. The first code-quality review of Task 1 (a RED-only task, no wiring yet) incorrectly flagged the missing wiring/integration test as Critical, not recognizing that Task 2 (not yet dispatched) was explicitly responsible for that work — an artefact of an under-specified review prompt, not a real defect. Re-dispatching with explicit scope context (citing the established `vrne-s1`/`vrne-s2` two-phase precedent) resolved it correctly. `/improve` candidate: review-dispatch prompts for any task that is explicitly RED-only (or otherwise partial-by-design) should proactively state that scope in the prompt itself, not rely on the reviewer inferring it from the plan file.
4. Full detail on all three observations is recorded in `artefacts/2026-08-21-viewer-role-no-enforcement/decisions.md` and `workspace/capture-log.md`'s 2026-08-23 entries.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Wire the viewer-write-block gate to Credits/billing routes" (vrne-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
