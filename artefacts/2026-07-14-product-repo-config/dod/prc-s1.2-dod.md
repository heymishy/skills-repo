# Definition of Done: Connect an existing GitHub repo to a product

**PR:** https://github.com/heymishy/skills-repo/pull/479 | **Merged:** 2026-07-15
**Story:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.2-*.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1–AC5 (connect existing repo flow, real repo-access adapter wiring) | ✅ | `check-prc-s1.2-connect-repo.js`, 9/9 assertions incl. AC5: "server.js wires the real repo adapter, and two different sessions resolve to two different, individually-correct access results through it (not just proof the setter was called)" | Automated test, re-run fresh on current master 2026-08-17 | None |

**Note on AC5's evidence quality:** this test explicitly asserts *behavioural* correctness of the wired adapter (two different sessions → two different, correct results) rather than just confirming a setter was called — exactly the discipline this repo's own D37 injectable-adapter rule requires, and a pattern that other stories elsewhere in this repo's history have gotten wrong (see `team-identity-roles` epic, `tir-s1`).

---

## Scope Deviations

None identified in this retroactive pass.

---

## Test Plan Coverage

**Tests passing in CI:** 9/9, re-run fresh 2026-08-17.
**Gaps:** None identified.

---

## NFR Status

No red flags found in this pass.

---

## Metric Signal

No metric signal evaluated in this lightweight pass.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. ~4.5 weeks live in production, no incidents reported. Strong adapter-wiring test discipline (D37-compliant behavioural assertion, not just wiring proof).
