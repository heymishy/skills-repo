# Implementation Plan: dsh-s4 — Fix "Resume conversation" to always resolve to a real conversation view

**Story:** artefacts/2026-07-28-durable-session-history/stories/dsh-s4-fix-resume-conversation-link.md
**Test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s4-fix-resume-conversation-link-test-plan.md
**DoR:** artefacts/2026-07-28-durable-session-history/dor/dsh-s4-fix-resume-conversation-link-dor.md

---

## Research findings (from an Explore agent pass, informing the tasks below)

- `_resolveResumeLinksForFeature(journey)` in `src/web-ui/routes/features.js:118` returns `{[artefactPath]: {skillName, sessionId}}` — no `journeyId` in the returned shape today, but the caller (`handleGetFeatureArtefacts`, line 179) already has `journeyForPage.journeyId` in scope from `_journeyStore.getJourneyByFeatureSlug(featureSlug)`. Thread it through into the lookup value or as an extra param.
- `renderArtefactIndexHtml(artefacts, featureSlug, resumeLookup)` (line 141) builds the actual `<a href="/skills/.../chat">Resume conversation</a>` at lines 162-165 — this is the one line to change to `/journey/:journeyId/stage/:stageName`.
- `_isTestEndpointAllowed(req)` (`server.js:1137`) is the staging-safe gate: `NODE_ENV==='test' OR (E2E_STAGING_AUTH_STUB_SECRET configured AND x-e2e-test-endpoint-bypass header matches, constant-time compare)`. `/test/seed-multi-user-roles` (line 1835) is a real example of a POST endpoint using this exact gate — mirror its shape.
- `_sessionStore` (`routes/skills.js:47`) is a plain `Map`. No delete/evict function is exported today — add `_evictHtmlSession(sessionId)` (returns `_sessionStore.delete(sessionId)`) and export it alongside `_getHtmlSession`/`_setHtmlSession`/`_listHtmlSessions`.
- `.github/workflows/e2e.yml:196` (Scenario A job) is the existing `npx playwright test tests/e2e/a1-....spec.js tests/e2e/a2-....spec.js tests/e2e/a3-....spec.js tests/e2e/a4-....spec.js --workers=1` line — append the new spec file to this same line (Scenario A, since the story explicitly names a restart-survival/session-eviction test in the same family as a1/a4).

## Tasks

### Task 1 — Repoint the "Resume conversation" link (`src/web-ui/routes/features.js`)
Thread `journeyId` through `_resolveResumeLinksForFeature`'s return shape (or pass it as an additional argument to `renderArtefactIndexHtml`), and change the `<a href>` at lines 162-165 from `/skills/:skillName/sessions/:sessionId/chat` to `/journey/:journeyId/stage/:stageName` (using the stage's `skillName` field as `stageName`, per dsh-s3's route). Unit tests: AC1 (href points at the new route for a feature with a completed, resolvable stage) and AC3 (still renders correctly when the target session is still in-memory — this is really confirming the link and destination page compose correctly, since dsh-s3 already covers the in-memory-vs-durable rendering branch itself).

### Task 2 — `POST /test/evict-skill-session` (`src/web-ui/server.js` + `src/web-ui/routes/skills.js`)
Add `_evictHtmlSession(sessionId)` to `routes/skills.js` (deletes one entry from `_sessionStore`, returns whether it existed) and export it. Add the new endpoint in `server.js`, gated by `_isTestEndpointAllowed(req)` (not the plain `NODE_ENV==='test'` inline check some other seed endpoints use — this one must also work against real staging via the `E2E_STAGING_AUTH_STUB_SECRET` header, matching `/test/seed-multi-user-roles`'s exact shape), parsing `{sessionId}` from the body and calling `_evictHtmlSession`. Never touches Redis or Postgres. Unit test: calling the endpoint removes exactly the named session from the in-memory store and leaves any other session untouched.

### Task 3 — Playwright E2E spec against real staging (`tests/e2e/dsh-s4-resume-conversation-survives-restart.spec.js`)
Using `tests/e2e/fixtures/staging-auth.js`'s `uniqueEmail()` (matching Scenario A/B's existing real-staging convention). Creates a real `e2e-test-*` tenant, drives a real stage to completion through the mock LLM gateway (so a real `session_turns` row is written by dsh-s1's deployed code), calls `POST /test/evict-skill-session` for that session's id (removing it from memory only), then follows the "Resume conversation" link (Task 1's new href) and asserts the real conversation renders — never "Session not found." Wire this spec file into `.github/workflows/e2e.yml`'s Scenario A job (append to the existing `npx playwright test ...` line, alongside a1-a4) as a CI-blocking check, matching the existing pattern exactly (no new job/workflow).

## Sequencing

Task 1 and Task 2 are independent of each other. Task 3 depends on both (needs the new href from Task 1 and the eviction endpoint from Task 2). Dispatched sequentially, one fresh subagent per task, independently verified before starting the next — same pattern as dsh-s1 and dsh-s3.
