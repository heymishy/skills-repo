# Decision Log: 2026-07-19-product-repo-connect-ux

**Feature:** Give every product a UI path to connect or create a GitHub repo
**Story reference:** artefacts/2026-07-19-product-repo-connect-ux/stories/rpc-s1.md
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
**Decision:** Treat H-GOV as satisfied for this short-track story via the operator's direct, live discovery of the gap during staging verification, following the same precedent established for `pcr-s1`, `stis-s1`, `gav-s1`, `dta-s1`, and `jrf-s1`.
**Made by:** Claude (agent), via `/definition-of-ready`, 2026-07-19
**Revisit trigger:** Same as prior precedent.
---
**2026-07-19 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** Proceed to coding agent without a separate, formal domain-expert walkthrough before implementation begins.
**Rationale:** Bounded UI addition to already-working backend handlers; operator found this gap live and requested the fix directly.
**Made by:** Hamish King (Founder/Operator), via /definition-of-ready, 2026-07-19
**Revisit trigger:** None expected.
---

## Architecture Decision Records

None. No new architecture introduced — this story surfaces existing backend capability through new UI only.
