# Decisions: aslr-s1

## Scope correction — 4 call sites, not 1

**Date:** 2026-08-27
**Context:** The story/test-plan/DoR were initially written after a scope investigation that grepped `journey.activeSessionId`-based redirects and concluded only `journey.js:891` (the step-nav "active stage" breadcrumb) was unsafe. During implementation, direct re-inspection of the remaining un-verified candidates from that same grep (lines 478, 632, 779, which had been listed but not individually confirmed safe or unsafe before sign-off) found two more genuine instances of the identical bug pattern: `handleGetStageReview`'s fallback (line 628-632) and `handleGetJourneyStageView`'s own no-artefact-yet fallback (line 775-779). A fourth was also found to be a separate, more literal match for the actual production reproduction: `currentChatUrl` (line 931-933), which backs the "← Current stage" button — the exact link clicked during live reproduction, distinct from the step-nav breadcrumb at line 891 that the original investigation had focused on.

**Decision:** Expand the fix to cover all four call sites, using the identical `/journey/:featureSlug/resume` redirect target for each, rather than shipping a partial fix that leaves the same dead end reachable via three other doors. The story, test plan, and DoR were all updated in place (before any PR was opened) to reflect the corrected AC1-AC8 scope.

**Rationale:** The story's own stated thesis is that a stale `activeSessionId` should never dead-end the user regardless of which UI element led them there. Shipping a fix that only closed one of four identical doors would have technically satisfied the original (incomplete) story text while leaving the underlying problem live and reproducible via three other navigation paths — an outcome the operator would reasonably consider incomplete once discovered. Correctness of the underlying fix took priority over minimizing churn to already-drafted artefacts.
