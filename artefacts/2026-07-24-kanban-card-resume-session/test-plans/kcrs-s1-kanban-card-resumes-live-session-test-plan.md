## Test Plan: Clicking a kanban card resumes the journey's live session

**Story reference:** artefacts/2026-07-24-kanban-card-resume-session/stories/kcrs-s1-kanban-card-resumes-live-session.md

## AC Coverage

| AC | Description | Integration | Gap type | Risk |
|----|-------------|-------------|----------|------|
| AC1 | Mid-conversation session -> redirects to real chat page | 1 test | — | 🟢 |
| AC2 | Done session with draft artefact -> chat page shows it | 1 test | — | 🟢 |
| AC3 | No active session -> falls back to /features/:slug | 1 test | — | 🟢 |
| AC4 | Back-to-board link present and safe on the chat page | 2 tests | — | 🟢 |
| AC5 | Cross-tenant access still denied (404) | 1 test | — | 🟢 |

## Integration Tests

### midConversationSessionRedirectsToChatPage
- **Verifies:** AC1
- **Precondition:** A journey with an active session, `done: false`
- **Action:** `GET /journey/:journeyId`
- **Expected result:** 303 redirect to `/skills/:skillName/sessions/:sessionId/chat` (with a `?from=` query param appended)

### doneSessionWithArtefactStillRedirectsToChatPage
- **Verifies:** AC2
- **Precondition:** A journey with an active session, `done: true`, `artefactContent` set
- **Action:** `GET /journey/:journeyId`, then follow to the chat page
- **Expected result:** Redirect target is the same chat page; the chat page's own existing rendering shows the artefact (verified by confirming `handleGetChatHtml`'s existing artefact-rendering path is reached, not re-testing that rendering logic itself, which predates this story)

### noActiveSessionFallsBackToArtefactIndex
- **Verifies:** AC3
- **Precondition:** A journey with `completedStages` covering every stage, no `activeSessionId`
- **Action:** `GET /journey/:journeyId`
- **Expected result:** 303 redirect to `/features/:slug`, not a dead-end or error

### backToBoardLinkPresentAndSafe (2 tests)
- **Verifies:** AC4
- **Action:** Follow the redirect chain from a kanban card link carrying a real `?from=/products/x/kanban` value, and separately with an unsafe `?from=//evil.example.com`
- **Expected result:** The resumed chat page includes a "Back to board" link pointing at the real originating board for the safe case; falls back to `/dashboard?view=board` for the unsafe case, never reflecting the unsafe value

### crossTenantAccessStillDenied404
- **Verifies:** AC5
- **Action:** `GET /journey/:journeyId` for a journey belonging to another tenant
- **Expected result:** 404, matching S3.4's own existing guard (unchanged)

## Out of Scope for This Test Plan

- Re-testing the chat page's own turn-history/artefact rendering logic — pre-existing, unchanged by this story.
- Re-testing `handleGetJourneyResume`'s own internal disk/Postgres/Redis resolution logic — pre-existing, reused as-is.
