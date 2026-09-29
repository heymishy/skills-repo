# Decisions: Fix real web-UI artefact routing gaps

## Decision 1: Drop AC1–AC3 (review save-path fix) — the premise was wrong, verified during implementation

**Date:** 2026-09-30

**Context:** wuar-s1's original story (v1) claimed a "confirmed, model-independent code bug": `review` missing from `_STORY_SCOPED_ARTEFACT` in `src/web-ui/routes/skills.js`, causing `computeArtefactSavePath` to save story-scoped `/review` sessions to the flat `artefacts/[slug]/review.md` path instead of a numbered per-story `review/[story]-review-N.md` path — cited as the explanation for why `2026-09-28-weeb-ui-learnings-and-improvements`'s `review.md` existed as a single flat file instead of 3 per-story files.

**What was found during implementation:** before writing the fix, a search for existing tests referencing `review.md` surfaced `tests/check-defs-revs-s1-wiring-into-turn-completion.js` (AC2) and `src/web-ui/utils/review-artefact-splitter.js`. These revealed an already-shipped, deliberate mechanism (`darc-s1`, commit `a7200f4d`, 2026-09-01; parity-fixed by `asf-s1`, commit `73839dbb`, 2026-09-15 — both **before** `web-ui-learnings-and-improvements`'s `review.md` was committed on 2026-09-29):

- `computeArtefactSavePath` intentionally returns the flat `artefacts/[slug]/review.md` path for `review` regardless of `storyId` — this is documented, correct, unchanged "dcuf-s1 behaviour."
- Separately and additively, `src/web-ui/routes/skills.js`'s streaming turn handler (~line 5620) calls `review-artefact-splitter.js`'s `splitReviewArtefact()` on every `review`-stage completion, which parses the model's own generated content for a `"## Story: [slug]"` boundary marker and, when found, writes real numbered per-story files (`artefacts/[slug]/review/[story]-review-N.md`) **alongside** the flat file — exactly the per-story convention `skills/review/SKILL.md` documents.
- `splitReviewArtefact` has a deliberate, documented fail-safe: if the model's own output does not contain the `"## Story: [slug]"` marker, it returns `[]` and writes nothing, rather than guessing — "the flat review artefact this was derived from remains the durable, accurate record."

**Conclusion:** there is no code-level save-path bug. The real explanation for `web-ui-learnings-and-improvements`'s missing per-story review files is that the model's own generated review content did not use the required `"## Story: [slug]"` format at generation time — a model-output-quality issue (consistent with this feature's other documented Haiku-era content problems), silently absorbed by the splitter's own safe no-op fallback with no operator-visible signal. This is a different, narrower finding than "code bug" — it belongs with the other model-behaviour observations for this feature, not a routing defect requiring a code fix.

**Decision:** AC1–AC3 and their corresponding tests are dropped from this story. `_computeReviewSavePath` and the `computeArtefactSavePath` extension written during initial implementation were fully reverted (`git checkout -- src/web-ui/routes/skills.js`) before being committed. The story is renamed and narrowed to cover only the confirmed drift-guard gap (AC4/AC5, now AC1/AC2). A follow-up candidate — giving `splitReviewArtefact`'s silent no-op an operator-visible signal (a warning surfaced in the web UI, not just a `console.warn`) — is noted below as a possible future story, not undertaken here (out of scope; this story's Out of Scope section carries it forward).

**Rationale for catching this now rather than after merge:** this repo's own established practice this session is to verify claims against real code/tests before treating them as ground truth, especially after a prior self-correction in the same investigation (the earlier "attributed too hastily to a single cause" moment). Reading the existing test suite before writing new code is what surfaced this — a reminder that "search for existing coverage of the area you're about to touch" is a cheap, high-value step before implementing a fix for an assumed-confirmed bug.

## Decision 2: Keep AC4/AC5 (drift-guard extension) unchanged

**Date:** 2026-09-30

**Context:** `benefit-metric` was independently confirmed absent from `DRIFT_GUARD_SONNET_SKILLS` via direct code read of `src/web-ui/config/model-routing.js` and `fly secrets list` on both `wuce-staging` and `skills-framework` (neither has `WUCE_MODEL_OVERRIDE_BENEFIT_METRIC`) — unrelated to the review-splitter finding above and unaffected by it.

**Decision:** extend `DRIFT_GUARD_SONNET_SKILLS` from 5 to 8 entries (`benefit-metric`, `decisions`, `definition-of-done` added), matching the same governance-critical risk profile as the existing 5. This part of the original fix proceeds unchanged.

## Decision 3: Branch-setup baseline — 2 known pre-existing environmental failures acknowledged

**Date:** 2026-09-30

**Context:** `node scripts/run-all-tests.js` was run in the `.worktrees/wuar-s1` worktree before implementation. `tests/check-p3.5-validate-trace.js` and `tests/check-pcr-s1-test-runner.js` fail here the same way they do in every other worktree created this session — a known, pre-existing environmental issue unrelated to any code in this story, not introduced by this branch.

**Decision:** proceed with implementation. These 2 failures are out of scope for wuar-s1 and are not blocking. A clean re-run after this story's changes were finalized confirmed no new failures beyond these 2 (see PR description for the exact pass/fail counts).
