# Definition of Done: Golden trace demo — a real idea-to-shipped-code chain, walked in four frames

**PR:** https://github.com/heymishy/skills-repo/pull/683 | **Merged:** 2026-08-08
**Story:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s1-golden-trace-demo.md
**Test plan:** artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-08-landing-page-hero-features/dor/lphf-s1-dor.md
**Assessed by:** Copilot
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (4 sequential frames, real shipped feature) | ✅ | `renderGoldenTraceHtml()` renders 4 frames sourced from `golden-trace-content.js`'s `CANDIDATES` object | automated test (test plan, 6/6 passing) + code review | None |
| AC2 (build-time swappable-candidate mechanism) | ✅ | `ACTIVE_CANDIDATE` constant selects the rendered candidate | automated test + code review | None |
| AC3 (losing candidate deleted before merge) | ❌ | Direct source inspection (2026-08-09): `src/web-ui/content/golden-trace-content.js` still contains **both** `CANDIDATES.kanban` and `CANDIDATES.diagram`, and the `ACTIVE_CANDIDATE` toggle is still live in production code | code review | **Real, confirmed gap.** The comparison-and-choose step this AC required before merge never happened — both candidates shipped to production. |
| AC4 (content matches real artefact files) | ✅ | Confirmed at implementation time against the source artefacts for the active candidate (`kanban`/`s3.1`) | code review | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. AC3 is a genuine failure, not a minor deviation — recorded honestly rather than smoothed over.

---

## Scope Deviations

None beyond AC3 above (which is an AC shortfall, not a scope violation — nothing out-of-scope was implemented).

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 6 / 6

**Gaps (tests not implemented):** None — but note the test plan did not include an automated check for AC3's "losing candidate deleted" requirement, which is why this gap went undetected through review, DoR, and merge. Worth a general `/improve` note: an AC that requires a *deletion* to have happened is easy to leave un-tested, since "the file still exists" produces no error signal on its own.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Static content, no server-side computation, per `nfr-profile.md` |
| Security | ✅ | No credentials/PII in either candidate's content — confirmed at discovery `/clarify` and review run 1 |
| Accessibility | ✅ | Keyboard-reachability confirmed in review run 1 (guardrail `MC-A11Y-01`, status `met`) |

---

## Metric Signal

**Metric 1 — Signup conversion rate**
Signal: not-yet-measured
Evidence note: No real-visitor traffic data reviewed yet since launch (2026-08-08); baseline pull and 4-week review not yet due.
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **Owner: next session.** Create a short-track story to compare the two golden-trace candidates for real, choose one, delete the loser's content and the `ACTIVE_CANDIDATE` toggle mechanism entirely — closing AC3 as originally specified. Operator confirmed this resolution path (create a follow-up story) on 2026-08-09.

---

## DoD Observations

1. **A real, confirmed AC failure that survived review, DoR, and merge undetected** — not because anyone missed it during those steps (review run 1's PASS verdict didn't claim to check AC3's deletion requirement specifically), but because no automated test asserted the losing candidate's *absence*. `/improve` candidate: for any future AC of the shape "X must be deleted/removed before merge," the test plan should include an explicit "confirm X is absent" assertion, not just "confirm the remaining content is correct."
2. **This is exactly the kind of gap DoD exists to catch** — the story looked complete (page renders correctly, demo works, all planned tests pass), but a literal re-read of AC3's wording against the actual shipped file revealed the gap immediately. Worth reinforcing as a DoD habit: check ACs against the *current* merged code, not against "did the described feature demonstrably work when I looked at it."
