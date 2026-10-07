# Decisions: Web UI outer-loop artefact integrity (wuai)

## D1: Resolve artefact storyId by parsing the content's own `**Story:**` field, not by fixing the index-tracking pointer

**Date:** 2026-10-08
**Context:** `session.currentStoryId` goes stale because `journey.currentStoryIndex` is never advanced, and the model's own auto-continuing DoR flow can skip non-sequentially to a different story than the index pointer indicates.
**Decision:** Trust the artefact content's own `**Story:** <id>` field (validated against the journey's known `storyList`) over the separately-tracked `session.currentStoryId`/`journey.currentStoryIndex` pointer.
**Rationale:** The model's own generated text is the only reliable ground truth for "which story is this artefact actually for" once the flow can skip around non-sequentially — fixing the index pointer alone (e.g. calling `advanceToNextStory()`) would still assume sequential `+1` progression and wouldn't correctly handle a skip-ahead case like `2026-10-05-customer-journey-as-first-class`'s own jump straight to `ep5-s1`. Parsing content is more robust and strictly additive: it only overrides the fallback when a parsed, validated ID is available, so no existing behaviour changes when the field is absent.

## D2: Prefer the last unambiguous `**Verdict:**` line in a review-split block, not the first

**Date:** 2026-10-08
**Context:** `review-artefact-splitter.js`'s `extractVerdict()` only reads the first matching verdict line; a self-correcting model can leave an initial ambiguous line followed by a clean final one.
**Decision:** Scan all verdict-line matches in a block and return the first one (scanning from the end) that resolves unambiguously, rather than only ever looking at the first match.
**Rationale:** A model that second-guesses itself mid-generation writes its real, final answer last — matching the `## Overall Verdict` summary table's own independent confirmation for the exact case this was found on (`ep1-s2`, which the summary table correctly lists as PASS). The existing "never guess when genuinely ambiguous" fail-safe contract from `asf-s1` is preserved unchanged: if every matching line is ambiguous, the function still returns `null`.
