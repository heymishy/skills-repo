## Story: Clicking a kanban card resumes the journey's live session, not a static summary page

**Short-track:** bug fix — a real UX gap in S3.4's own delivered behaviour, found through live operator usage.

## User Story

As **Hamish King (Founder/Operator)**,
I want **clicking a kanban card to take me directly into the journey's actual current session — the live conversation if mid-turn, the produced draft artefact if a turn just completed, or straight into whatever stage (`/definition`, `/review`, etc.) the journey is actually at**,
So that **I don't land on a static "Journey: X / Stage: Y" summary page that tells me almost nothing and makes me take a second navigation step to actually see or act on anything**.

## Background / Investigation

S3.4 (`handleGetJourneyById`, `src/web-ui/routes/journey.js:2412`) was built to satisfy its own AC2 ("shows the current stage and a link to artefact files") — and it does exactly that, verified by 8/8 passing tests. Direct operator usage today revealed this is not what's actually useful: the page shows only `Journey: <slug>`, `Stage: <name>`, `Active viewers: N`, and a link to the artefact index — never the actual session content.

A more complete, proven mechanism for exactly this ("resume this feature's real, current activity") already exists and is used elsewhere in this app: `handleGetJourneyResume` (`journey.js:1134`, routed as `GET /journey/:featureSlug/resume`, used today by the journey list's own "Continue →" link). It resolves the journey's active session (fast path from memory; Redis-restore fallback; disk/Postgres dual-lookup) and redirects (303) straight to `/skills/:skillName/sessions/:sessionId/chat` — the real chat page, which already correctly renders prior turn history (SSE-replayed) and, when the session is `done` with a produced artefact, the draft artefact itself (`_renderChatPage`, `skills.js:2319`, confirmed via code read: `if (isIdeate && session.done && session.artefactContent) { draftSections = [...] }` for ideate, `artefactInitScript` for non-ideate).

**Gap found in reuse:** the chat page (`handleGetChatHtml`/`_renderChatPage`) has no "back to board" mechanism at all today — unlike S3.4's own detail page, which built exactly this (`_isSafeBoardBackLink`, an open-redirect-safe allowlist check against a `?from=` query value). Reusing the resume flow verbatim would silently drop that affordance.

## Architecture Constraints

- **Reuse `handleGetJourneyResume`'s existing resolution logic — do not build a second, parallel "find the active session" mechanism.** The kanban card already carries `card.id` (confirmed = `journeyId`, per S3.4's own investigation); `_journeyStore.getJourney(journeyId)` already returns `featureSlug` directly, so `handleGetJourneyById` can redirect (303) to `/journey/:featureSlug/resume` rather than duplicating the resolution logic inline.
- **Preserve the "back to board" affordance** by passing the same `?from=` value through to the resumed chat session's URL, and add the same `_isSafeBoardBackLink` allowlist check (exported from `journey.js`, reused — not reimplemented — in `skills.js`) before rendering a "← Back to board" link on the chat page.
- **Fallback when no active session is resolvable at all** (e.g. the journey is fully complete, `completedStages` covers every stage, no `activeSessionId`): redirect to the existing artefact index (`/features/:slug`) rather than a dead-end or an error — this preserves S3.4's own AC2 intent (show useful state) for the one case where there's genuinely no session to resume.
- **Do not remove `handleGetJourneyById`'s own tenant-ownership guard or viewer-registration side effect** (`_registerViewer`/`_getActiveViewerCount`) — both are real, already-tested behaviour (S3.4 AC4, live-viewer tracking) that must survive this change regardless of which page the operator ultimately lands on.

## Dependencies

- **Upstream:** S3.4 (this story changes `handleGetJourneyById`'s own behaviour, delivered by S3.4).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a journey whose active session is NOT done (mid-conversation), When the operator clicks its kanban card, Then they land directly on that session's real chat page (`/skills/:skillName/sessions/:sessionId/chat`), showing the existing turn history — not the static summary page.

**AC2:** Given a journey whose active session IS done and has produced a draft artefact, When the operator clicks its kanban card, Then they land on the same chat page, which shows the produced draft artefact (via the chat page's own existing `session.done && session.artefactContent` rendering) alongside the turn history.

**AC3:** Given a journey with no active session at all (fully complete, or between stages with none yet started), When the operator clicks its kanban card, Then they land on the artefact index (`/features/:slug`) instead of a dead-end.

**AC4:** Given the operator arrived at the resumed chat page via a kanban card click, When they want to return to the board, Then a "← Back to board" link is present and points at the real originating board URL (same safe-allowlist behaviour S3.4 already built for its own detail page — an unrecognised/unsafe value falls back to the tenant dashboard board, never an open redirect).

**AC5:** Given a journey belonging to a product/tenant the operator does NOT own, When they attempt to reach it via a crafted kanban-card-style URL, Then access is denied per the existing tenant-ownership pattern (404, not 403) — this story does not weaken S3.4's own AC4 guard.

## Out of Scope

- Any redesign of the chat page's own content/layout beyond adding the back-link — the turn-history/artefact rendering itself is already correct and untouched.
- Changing `handleGetJourneyResume`'s own existing behaviour or its `featureSlug`-keyed route — reused as-is.
- Removing `handleGetJourneyById`/`GET /journey/:id` as a route — it still exists, its behaviour changes from "render a summary" to "redirect into the resume flow."

## NFRs

- **Performance:** No new cost — reuses `handleGetJourneyResume`'s existing fast-path (memory-first) resolution.
- **Security:** Tenant-ownership enforcement unchanged (AC5); the `?from=` back-link value must go through the same open-redirect-safe allowlist check on both ends (the redirect-building side and the chat-page-rendering side).
- **Accessibility:** The "Back to board" link on the chat page is a real, keyboard-activatable `<a>` element, matching S3.4's own existing pattern.
- **Audit:** Not applicable — no new state mutation, only a change in navigation destination.

## Complexity Rating

**Rating:** 2 — the core redirect is simple (an existing, proven mechanism), but propagating the `?from=` back-link safely across two different pages (the redirect origin and the chat page) requires real care to avoid silently dropping S3.4's own open-redirect protection.
**Scope stability:** Stable.
