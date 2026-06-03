# Spike A1 — SSE Architecture Feasibility for Assumption Cards and Conditions Sidebar

| Field | Value |
|-------|-------|
| Spike ID | A1 |
| Feature | 2026-05-21-ideate-web-ux |
| Date | 2026-06-03 |
| Type | Technical feasibility |
| Blocking | /discovery for 2026-05-21-ideate-web-ux — story decomposition cannot be scoped until this is resolved |
| Timebox | 2 days (actual: 1 session, investigation complete) |
| Outcome | **PROCEED** |

---

## Question

Can assumption cards and a conditions sidebar be driven from SSE events using the existing session/streaming architecture, or does this require a structural rewrite?

---

## Done condition

All three conditions met:
1. An assumption card can be pushed from server to client via SSE
2. The operator can confirm/flag a card and the state persists in the server-side session
3. The existing artefact draft panel continues to work unaffected

---

## Findings

### What actually exists (correcting the ideation assumption)

The ideation artefact described a "draftSections[] split-panel SSE architecture". The actual architecture is two parallel interaction models:

**Model 1 — Form POST + full page reload** (`handlePostAnswerHtml` path):
Used for the structured Q&A skill flow (static SKILL.md questions → answers). Server re-renders the entire page on each POST. The `draftSections[]` array is assembled from session state and passed to `renderChat()` in `chat-view.js`. No live updates — the right panel is only current as of the last page load.

**Model 2 — Fetch + SSE streaming** (`handleGetChatHtml` / `handlePostTurnStreamHtml` path):
Used for the model-first chat interface at `/skills/:name/sessions/:id/chat`. This is the architecture relevant to the /ideate UX. The client submits an answer via `fetch()`, the server streams SSE events as the model generates output, and the client DOM is updated without a page reload.

The SSE stream in Model 2 already sends **three concurrent event types**:
- `{ chunk: "..." }` — model text chunk, rendered in the chat thread
- `{ draftChunk: "..." }` — artefact content extracted from `---ARTEFACT-START---...---ARTEFACT-END---` protocol markers, streamed to the right panel via `updateDraftPanel()`
- `{ done: bool, artefactContent: "..." }` — final event, triggers the commit link

The session object (`_sessionStore.get(sessionId)`) stores: `turns[]`, `systemPrompt`, `artefactContent`, `featureSlug`, `skillName`, `done`, `journeyId`.

### Extension path for assumption cards (Done condition 1 — PASSED)

Adding `{ assumptionCard: { id, text, type, status } }` as a new SSE event type follows exactly the same protocol as `draftChunk`:

**Server-side (routes/skills.js `handlePostTurnStreamHtml`)**:
The `onChunk` callback accumulates streaming text and parses for `---ARTEFACT-START---` markers. The same pattern works for `---ASSUMPTION-START---...---ASSUMPTION-END---` markers. Each assumption block emits a `{ assumptionCard: {...} }` event alongside the existing `chunk` and `draftChunk` events.

```js
// In onChunk callback — new block alongside existing DRAFT detection:
var assumptionMatch = chunk.match(/---ASSUMPTION---\s*([\s\S]+?)\s*---END-ASSUMPTION---/);
if (assumptionMatch) {
  res.write('data: ' + JSON.stringify({ assumptionCard: parseAssumption(assumptionMatch[1]) }) + '\n\n');
}
```

No changes to the core SSE handler structure. No new streaming architecture.

**Client-side (inline JS in `handleGetChatHtml`)**:
The `sendTurn()` function iterates all SSE events in a `lines.forEach` loop. Adding assumption card handling is a new `if` branch in the same loop — the existing `chunk`, `draftChunk`, and `done` branches are unaffected.

```js
if (evt.assumptionCard) {
  appendAssumptionCard(evt.assumptionCard);  // new function, appends to #assumption-cards section
}
```

Done condition 1 is **PASSED** — this requires zero structural changes to the SSE layer.

### Persisting card state to session (Done condition 2 — PASSED with note)

