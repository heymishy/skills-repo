# Story: Fix storyId drift in Web UI DoR/test-plan artefact saves, and prefer the last unambiguous verdict line in review-artefact-splitter

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real gaps found below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator running a multi-story feature's discovery-through-DoR outer loop entirely via the Web UI**,
I want **each story's DoR/test-plan artefact saved under its own correct filename, and every story's review verdict correctly split out into its own file**,
So that **no story's artefact work is silently overwritten by a later story in the same session, and every reviewed story has a discoverable, correctly-labelled review record**.

## Benefit Linkage

**Metric moved:** None formally tracked — short-track artefact-integrity fix, not a metric-bearing feature. Direct benefit: eliminates a confirmed, reproducible, data-loss-capable defect found during `2026-10-05-customer-journey-as-first-class` — the first feature in this repo's history to run its full discovery-through-DoR outer loop entirely through the Web UI rather than the CLI.
**How:** Both bugs were found investigating why this 13-story feature's `dor/` and `test-plans/` directories each held exactly one file (misnamed), and why one of its 13 stories (`ep1-s2`) never got a split per-story review file despite being reviewed and passing. Fixing both removes two concrete ways a Web-UI-driven outer loop pass can silently lose or hide real work.

## Architecture Constraints

**Bug 1 — storyId drift (`src/web-ui/routes/skills.js`), confirmed data-loss-capable:**

`linkSessionToJourney()` (line ~2529) sets `session.currentStoryId` exactly once, at journey-link time, from `journey.storyList[journey.currentStoryIndex]`. `journey.currentStoryIndex` is never advanced anywhere in `skills.js` — `advanceToNextStory()` exists in `journey-store.js` but has zero call sites outside its own module (confirmed by grep). `computeArtefactSavePath()` (used at both the non-streaming turn handler, line ~2696, and the streaming turn handler, line ~5494) uses this permanently-stale `session.currentStoryId` as the save path's `storyId` component, regardless of which story the model's own generated artefact content actually covers on a later turn.

Confirmed concretely on `2026-10-05-customer-journey-as-first-class`: `dor/ep1-s1-dor.md` and `test-plans/ep1-s1-test-plan.md` both contain content whose own `**Story:**` header field says `ep5-s1` — a different story about an unrelated database migration, not the journey-creation POST route `ep1-s1` is actually about. Because the DoR skill is instructed to auto-continue through stories without asking the operator, and the model evidently skipped past several review-passed stories to reach `ep5-s1` (zero dependencies, immediately buildable), any DoR/test-plan content generated for other stories earlier in the same session — before the session finally produced `ep5-s1`'s — would have silently saved over the same stale filename, each write destroying the previous one. Only the last write before the session ended survives on disk. This is a **real risk of silent work loss**, not a cosmetic naming mismatch.

**Fix:** derive the real `storyId` from the artefact content's own `**Story:** <id>` field at save time, validated against `journey.storyList` membership (so a parse of unrelated prose can never be mistaken for a real story ID), falling back to `session.currentStoryId` only when the field is absent, unparseable, or doesn't match a known story. This avoids needing to also fix the index-advancement gap, since it trusts what the model actually wrote over a separately-tracked pointer that is known to go stale. `session.currentStoryId` itself is left untouched — nothing else in the codebase reads it (confirmed by grep: its only other use is as this same fallback).

**Bug 2 — splitter takes the first verdict line, not the last (`src/web-ui/utils/review-artefact-splitter.js`):**

`extractVerdict()` reads only the first `**Verdict:**` line in a story's block (non-global regex `.match()`). For `ep1-s2` in this same feature's `review.md`, the model wrote an initial `**Verdict:** FAIL (1-H count: 0... PASS threshold met...)` line, immediately followed by a clean, self-corrected `**Verdict:** PASS` line. The first line's raw text contains both the words "FAIL" and "PASS" — correctly judged ambiguous by the existing fail-safe logic (`asf-s1`'s own "never guess" contract) — so the story is skipped entirely (`review_split_verdict_unparseable`, first logged 2026-10-07 under `tsdg-s1` as an open question, now root-caused). The second, unambiguous, self-corrected line is never read. The review's own `## Overall Verdict` summary table at the bottom of the same `review.md` independently lists `ep1-s2` as `PASS`, confirming the splitter's own first-match behaviour — not the review content's intent — is the actual defect.

