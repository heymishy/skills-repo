# Decision Log: team-management-shared-shell-migration

**Feature:** Migrate team-management admin pages onto the shared HTML shell
**Discovery reference:** None — short-track, no discovery artefact
**Last updated:** 2026-08-16

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**[2026-08-16] | RISK-ACCEPT | definition-of-ready (W4, tmss-s1)**
**Decision:** Proceeding with DoR sign-off on `tmss-s1` despite W4 (verification script reviewed by a domain expert) not being independently satisfied — the verification script exists and is complete, but no separate domain expert has reviewed it ahead of implementation.
**Alternatives considered:** Pause DoR sign-off until a separate reviewer walks the script — the more thorough option, deferred for the same practical reason applied consistently across this session's other features (`wuce-self-serve-invites`, `web-ui-guardrails-standards-surface`): solo-operator repo, no separate domain-expert role available.
**Rationale:** The verification script was written directly from this story's own reviewed ACs; post-merge smoke testing (the script's own second intended use) remains the real verification checkpoint. This story's scope is additionally low-risk — a mechanical swap to an already-proven, already-used-elsewhere shared function, not novel logic.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If this feature ever has a genuinely separate domain-expert reviewer available, use them for W4 satisfaction on future stories rather than accepting this gap by default.
---

---
**[2026-08-16] | ASSUMPTION | definition-of-ready (H-GOV, tmss-s1)**
**Decision:** H-GOV (governance approval check, reads `## Approved By` from a discovery artefact) is treated as not applicable for this story. This feature has no `discovery.md` at all — short-track explicitly skips discovery per `CLAUDE.md`'s documented short-track path (`/test-plan → /definition-of-ready → coding agent`), matching the precedent already established by `pcr-s1` (`2026-07-11-pipeline-conflict-reduction`), which also reached DoD-complete with no discovery artefact and no H-GOV check performed.
**Alternatives considered:** (1) Block DoR sign-off until a discovery artefact is authored retroactively — rejected, would defeat the purpose of the short-track path, which exists precisely to avoid the full outer-loop chain for bounded refactors. (2) Treat H-GOV as an automatic FAIL for any feature with no discovery.md — rejected, this would make short-track structurally impossible to ever pass DoR, which is inconsistent with `pcr-s1`'s real, already-shipped precedent.
**Rationale:** H-GOV's own detail section only defines behaviour for a discovery artefact that exists but has an empty/missing/engineer-only `Approved By` section — it does not define behaviour for "no discovery artefact exists because this is short-track by design." The operator (sole platform owner) is directly requesting and reviewing this work in-session, which is the practical equivalent of approval in a solo-operator context, matching this session's own repeated W4 reasoning.
**Made by:** Hamish King — Platform owner (requested the work directly); Claude (agent) identified and applied the precedent
**Revisit trigger:** If `/definition-of-ready`'s own SKILL.md is ever updated to explicitly define short-track H-GOV behaviour, defer to that instead of this precedent-based interpretation.
---

## Architecture Decision Records

<!-- None recorded yet. -->

---
