# Decision Log: fix-p35-validate-trace-timeout-flake

**Feature:** Fix p3.5 validate-trace timeout flake
**Discovery reference:** None — short-track, no discovery artefact
**Last updated:** 2026-08-30

---

## Decision categories

| Code | Meaning |
|------|---------|
| `GAP` | A skill-design gap surfaced by this feature, logged for future correction |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-30 | GAP | definition-of-ready (p35tf-s1)**
**Decision:** H-GOV (governance approval check) cannot pass in its literal form for this short-track story — there is no discovery artefact, so no `## Approved By` section exists to read. Satisfied instead via the operator's direct, explicit in-session instruction to proceed with this fix (selected "Do the short-track fix now, then S4" when asked how to sequence it), recorded here transparently rather than silently marked as passing.
**Alternatives considered:** (1) Fabricate a discovery artefact solely to satisfy H-GOV mechanically. (2) Skip logging this and just mark H-GOV as N/A without explanation.
**Rationale:** Same exact gap and same resolution already established by `pcr-s1` (`artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md`, 2026-07-11) — H-GOV's design assumes every story has a discovery artefact, which is structurally impossible for genuinely short-track stories by design (short-track explicitly skips /discovery). This is the second time this exact gap has been hit, both times for legitimate short-track bug fixes, not an attempt to bypass real governance. Worth escalating to a `/definition-of-ready` SKILL.md revision at the next `/improve` pass: add an explicit short-track branch to H-GOV rather than relying on this repeated ad-hoc GAP note.
**Made by:** Claude (agent), during p35tf-s1's DoR run
**Revisit trigger:** If this gap is hit a third time, treat it as a strong enough signal to actually revise `/definition-of-ready`'s H-GOV check rather than logging a third GAP note.
---

---
**2026-08-30 | RISK-ACCEPT | definition-of-ready (p35tf-s1)**
**Decision:** Accept DoR Warning W4 (verification script reviewed by a domain expert) as unresolved pre-code — proceed to implementation without a pre-code human walkthrough of the verification script.
**Alternatives considered:** (1) Pause DoR and walk through the 3 scenarios before signing off.
**Rationale:** Matches the identical precedent already established multiple times this session (`revise-earlier-stage`'s 4 stories, S1-S5 of `diagram-validation-and-types`) — the verification script is designed to serve as the post-merge smoke test as one of its intended uses, not exclusively a pre-code gate. Given this fix's own AC3 already requires running the full suite twice as part of `/verify-completion` regardless, Scenario 3 of the verification script will effectively be exercised during that step even without a separate formal walkthrough.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** If a post-merge smoke test run finds a scenario that reveals the AC itself was wrong, reconsider skipping W4 for future short-track stories.
---