`session.assumptionCards = []` as a new field on the in-memory session object requires no schema changes. The session is a plain JS object in a `Map`.

User interactions (confirm/flag) need to write back to the session. Two options:

**Option A — Dedicated endpoint** (recommended): `POST /api/skills/:name/sessions/:id/assumption/:cardId/confirm` sets `session.assumptionCards[cardId].status = 'confirmed'`. This is a small new route handler following the exact same auth/session guard pattern as the existing routes. No new middleware.

**Option B — Embed in next turn message**: The client includes confirmed card IDs in the next answer payload. Simpler, but loses real-time persistence — if the session is lost before the next turn, confirmations are lost.

Done condition 2 is **PASSED** with Option A as the recommended path.

### Artefact panel unaffected (Done condition 3 — PASSED with layout note)

The existing `updateDraftPanel()` function and `#draft-content` div continue to work unchanged. The assumption cards section is a NEW section added to the right panel layout — either above or below the artefact div.

**One layout change required**: The right panel currently has a single `#draft-content` div. For assumption cards + artefact to coexist, the right panel needs two named sections:
- `#assumption-cards` — rendered as a card list, grows as the session progresses
- `#draft-content` — unchanged from current implementation

This is a CSS/HTML change in the `renderChat` inline styles and the `handleGetChatHtml` view template. It is **not** a structural change to the streaming architecture or session model.

Done condition 3 is **PASSED**.

---

## What needs to be designed before stories are written

1. **Protocol marker format**: The model needs to emit `---ASSUMPTION---` markers in its output. This requires a system prompt addition to the /ideate skill. The marker format must be parseable mid-stream (no ambiguity with partial chunk boundaries). Simplest safe format: single-line JSON marker `---ASSUMPTION-JSON: {"id":1,"text":"...","type":"desirability"}---`

2. **Assumption card interaction model** (Assumption A5 from Lens B, still open): must be resolved in /discovery before stories are written. Options: optional-with-reminder, required-before-lens-advance, or batch-at-lens-end. The chosen model affects whether Option A endpoint is needed at all.

3. **Right panel layout split**: Two-section layout (assumption cards above, artefact below) — the relative heights and overflow behaviour need to be specified. The existing `height: calc(100vh - 48px - 64px)` on `.sw-chat` and flex layout on `.sw-chat-pane` can accommodate this with a `display:flex;flex-direction:column` on the right pane and `flex:0 0 auto` on the cards section.

---

## Conditions sidebar (Lens A Cluster 6)

Identical extension path to assumption cards. A `{ conditionItem: { id, text, status } }` SSE event type, a `#conditions-sidebar` section in the right panel, and a `session.conditions[]` field. Even simpler than assumption cards because conditions don't require real-time confirmation — they are accumulated throughout the session and shown at the end. No separate confirm endpoint needed for the MVP.

---

## Outcome

**PROCEED** on /discovery for 2026-05-21-ideate-web-ux.

All three done conditions are met. The existing SSE + session model in `handleGetChatHtml` / `handlePostTurnStreamHtml` can support assumption cards and a conditions sidebar through incremental extension — new SSE event types, new session fields, new DOM sections — without modifying the core SSE handler, session model schema, or existing `chunk`/`draftChunk`/`done` event handling.

The build cost is genuinely incremental (Lens B A10 confirmed): the extension points are clearly defined and follow established patterns in the existing code.

**Architecture decisions to log (feed into /discovery and decisions.md):**
- Assumption card confirmation: use dedicated `POST /assumption/:cardId/confirm` endpoint (Option A)
- Protocol markers: single-line JSON format for safe mid-stream parsing
- Right panel layout: two named sections (`#assumption-cards` top, `#draft-content` below)
- Session resume: Mode (a) — read from disk + re-brief — is confirmed viable; `session.turns[]` is the authoritative history source and can be reconstructed from the committed artefact text

---

*Spike A1 complete. Blocking assumption A1 resolved: PROCEED.*
