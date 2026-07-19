# Decision Log: 2026-07-19-new-feature-redirect-fix

**Feature:** Fix "New feature" redirecting to the sign-in page for logged-in users
**Story reference:** artefacts/2026-07-19-new-feature-redirect-fix/stories/jrf-s1.md
**Last updated:** 2026-07-19

---

## Decision categories

| Code | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |

---

## Log entries

---
**2026-07-19 | GAP | definition-of-ready (H-GOV)**
**Decision:** Treat H-GOV as satisfied for this short-track story via the operator's direct, live discovery of the bug during staging verification, following the same precedent established for `pcr-s1`, `stis-s1`, `gav-s1`, and `dta-s1`.
**Made by:** Claude (agent), via `/definition-of-ready`, 2026-07-19
**Revisit trigger:** Same as prior precedent.
---
**2026-07-19 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** Proceed to coding agent without a separate, formal domain-expert walkthrough before implementation begins.
**Rationale:** A confirmed, precisely root-caused routing bug (exact redirect target and every currently-registered route pattern already traced); operator found this live and requested the fix directly.
**Made by:** Hamish King (Founder/Operator), via /definition-of-ready, 2026-07-19
**Revisit trigger:** None expected — if the implementation finds the routing picture is more tangled than this story's Architecture Constraints describe, log the finding here before proceeding further.
---

## Architecture Decision Records

None. No new architecture introduced — this is a routing correction.