**Fix:** scan all `**Verdict:**` matches in a story's block (global regex) and return the first one, scanning from the END of the list backwards, that resolves unambiguously to PASS or FAIL. A self-correcting model's own final line is almost always its last one; preferring the last unambiguous match over the first exactly matches that intent. When every matching line is ambiguous (the genuinely-can't-tell case `asf-s1` was designed for), behaviour is unchanged — still returns `null`, never guesses.

## Dependencies

- **Upstream:** None.
- **Downstream:** Once merged, the already-identified missing `review/ep1-s2-review-1.md` split file for `2026-10-05-customer-journey-as-first-class` will be regenerated as a separate, artefact-only bookkeeping action (not part of this PR's own scope — that feature's artefacts are not `src/` code).

## Acceptance Criteria

**AC1:** Given an artefact's content contains a `**Story:** <id>` field (optionally heading-prefixed or bold-decorated) whose value matches a story in the linked journey's `storyList`, When the artefact is saved via either turn-handler path, Then the save path uses that parsed `<id>`, not `session.currentStoryId`.

**AC2:** Given an artefact's content contains no `**Story:**` field, or one whose value does not match any story in the linked journey's `storyList`, When the artefact is saved, Then the save path falls back to `session.currentStoryId`, unchanged from current behaviour.

**AC3:** Given a session with no linked journey (`session.journeyId` unset — standalone/CLI-style usage), When an artefact is saved, Then behaviour is unchanged from today (no journey to validate a parsed ID against, so the existing `session.currentStoryId`-based path is used exactly as before).

**AC4:** Given a story's review block in a consolidated `review.md` contains two `**Verdict:**` lines — an initial one containing both "FAIL" and "PASS" (ambiguous) followed by a clean, single-word second line — When `splitReviewArtefact` processes that block, Then it returns the verdict from the second (last) line, not `null`.

**AC5:** Given a story's review block contains exactly one `**Verdict:**` line, When `splitReviewArtefact` processes that block, Then behaviour is unchanged from today (same extraction, same result).

**AC6:** Given a story's review block contains two `**Verdict:**` lines that are BOTH ambiguous (each containing both "FAIL" and "PASS", or neither), When `splitReviewArtefact` processes that block, Then it still returns `null` and still emits the `review_split_verdict_unparseable` warning — the fail-safe "never guess" contract from `asf-s1` is preserved.

**AC7:** Given the existing test suites touching both modified files (`check-srar-s1-idempotent-turn-reconnect.js` and the wider turn-handler regression set; `check-revs-s1-review-artefact-splitter.js`, `check-asf-s1-splitter-parity-bugs.js`, `check-rsc-s1-review-split-coverage.js`), When this fix lands, Then every existing test continues to pass unmodified.

## Out of Scope

- Also calling `advanceToNextStory()` / keeping `journey.currentStoryIndex` in sync — not needed for AC1-3 (confirmed by grep that `session.currentStoryId` has no other reader), and a broader index-tracking fix is a larger, separate change with its own risk surface.
- Regenerating the missing `review/ep1-s2-review-1.md` file for `2026-10-05-customer-journey-as-first-class` — tracked separately as an artefact-only bookkeeping action once this fix is verified, not part of this code PR.
- Any change to the three stories in that same feature with genuine unresolved HIGH review findings (`ep1-s1`, `ep2-s2`, `ep3-s2`) — those are correct review outcomes, not a bug, and are the operator's own to resolve when they return to that feature.
- A richer "which story is this for" UI indicator during a multi-story session — out of scope; this story only fixes where the artefact is saved, not how the operator is kept informed mid-session.

## NFRs

- **Performance:** Negligible — one additional regex match against already-in-memory artefact content, once per artefact save.
- **Security:** None identified — the parsed storyId is validated against the journey's own known `storyList` before being trusted, so it can never be used to write outside the intended per-feature `dor/`/`test-plans/` subdirectories (the existing `computeArtefactSavePath` path-construction logic, unchanged by this story, is what actually determines the directory).
- **Reliability:** Both fixes are purely additive fallback-preserving changes — AC2/AC3/AC5/AC6 explicitly pin down that existing behaviour is unchanged whenever the new logic doesn't have a confident answer.
- **Accessibility:** N/A — no UI change.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
