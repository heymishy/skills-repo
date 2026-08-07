# Decision Log: tenant-plan-admin-control

**Feature:** Give admins a real control to lift a tenant's journey cap, separate from credits
**Track:** Short-track (per CLAUDE.md: `/test-plan → /definition-of-ready → coding agent`)
**Last updated:** 2026-08-06

---

## Decision categories

| Code | Meaning |
|------|---------|
| `GAP` | A structural gap in the skill/process itself, surfaced transparently rather than silently bypassed |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-06 | GAP | /definition-of-ready**
**Decision:** Proceed past H-GOV (governance approval check) without a discovery artefact's `## Approved By` section, since short-track stories have no discovery artefact by design.
**Context:** H-GOV's check reads `## Approved By` from a discovery artefact that short-track intentionally never produces (per CLAUDE.md's short-track path). This is the same structural gap already documented for `pcr-s1`/`stis-s1`.
**Rationale:** Satisfied via the operator's direct in-session instruction to scope and proceed with this story — equivalent governance signal to a discovery approval, just not routed through the discovery artefact mechanism. Logged transparently rather than silently bypassed.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If short-track story volume grows significantly, the DoR skill itself should gain an explicit short-track H-GOV variant rather than repeatedly documenting the same gap per-feature.
---

---
**2026-08-06 | RISK-ACCEPT | /definition-of-ready**
**Decision:** Proceed past DoR without the verification script (`tpac-s1-verification.md`) being reviewed by a domain expert first (W4).
**Alternatives considered:** Pause DoR sign-off until a human reviewer works through the script.
**Rationale:** Same rationale as every other story this session — the script was written directly from the story/test-plan already shaped by active operator direction; real first walkthrough happens as post-merge smoke test.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If a post-merge smoke test reveals the verification script described the wrong expected behaviour, treat as a pattern signal.
---
