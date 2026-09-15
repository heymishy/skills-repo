# Decisions: Multi-User Role-Aware Synchronous Collaboration

## Incorporate the reference collaborator-picker wireframe into design.md

**Date:** 2026-09-14
**Context:** `artefacts/new-feature-2b74a292/reference/collaborators-picker-wireframe.html` — a wireframe the operator brought to discovery (redrawn from a screenshot of an internal tool's "who's building this?" flow) — was never consulted when `design.md` was produced. `skills/design/SKILL.md` Step 3 explicitly requires reference materials to be checked and reflected in the UX design; this was missed. `design.md`'s own UX section never described the Pod-creation/collaborator-picker screen at all, despite Epic 1 (Pod Formation) and Epic 4 (Advanced Pod Operations) — 5 of the feature's 13 stories — being built entirely around it.

**Decision:** Amended `design.md` to add a "Reference Materials" section citing the wireframe, a "Pod Creation / Collaborator Picker" UX section describing the two-panel roster/selection screen (adopting the wireframe's role-tagged roster, pre-included creator, and gated primary-action pattern), and a new "Collaborator/Pod picker" component entry. Two of the wireframe's five annotations were evaluated explicitly rather than silently adopted or dropped:
- **Gated primary action** ("Start" disabled until ≥1 required selection) — adopted, generalised from "≥1 Engineer" to "≥1 other member" since Pod composition isn't role-constrained at creation time.
- **Private/discoverable visibility toggle** — deferred. This platform has no existing workspace-wide feature-discoverability model to toggle away from (every feature already requires explicit collaborator assignment); adopting this would need its own discovery pass first.

**Rationale:** The wireframe's central idea — "save this team as a reusable POD" — is literally the origin of this feature's whole Pod data model; it deserved a citation and a properly-described screen, not silent, undocumented absorption into the epics. Documenting it now doesn't change any story's scope (the stories already assumed this screen existed; the design doc simply hadn't described it), so this is additive, not a material rescope requiring the already-passed stories to be reopened.

**Story:** N/A — design-artefact amendment, not a story-level change. Affects context for ep1-s1, ep1-s2, ep4-s1, ep4-s2 (Pod Manager / picker screens) without changing their acceptance criteria.

---

## Known open issue (not resolved by this entry): review artefact inconsistency

**Date:** 2026-09-14
**Context:** While checking the design gap above, found that this feature has two contradictory review artefacts for the same 13 stories: the top-level `review.md` (dated 2025-01-30) verdicts **FAIL — 12 HIGH findings**, every story failing Category C for having only 1 acceptance criterion when the DoR hard block (H2) and review's own Category C both require a minimum of 3. The per-story `review/ep*-review-1.md` files (dated 2026-09-14) verdict **PASS, no findings** on the same stories. Directly re-counting ACs on every story file on disk today confirms the 2025-01-30 `review.md` is the accurate one — all 13 stories still have exactly 1 `Given/When/Then` AC each; none have been expanded to 3. The stories' User Story sections also have a template defect: the "I want" clause is missing and the "So that" clause is populated with raw benefit-linkage prose instead of a real benefit clause (e.g. ep1-s1: "So that Synchronous team access — completing this story enables the first step...").

**Not decided here:** whether to expand every story to 3+ ACs and re-run `/review` (the correct fix per this repo's own gates), or some other path. This is recorded as an open issue for the operator to decide how to proceed — not resolved as part of this design amendment.

**Resolved 2026-09-15 (commit `f22c39f7`, 9 minutes after this entry):** every story was expanded to 3 Given/When/Then ACs using the splits the legacy `review.md`'s own findings called for, and the User Story format defect was fixed across all 13. Confirmed directly against disk on 2026-09-15 during the real outer-loop run (`ep1-s1.md` genuinely has 3 well-formed ACs with correct "I want"/"So that" clauses) and re-verified by a fresh, real `/review` pass the same day — all 13 stories PASS, no findings. This entry was left open in the artefact past the fix; recorded here so a future reader doesn't need to independently re-verify what's already settled.

---

## `ep1-s1` DoR amended to reference the collaborator-picker wireframe design (2026-09-15)

**Context:** `ep1-s1`'s DoR (freshly generated 2026-09-15 as part of driving all 13 stories through the real outer-loop pipeline) described a generic "form with name field, members picker, role dropdown" in its Coding Agent Instructions — it did not reference the "Pod Creation / Collaborator Picker" UX section this same design.md already specifies (two-panel Available/Your-team roster, role chips, gated primary action). Caught before `/branch-setup` by cross-checking design.md against the DoR at the operator's request.

**Decision:** Amended `artefacts/new-feature-2b74a292/dor/ep1-s1-dor.md`'s Coding Agent Instructions to explicitly describe the two-panel picker structure and the "≥1 member beyond creator" gating rule, citing `design.md`'s "Pod Creation / Collaborator Picker" section and the reference wireframe directly, so the binding instructions block is self-sufficient without requiring the coding agent to separately discover and cross-reference design.md on its own.

**Story:** ep1-s1 — no change to Acceptance Criteria; UI structure detail only, consistent with what design.md already specified.
