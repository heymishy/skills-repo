# Decision Log: 2026-07-18-domain-tag-activation

**Feature:** Activate domain-tag standards injection at story authoring time
**Story reference:** artefacts/2026-07-18-domain-tag-activation/stories/dta-s1.md
**Last updated:** 2026-07-18

---

## Decision categories

| Code | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |

---

## Log entries

---
**2026-07-18 | GAP | definition-of-ready (H-GOV)**
**Decision:** Treat H-GOV as satisfied for this short-track story via the operator's direct request (through `/improve`), following the same precedent established for `pcr-s1`, `stis-s1`, and `gav-s1`.
**Alternatives considered:** Same rejected alternatives as prior precedent.
**Rationale:** Identical structural gap as prior short-track stories — `skills/definition-of-ready/SKILL.md`'s H-GOV check assumes a discovery artefact always exists, false for short-track by design.
**Made by:** Claude (agent), via `/definition-of-ready`, 2026-07-18
**Revisit trigger:** Same as prior precedent — when `definition-of-ready/SKILL.md` is next revised, add an explicit short-track exception to H-GOV.
---
**2026-07-18 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** Proceed to coding agent without a separate, formal domain-expert walkthrough before implementation begins.
**Alternatives considered:** Block on a formal review pass (rejected — same rationale as prior short-track precedent).
**Rationale:** Bounded fix activating an already-designed (but never-exercised) mechanism; operator directly requested this story, already briefed on the gap.
**Made by:** Hamish King (Founder/Operator), via /definition-of-ready, 2026-07-18
**Revisit trigger:** If implementation finds the injection logic doesn't exist at all (rather than existing-but-unexercised), treat as new logic and reconsider whether a formal review is warranted before merging.
---

## Architecture Decision Records

None promoted to repo-level ADR status. No new architecture is introduced by this story — it activates an existing, already-designed mechanism.
