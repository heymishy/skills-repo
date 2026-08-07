## Story: Completing /definition moves straight into /review, no manual story-list confirm step

**Short-track:** bug fix — bounded behavioural correction to an existing route handler.

## User Story

As **Hamish King (Founder/Operator)**,
I want **completing the /definition stage to move directly into /review using every story the definition artefact already defined**,
So that **I don't have to visit a separate "Story list for journey" page and manually resubmit a list the definition artefact already contains, when nothing needs editing**.

## Background / Current Behaviour

`handlePostGateConfirm` (`src/web-ui/routes/journey.js:1975-1979`), when `nextStage === 'review'` (i.e. `/definition` just completed), always redirects to `GET /journey/:id/stories` — a manual confirm page (`handleGetStories`) that pre-fills a textarea from the definition artefact (dsda-s1, shipped earlier this session) but still requires the operator to view the page and click "Start per-story stages" before review actually begins.

**Operator's stated expectation (2026-07-24):** "Moving from definition would expect to move to /review with all stories defined from definition step, performing the review as per usual" — i.e. no manual intermediate step when the story list can already be auto-extracted.

## Acceptance Criteria

**AC1:** Given a journey has just completed `/definition` and its artefact contains one or more parseable story headers (per `extractStoryIdsFromDefinitionArtefact`'s existing H1/flat-story formats), When the gate-confirm completes, Then the journey is redirected directly to a new `/review` session for the first extracted story — no intermediate page.

**AC2:** Given the same scenario as AC1, When the redirect happens, Then `journeyStore.setStoryList` has been called with the full extracted story list (not just the first story), so `test-plan`/`definition-of-ready` continue to cycle through every story afterward exactly as they do today via the manual path.

**AC3:** Given a journey completes `/definition` but its artefact's story headers can't be parsed (empty extraction result — malformed/legacy format), When the gate-confirm completes, Then the existing manual fallback (`GET /journey/:id/stories`) is used, unchanged — this preserves the only real safety net for an artefact this extractor can't understand.

**AC4:** Given the operator explicitly wants to edit the auto-extracted list before starting review (add/remove/reorder a story), the manual `/journey/:id/stories` page must still exist and still work exactly as before — this story does not remove that page, only skips it on the auto-extractable happy path.

## Out of Scope

- Changing `extractStoryIdsFromDefinitionArtefact`'s own parsing rules or supported formats.
- Adding a way to review/edit the auto-extracted list before review starts (that's what the now-bypassed manual page already provides, for the cases where an operator navigates there directly or the extraction fails).
- `handlePostStories` (the manual submit path) itself — left as-is, still reachable directly.

## Benefit Linkage

Removes one unnecessary manual step per feature that already reduces end-to-end pipeline friction — same class of value as dsda-s1 (auto-populate), extended to skip the confirm entirely on the common, unambiguous case.

## Complexity Rating

**Rating:** 1 — reuses the existing, already-tested `extractStoryIdsFromDefinitionArtefact` function and the existing review-session-creation code path; no new persistence or schema.
**Scope stability:** Stable.

## NFRs

- **None beyond existing behaviour** — no new attack surface; reuses the same session-creation and tenant-scoping already in place for the manual path.
