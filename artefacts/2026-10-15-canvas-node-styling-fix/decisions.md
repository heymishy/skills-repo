# Decisions: Canvas node styling fix

## Decision types

| Type | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |

---

## Log entries

---
**2026-10-15 | GAP | definition-of-ready (H-GOV)**
**Decision:** Treat H-GOV as satisfied for this short-track story via the operator's direct, explicit in-session request ("let's do the canvas style one"), following the same precedent already established for `pcr-s1` and `stis-s1` (see `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md` and `artefacts/2026-07-12-skill-turn-test-isolation/decisions.md`) — this is the third occurrence of the same skill-design gap, further reinforcing that it is a real gap in `definition-of-ready/SKILL.md` (H-GOV assumes a discovery artefact always exists, false for short-track by design), not a one-off.
**Alternatives considered:** Same two rejected alternatives as the `pcr-s1`/`stis-s1` precedent — fabricating a discovery artefact, or silently skipping the check without comment.
**Rationale:** Root cause already confirmed (`canvas-node-styling-outcome.md` spike, 2026-10-14) before this story was written; the operator asked for this exact story by name in-session, already aware of the fix's scope and approach from that spike.
**Made by:** Claude (session), 2026-10-15.
**Revisit trigger:** When `definition-of-ready/SKILL.md` is next revised, add an explicit short-track exception to H-GOV (3rd occurrence — same revisit trigger as the prior two).

---
**2026-10-15 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** W4 (verification script reviewed by a domain expert) is risk-accepted for this feature slug, per the repo-wide solo-operator posture in `architecture-guardrails.md`. This is a separate feature slug from `2026-10-14-journey-authoring-experience` (whose own W4 log does not carry over), so this is the first W4 log specifically for `2026-10-15-canvas-node-styling-fix`.
**Rationale:** Same uniform repo-wide posture already applied to every other feature this session — the operator is also the reviewer and final approver.
**Made by:** Established repo-wide posture (`architecture-guardrails.md`), applied here per `/definition-of-ready`'s own W4 check.
**Revisit trigger:** Same as every other W4 log this session — a second operator onboarding, or regulated-enterprise adoption.
