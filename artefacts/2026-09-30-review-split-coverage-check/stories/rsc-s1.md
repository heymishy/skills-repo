## Story: Deterministic story-coverage check on the review-artefact splitter

**Track:** Short-track (hardening fix — found via direct investigation during `wuar-s1`'s own DoR/implementation, not a new feature)

## User Story

As a **platform owner running a `/review` session through the deployed web UI**,
I want **a deterministic, code-driven check comparing the story-scoped review files the splitter actually wrote against the feature's own known story list**,
So that **a story silently missing from a review session's own generated output produces a distinguishable, logged signal immediately, instead of relying on the model having correctly emitted a `"## Story: [slug]"` marker for every story with no code-level verification at all**.

## Benefit Linkage

Directly closes a gap surfaced while implementing `wuar-s1` (`artefacts/2026-09-30-web-ui-artefact-routing-fixes/decisions.md`, Decision 1): `review-artefact-splitter.js`'s `splitReviewArtefact()` silently returns nothing for any story whose content the model's own output never formatted with the `"## Story: [slug]"` marker — the only trace is a `console.warn` fired per unparseable-verdict story, not a comparison against the feature's own known story list, and nothing fires at all for a story missing from the output entirely (as opposed to present-but-unparseable). This is exactly the class of failure that went undetected in `2026-09-28-weeb-ui-learnings-and-improvements` for weeks. The story list needed for a deterministic comparison already exists in code at review-turn-completion time (`journeyStore`'s `journey.storyList`, set by `setStoryList()` at the definition→review transition) — no new data source is required, only a comparison that isn't being made today.

## Architecture Constraints

- No new npm dependencies.
- New pure function lives in `src/web-ui/utils/review-artefact-splitter.js` alongside `splitReviewArtefact` (same module, same responsibility boundary) — not in `skills.js`, which only wires it in.
- Wiring point: `src/web-ui/routes/skills.js`, immediately after the existing per-story-file write loop in the `session.skillName === 'review'` branch of the streaming turn handler (~line 5584-5608 on `master` at the time this story was written) — reads `_journeyStore.getJourney(session.journeyId).storyList`, calls the new function, and `console.warn`s a structured, distinguishable event when any known story is missing from the split output.
- Best-effort, non-blocking: matches the existing splitter's own explicit design intent ("Purely additive... a parse or write/commit failure here is logged and does not block the stage from completing, since the flat file already provides a durable, complete record"). This story adds a stronger, more specific signal — it does not change that non-blocking design, and does not gate stage completion on the check's result.
- D37 not applicable — no injectable adapter introduced.

## Dependencies

None.

## Acceptance Criteria

**AC1 (gap detection, pure function):** Given `splitReviewArtefact`'s own output (an array of `{storySlug, runNumber, content}`) and a known story-slug list, When the new coverage-check function is called, Then it returns exactly the story slugs present in the known list but absent from the split output — as a plain array, in the known list's own order.

**AC2 (no false positives):** Given the split output's story slugs exactly match the known story list (regardless of order), When the coverage-check function is called, Then it returns an empty array.

**AC3 (fully-missing split, the real corruption scenario):** Given `splitReviewArtefact` returned `[]` entirely (no `"## Story:"` marker found anywhere in the model's output) and a known story list of 3 stories, When the coverage-check function is called, Then it returns all 3 story slugs — the exact scenario that went undetected in `web-ui-learnings-and-improvements`.

**AC4 (wiring, gap logged):** Given a real review-stage turn completes with `session.journeyId` set and `journey.storyList` populated, When the split output is missing 1 or more of the known stories, Then `console.warn` is called with a JSON payload whose `event` field is `'review_split_incomplete'` and whose `missingStorySlugs` field lists exactly the missing slugs.

**AC5 (wiring, no false alarm):** Given the same setup as AC4 but the split output fully covers the known story list, When the turn completes, Then no `'review_split_incomplete'` warning is logged.

**AC6 (wiring, no known list — skip cleanly):** Given `session.journeyId` is set but `journey.storyList` is absent, empty, or the session is not journey-linked at all, When the turn completes, Then the coverage check is skipped entirely — no warning is logged, no error is thrown, and existing behaviour (split files still written when the marker is present) is unaffected.

## Out of Scope

- Surfacing this signal in the web UI itself (a banner, a story-map panel indicator, etc.) — this story is a backend, log-level detection mechanism only. A UI-visible surfacing is a plausible follow-up but adds real scope (new endpoint/UI element) beyond this story's bounded size; flagged as a follow-up candidate in `decisions.md`, not built here.
- Blocking stage completion when a gap is detected — explicitly preserves the existing splitter's non-blocking, best-effort design intent (see Architecture Constraints).
- Retroactively auditing other already-shipped features for this same gap — a separate follow-up already flagged in `wuar-s1`'s own decisions.md.
- Any change to `splitReviewArtefact`'s own parsing/extraction logic (verdict extraction, findings-section extraction) — unrelated to this story's scope.

## NFRs

- **Performance:** Not applicable — an array comparison over a small (typically <10 element) story list, once per review-stage turn completion.
- **Security:** Not applicable — no new input surface; operates only on data already computed in-process.
- **Accessibility:** Not applicable — backend-only, no UI surfacing in this story.
- **Audit:** The new `console.warn` payload is itself the audit trail for this story's own concern — no new persistent storage required.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
