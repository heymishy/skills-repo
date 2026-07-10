# Decision Log: 2026-07-11-pipeline-conflict-reduction

**Feature:** Remove the three recurring merge-conflict hotspots in parallel-wave inner-loop delivery
**Story reference:** artefacts/2026-07-11-pipeline-conflict-reduction/stories/pcr-s1-reduce-merge-conflict-hotspots.md
**Last updated:** 2026-07-11

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |

---

## Log entries

---
**2026-07-11 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** Proceed to coding agent without a separate, formal domain-expert walkthrough of the AC verification script before implementation begins.
**Alternatives considered:** Block on a formal verification-script review pass before assigning to the coding agent (rejected for this specific story — see rationale).
**Rationale:** This is a short-track, bounded infra/tooling story (test runner mechanics, pipeline-state write scoping, git merge strategy) with no UI and no end-user-facing behaviour. The operator reviewed the story, ACs, and DoR contract directly in-session before requesting short-track — a level of scrutiny at least equivalent to a standalone verification-script read for a story of this shape. Formal verification-script walkthrough is deferred to its "post-merge smoke test" use case (per `test-plan/SKILL.md`'s "The script serves three moments" — pre-code sign-off, post-merge smoke test, delivery review), which will happen naturally when the operator runs the script against the merged implementation.
**Made by:** Hamish King (Founder/Operator), via /definition-of-ready, 2026-07-11
**Revisit trigger:** If the implementation deviates meaningfully from the DoR contract's estimated touch points, run the verification script formally before merging.
---
**2026-07-11 | GAP | definition-of-ready (H-GOV)**
**Decision:** Treat H-GOV (governance approval check, which reads a discovery artefact's `## Approved By` section) as satisfied for this short-track story via the operator's direct, explicit in-session instruction to proceed with short-track, rather than blocking DoR sign-off on a discovery artefact that short-track explicitly does not produce.
**Alternatives considered:** (1) Block DoR entirely until a discovery.md is retroactively created purely to hold an `## Approved By` section (rejected — this would fabricate outer-loop ceremony that CLAUDE.md's own short-track routing explicitly says to skip, and would set a bad precedent of writing artefacts to satisfy a check rather than to record real analysis). (2) Silently skip H-GOV without comment (rejected — an unacknowledged hard-block bypass is exactly the kind of silent gap this pipeline's own governance model is designed to prevent).
**Rationale:** `skills/definition-of-ready/SKILL.md`'s H-GOV check assumes every story reaching DoR has been through `/discovery` and therefore has a discovery artefact to read `## Approved By` from. This assumption is false for short-track stories by design (`CLAUDE.md`'s own short-track routing is `/test-plan → /definition-of-ready → coding agent`, explicitly skipping `/discovery`). This is a genuine skill-design gap, not a one-off judgment call specific to this story's content — worth a `definition-of-ready/SKILL.md` clarification (e.g. an explicit short-track exception clause for H-GOV, keyed on the same short-track marker the story/DoR artefact records) so future short-track stories don't need to re-derive this same reasoning.
**Made by:** Coding agent (autonomous /definition-of-ready execution), 2026-07-11
**Revisit trigger:** When `skills/definition-of-ready/SKILL.md` is next revised, add an explicit short-track exception to H-GOV rather than relying on this same ad hoc reasoning being repeated per short-track story.
---

---

## Architecture Decision Records

<!-- Add further ADRs as ADR-001, ADR-002 etc. -->
