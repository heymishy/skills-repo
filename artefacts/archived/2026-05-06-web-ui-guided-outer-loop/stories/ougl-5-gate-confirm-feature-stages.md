## Story: Gate-confirm handler — write artefact to disk, build handoff, route to next stage

**Epic reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-2-discovery-to-definition.md
**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Benefit-metric reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/benefit-metric.md

## User Story

As a **non-engineer operator**,
I want clicking "Save and continue to benefit-metric" to write the discovery artefact to disk and automatically open a benefit-metric session with my prior context already loaded,
So that I do not need to manually save files, copy content between sessions, or know the pipeline stage sequence.

## Benefit Linkage

**Metric moved:** MM1 (Artefact quality parity) and MM2 (Handoff coherence ≥ 4/5)
**How:** This handler is the moment where prior context is captured (disk write) and injected into the next stage (priorArtefacts passed to `registerHtmlSession`). Without this, the benefit-metric model starts cold with no discovery context. With it, the model receives the discovery artefact verbatim, producing quality-equivalent output to a VS Code session.

## Architecture Constraints

- New route in `src/web-ui/routes/journey.js`: `POST /api/journey/:journeyId/gate-confirm`. Wired in `server.js`.
- **Write-then-read pattern (ADR logged in decisions.md):** The handler MUST write `session.artefactContent` to disk, then read it back with `fs.readFileSync` to build the `priorArtefacts` array. `session.artefactContent` (in-memory) must NOT be used directly as the prior artefact content after the disk write step. This ensures the handoff context reflects what was actually persisted.
- The disk write path is derived from `session.artefactPath` (set by `htmlSubmitTurn` when the model produces `---SLUG---`). The path is relative to the repo root. The handler calls `path.join(_getRepoPath(), session.artefactPath)` and creates intermediate directories with `fs.mkdirSync({ recursive: true })` before writing.
- `_getRepoPath()` from the existing `skills.js` module. The journey handler must import this utility or re-derive the repo root the same way.
- **Security — path traversal prevention:** Before the disk write, the resolved absolute path MUST be verified to start with the repo root path (i.e. `resolvedPath.startsWith(repoRoot + path.sep)`). Reject with HTTP 400 if the path would escape the repo root.
- `req.session.accessToken` is the canonical auth token field.
- Per-story stage boundary: when `getNextStage(session.skillName)` returns `'test-plan'`, redirect to `GET /journey/:journeyId/stories` instead of creating a next-stage session. Per-story routing is completed in ougl.6.
- Feature-slug update: when the journey's `featureSlug` is empty (`''`), derive it from `session.artefactPath` (e.g. `artefacts/2026-05-06-my-feature/discovery.md` → `featureSlug = '2026-05-06-my-feature'`) and update the journey store entry.
- Zero new npm dependencies.

## Dependencies

- **Upstream:** ougl.1 (`buildSystemPrompt` with priorArtefacts), ougl.2 (journey store, `registerHtmlSession` with priorArtefacts + journeyId), ougl.3 (journey creation), ougl.4 (gate-confirm button rendered in chat).
- **Downstream:** ougl.6 (per-story stage routing extends this handler's story-mode branch).

## Acceptance Criteria

**AC1:** Given a journey exists with `activeSessionId` pointing to a session where `done: true` and `artefactContent` is non-null, when `POST /api/journey/:journeyId/gate-confirm` is called by an authenticated operator, then the handler writes `session.artefactContent` to disk at `path.join(repoRoot, session.artefactPath)`, creating intermediate directories if they do not exist.

**AC2:** Given the artefact is written to disk, when the handler builds the `priorArtefacts` array for the next-stage session, then it reads the artefact back from disk with `fs.readFileSync(diskPath, 'utf8')` and uses the disk content — NOT `session.artefactContent` — as the `content` value in the priorArtefacts array.

**AC3:** Given the gate-confirm succeeds and `getNextStage(session.skillName)` returns `'benefit-metric'`, when the handler creates the next-stage session, then `registerHtmlSession` is called with `(newSessionId, newSessionPath, 'benefit-metric', priorArtefacts)` where `priorArtefacts` has length ≥ 1 and `priorArtefacts[0].path === session.artefactPath`.

**AC4:** Given `_getHtmlSession(newSessionId)` is inspected after the next-stage session is created, then `session.journeyId === journeyId` (journey link is established on the new session).

**AC5:** Given the gate-confirm creates the next-stage session, when `_getHtmlSession(newSessionId).systemPrompt` is inspected, then it contains the substring `--- HANDOFF CONTEXT ---` (the handoff block was injected by `buildSystemPrompt`).

**AC6:** Given a successful gate-confirm for the `discovery → benefit-metric` transition, when the response is returned, then it is HTTP 303 with `Location: /skills/benefit-metric/sessions/[newSessionId]/chat`.

**AC7:** Given the session has `done: false` (skill session not yet complete), when `POST /api/journey/:journeyId/gate-confirm` is called, then the response is HTTP 400.

**AC8:** Given an unknown `journeyId` is supplied, when `POST /api/journey/:journeyId/gate-confirm` is called, then the response is HTTP 404.

**AC9:** Given an unauthenticated POST to `/api/journey/:journeyId/gate-confirm`, when the response is returned, then it is HTTP 302 with `Location: /auth/github`.

**AC10:** Given `getNextStage(session.skillName)` returns `'test-plan'` (the per-story stage boundary), when the gate-confirm handler runs, then the response is HTTP 303 with `Location: /journey/:journeyId/stories` — no next-stage session is created in this case.

**AC11:** Given `session.artefactPath` would resolve to a path outside the repo root (e.g. `../../etc/passwd`), when the handler validates the resolved path, then it returns HTTP 400 and does NOT write any file to disk.

**AC12:** Given two prior completed stages exist in the journey (e.g. `discovery` and `benefit-metric` are complete and the gate-confirm is firing for the `definition` stage), when the handler builds `priorArtefacts`, then the array contains entries for ALL previously completed stages (discovery artefact AND benefit-metric artefact), each read from disk.

## Out of Scope

- GitHub commit or PR creation — artefacts are written to local disk only. No GitHub API calls in this handler.
- Artefact content editing before saving — the handler uses `session.artefactContent` as-is. A future story could add an edit step, but that is out of scope for MVP.
- Per-story stage handling (test-plan → review → definition-of-ready) — the gate-confirm in story mode is extended in ougl.6 and ougl.7.
- Handling `journeyId` supplied in the POST body — `journeyId` comes from the URL path parameter only. Client-supplied body values are ignored for security.

## NFRs

- **Security:** Path traversal prevention is mandatory (AC11). The resolved disk path must be within the repo root before any `fs.writeFileSync` call.
- **Atomicity:** If the disk write fails (e.g. permission error), the handler must return HTTP 500 and must NOT advance the journey state (no `completeStage` call if the write fails).
- **Audit:** Log a structured event at info level after successful disk write: `{event: 'artefact_saved_to_disk', journeyId, skillName, artefactPath}`.
