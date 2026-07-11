# Decision Log: 2026-07-12-skill-turn-test-isolation

**Feature:** Stop the skill-turn artefact auto-commit from firing real git commits during tests
**Story reference:** artefacts/2026-07-12-skill-turn-test-isolation/stories/stis-s1-guard-skill-turn-auto-commit.md
**Last updated:** 2026-07-12

---

## Decision categories

| Code | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |

---

## Log entries

---
**2026-07-12 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** Proceed to coding agent without a separate, formal domain-expert walkthrough of the AC verification script before implementation begins.
**Alternatives considered:** Block on a formal verification-script review pass before assigning to the coding agent (rejected — same rationale as `pcr-s1`'s precedent).
**Rationale:** This is a short-track, bounded bug-fix story (a test-isolation defect with a fully-confirmed root cause from live investigation this session) with no UI and no end-user-facing behaviour. The operator directly requested this follow-up story in-session, already fully briefed on the root cause and the recommended fix approach.
**Made by:** Hamish King (Founder/Operator), via /definition-of-ready, 2026-07-12
**Revisit trigger:** If the implementation deviates meaningfully from the DoR contract's estimated touch points, run the verification script formally before merging.
---
**2026-07-12 | GAP | definition-of-ready (H-GOV)**
**Decision:** Treat H-GOV as satisfied for this short-track story via the operator's direct, explicit in-session request, following the same precedent and reasoning already established for `pcr-s1` (see `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md`, 2026-07-11 GAP entry) — this is the second short-track story to hit the same skill-design gap, reinforcing that it's a real gap in `definition-of-ready/SKILL.md`, not a one-off.
**Alternatives considered:** Same two rejected alternatives as `pcr-s1`'s precedent (fabricating a discovery artefact; silently skipping without comment).
**Rationale:** Identical structural gap as `pcr-s1` — `skills/definition-of-ready/SKILL.md`'s H-GOV check assumes a discovery artefact always exists, false for short-track by design. This is now the second occurrence in two days, strengthening the case for the SKILL.md revision already recommended in `pcr-s1`'s decisions.md.
**Made by:** Coding agent (autonomous /definition-of-ready execution), 2026-07-12
**Revisit trigger:** Same as `pcr-s1`'s — when `definition-of-ready/SKILL.md` is next revised, add an explicit short-track exception to H-GOV.
---

---

## Architecture Decision Records

<!-- Add further ADRs as ADR-001, ADR-002 etc. -->
