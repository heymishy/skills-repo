## Story: Journey-aware chat page — "Save and continue" button when session is done

**Epic reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-2-discovery-to-definition.md
**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Benefit-metric reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/benefit-metric.md

## User Story

As a **non-engineer operator**,
I want to see a "Save and continue to [next skill]" button when the current skill session is done and I am in a journey,
So that I know exactly what to do next and do not have to manually navigate or understand the pipeline stage sequence.

## Benefit Linkage

**Metric moved:** MM2 (Handoff coherence ≥ 4/5 operator rating)
**How:** The explicit "Save and continue to benefit-metric" label at the done state tells the operator what comes next without requiring pipeline knowledge. Without this button, the operator sees the same "commit to GitHub" flow as a standalone session, with no guidance on journey continuation.

## Architecture Constraints

- The modification is to `handleGetChatHtml` (or the `_renderChatPage` / chat-view render path it delegates to) in `src/web-ui/routes/skills.js`. The journey-aware button is injected only when `session.journeyId` is non-null AND `session.done === true`.
- `getNextStage(session.skillName)` from the journey store module (`src/web-ui/modules/journey-store.js`, ougl.2) is called at render time to determine the label.
- The gate-confirm form `action` must be `/api/journey/[journeyId]/gate-confirm` — this URL is constructed server-side from `session.journeyId`. The client does not supply the journeyId.
- When `getNextStage` returns `null` (last stage — `definition-of-ready`), the button links to `/journey/[journeyId]/complete` instead of a gate-confirm form.
- The existing "commit to GitHub" path (`/skills/:name/sessions/:id/commit-preview`) must remain accessible for standalone (non-journey) sessions — this story must not remove or break it.
- `escHtml` must be applied to all values interpolated into HTML — `journeyId`, `skillName`, `sessionId` are all HTML-escaped before use.
- No new npm dependencies.

## Dependencies

- **Upstream:** ougl.2 must be complete (`linkSessionToJourney`, `getNextStage` available).
- **Downstream:** ougl.5 (gate-confirm handler) — the form POSTs to the gate-confirm endpoint which is created in ougl.5. When this story is delivered first, clicking the button returns 404 until ougl.5 is complete. That is acceptable — the UI can be delivered independently.

## Acceptance Criteria

**AC1:** Given a session in `_sessionStore` has `journeyId: 'journey-abc'` and `done: true`, when `GET /skills/discovery/sessions/[sid]/chat` is rendered, then the HTML body contains a `<form method="POST" action="/api/journey/journey-abc/gate-confirm">` element.

**AC2:** Given a session has `journeyId: 'journey-abc'`, `done: true`, and `skillName: 'discovery'`, when the chat page is rendered, then the HTML body contains a button or submit input whose visible text includes `benefit-metric` (the next stage name, from `getNextStage('discovery')`).

**AC3:** Given a session has `journeyId: null` (standalone session) and `done: true`, when the chat page is rendered, then the HTML body does NOT contain the substring `/api/journey/` (no gate-confirm form rendered for standalone sessions).

**AC4:** Given a session has `journeyId: 'journey-abc'` and `done: false` (session still in progress), when the chat page is rendered, then the HTML body does NOT contain `/api/journey/journey-abc/gate-confirm` (button appears only when done).

**AC5:** Given a session has `journeyId: 'journey-abc'`, `done: true`, and `skillName: 'definition-of-ready'` (last stage, `getNextStage` returns `null`), when the chat page is rendered, then the HTML body contains a link or button referencing `/journey/journey-abc/complete` — NOT a gate-confirm form.

**AC6:** Given a standalone session has `journeyId: null` and `done: true`, when the chat page is rendered, then the existing commit-preview link (`/skills/:name/sessions/:id/commit-preview`) is still present (backward compatibility — standalone sessions unaffected).

**AC7:** Given `journeyId` contains characters requiring HTML encoding (e.g. `<script>`), when the chat page is rendered, then the encoded value is used in the HTML attribute value — the raw string does not appear unescaped (XSS prevention via `escHtml`).

## Out of Scope

- Changing the visual design of the chat page beyond adding the journey gate-confirm button — layout, colours, and existing chat transcript rendering are not modified.
- Adding a "back" button or navigation history — MVP is a linear forward-only flow.
- Showing completed stages or a progress indicator on the chat page — that is a post-MVP enhancement.

## NFRs

- **Security:** `escHtml` must be applied to `journeyId` and `skillName` before interpolation into HTML attributes or text content. These values originate from server memory (not user-supplied directly), but defence in depth requires escaping at the render boundary.
- **Accessibility:** The gate-confirm button must be a `<button type="submit">` inside a `<form>` — not an `<a>` tag styled as a button. This ensures keyboard navigability and assistive technology compatibility.
