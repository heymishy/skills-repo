# Decision Log: export-multi-story-selection

**Feature:** Let a --from-saas export request specify which DoR-approved story to fetch
**Track:** Short-track (per CLAUDE.md: `/test-plan → /definition-of-ready → coding agent`)
**Last updated:** 2026-08-07

---

## Decision categories

| Code | Meaning |
|------|---------|
| `GAP` | A structural gap in the skill/process itself, surfaced transparently rather than silently bypassed |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-07 | GAP | /definition-of-ready**
**Decision:** Proceed past H-GOV without a discovery artefact's `## Approved By` section, since short-track stories have no discovery artefact by design.
**Context:** Same structural gap already documented for `pcr-s1`/`stis-s1`/`tpac-s1`/`npwe-s1`.
**Rationale:** Satisfied via the operator's direct in-session instruction to scope and proceed ("let's do 2-5").
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** See prior entries' equivalent — same underlying process gap.
---

---
**2026-08-07 | RISK-ACCEPT | /definition-of-ready**
**Decision:** Proceed past DoR without the verification script being reviewed by a domain expert first (W4).
**Rationale:** Same rationale as every other story this session.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If a post-merge smoke test reveals the verification script described the wrong expected behaviour.
---
