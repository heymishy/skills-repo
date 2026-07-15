# Decision Log: 2026-07-16-baseline-test-triage

**Feature:** Triage the pre-existing baseline test failures unmasked by pcr-s1
**Story reference:** artefacts/2026-07-16-baseline-test-triage/stories/tst-s1-triage-pre-existing-baseline-failures.md
**Last updated:** 2026-07-16

---

## Decision categories

| Code | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |

---

## Log entries

---
**2026-07-16 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** Proceed to coding agent without a separate, formal domain-expert walkthrough of the verification/test plan before implementation begins.
**Alternatives considered:** Block on a formal review pass first (rejected, same rationale as pcr-s1).
**Rationale:** Bounded, short-track infra/process story (test triage, no new production feature). The operator reviewed the story and ACs directly in-session before requesting this be short-tracked.
**Made by:** Hamish King (Founder/Operator), via /definition-of-ready, 2026-07-16
**Revisit trigger:** None.
---
**2026-07-16 | GAP | definition-of-ready (H-GOV)**
**Decision:** H-GOV satisfied via the operator's direct in-session instruction to proceed short-track, same as `pcr-s1`'s precedent (artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md, 2026-07-11 GAP entry) — this is the same unresolved skill-design gap (`definition-of-ready/SKILL.md`'s H-GOV check assumes a discovery artefact exists), not a new one.
**Made by:** Claude (agent), definition-of-ready, 2026-07-16
**Revisit trigger:** Same as pcr-s1's — resolve once, applies to both.
---

## Architecture Decision Records

<!-- Coding agent: append RISK-ACCEPT entries per category-(b) file/group here during implementation. -->
