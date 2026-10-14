# Review Report: journey-authoring-guided-creation epic (jae-s1, jae-s2, jae-s3)

**Stories:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s1.md, jae-s2.md, jae-s3.md
**Run:** 1
**Date:** 2026-10-14
**Reviewer:** Claude Sonnet 5 (session continuation)

Reviewing 3 stories, all 5 categories (A–E).

---

## FINDINGS

**1-H1 (HIGH, Category C — jae-s2):** `jae-s2`'s own AC1 (auto-open the panel immediately after a stage is named) interacts badly with a real, pre-existing gap in `jcx-s7`'s own already-shipped save-indicator code. Confirmed directly by reading `openPanel`: it populates every field from `stageData[stageId]` but never touches or resets `panelSaved` (the save-indicator span) at all. Since `jcx-s7` made that indicator's 3 states fully persistent (no auto-hide timer, by design), a stale `"Saved"` or `"Failed to save — Retry: <old message>"` from a PREVIOUSLY edited stage will still be visibly showing the instant a NEW stage's panel opens — before the operator has touched a single field for this stage. This is actively misleading (claims a save outcome for a field this stage never had), not just stale UI. The defect already existed in `jcx-s7`'s own code (any manual open after a prior failed save would show it too), but `jae-s2`'s own AC1 converts it from a rare edge case into something hit on EVERY stage creation once an operator has edited 2+ stages in one session — the auto-open behaviour is what makes this story the right place to fix it, not optional polish. **Required fix:** `openPanel` must reset `panelSaved`'s text and classes (clear `--error`, clear text content, remove `--visible`) at the start of every open, not just this story's own new auto-open call site. Recommend adding this as an explicit AC (or an amendment to AC1) rather than leaving it as an implementation detail — it is the kind of thing that will otherwise ship untested, exactly like the two prior review findings this session caught in `jcx-s7` itself (1-M1, 1-M2).

**1-M1 (MEDIUM, Category C — jae-s1):** AC1/AC2 describe a new checkbox on the "+ New journey" modal and its effect on journey creation, but the story's Architecture Constraints section never names the actual request-field the checkbox's state is communicated through (e.g. a new `seedDefaultStages` boolean in the POST body `handlePostJourneys` would need to read). This is implementable either way, but leaving the wire format unnamed invites an implementation-time guess that a later test then has to match retroactively, rather than a test written against a named contract. Recommend naming the field explicitly in Architecture Constraints before `/test-plan`.

**1-L1 (LOW, Category A):** None of the 3 stories' own `benefit-metric.md` reference line points at a specific row anchor (e.g. `#m1-time-to-first-complete-stage`) — minor, matches this repo's own existing convention of referencing the whole file, not a real gap, named only for completeness.

No other HIGH or MEDIUM findings.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS — all 3 stories correctly reference epic/discovery/benefit-metric; one trivial LOW (1-L1) |
| Scope integrity | 5 | PASS — each story has 4 explicit out-of-scope items with stated reasons; epic's own Out of Scope is consistent with all 3 |
| AC quality | 4 | PASS — 4-5 ACs per story, all Given/When/Then, all concretely testable (no soft "at a glance"-style qualifiers); one HIGH (1-H1) is a real interaction-level defect between two stories' own ACs, not a wording problem with any single AC |
| Completeness | 5 | PASS — named persona, benefit linkage to a named metric, out-of-scope populated, NFRs populated, complexity + scope stability both rated, for all 3 stories |

**Verdict:** FAIL — 1 HIGH finding (1-H1) must be resolved before this epic proceeds to `/test-plan`.

### Category E: Architecture compliance

- Architecture Constraints populated in all 3 stories, each citing ADR-026 (reuse) explicitly, with the specific existing function/pattern being reused named concretely (not a vague "follow existing conventions") ✓
- No violation of a named guardrail — all 3 stories explicitly avoid inventing new mechanisms where an existing one already covers the need (`jae-s1` reuses the stage-insert shape, `jae-s2` reuses `openPanel` verbatim, `jae-s3` reuses `getPersonaSuggestions`/`extractWhoItAffects`'s own exact shape) ✓
- ADR-025 (multi-tenancy) correctly named in `jae-s1` (AC4) and `jae-s3` (AC5), each with its own dedicated cross-tenant AC rather than an assumed-safe-by-reuse shortcut ✓
- 1-M1's unnamed request field is an Architecture Constraints completeness gap, not a guardrail violation — tracked above, not double-counted here

One Category E-adjacent note: 1-H1 is not itself a guardrail violation, but it is exactly the class of cross-story-interaction defect `/review`'s own purpose is to catch before `/test-plan` locks in a test suite that wouldn't have covered it.

---

## Required Actions Before Proceeding

1. **Resolve 1-H1:** Amend `jae-s2` (or add a 5th AC) to require `openPanel` to reset the save-indicator's text and classes on every open, and name this as a test-plan scenario (open panel for stage A, trigger a failed save, close it, open panel for stage B, assert the indicator shows no stale text/class from stage A).
2. **Resolve 1-M1:** Name the new request field (e.g. `seedDefaultStages`) explicitly in `jae-s1`'s Architecture Constraints.

**Review run 1: FAILED — 1 HIGH finding.** Re-run `/review` after both required actions are applied.
