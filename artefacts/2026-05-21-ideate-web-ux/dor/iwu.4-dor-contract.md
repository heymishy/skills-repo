# DoR Scope Contract: iwu.4 — Confirm and flag assumption cards

**Story:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.4.md
**DoR:** artefacts/2026-05-21-ideate-web-ux/dor/iwu.4-dor.md
**Date:** 2026-06-04

---

## Required file touchpoints

### Files to READ before implementing (mandatory context)

| File | Reason |
|------|--------|
| `src/web-ui/routes/skills.js` | Implement new handler; read existing route handler patterns (handleGetChatHtml, handlePostTurnStreamHtml) and _sessionStore access pattern |
| `src/web-ui/server.js` | Route registration — understand existing route wiring before adding new route |
| `src/web-ui/views/chat-view.js` | Card HTML structure (from iwu.3) — understand confirm/flag button DOM and data-card-id attribute |
| `.github/architecture-guardrails.md` | Mandatory pre-implementation read; path traversal guard pattern documented here |
| `artefacts/2026-05-21-ideate-web-ux/stories/iwu.4.md` | ACs, endpoint spec, path traversal guard requirement |
| `artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.4-test-plan.md` | Test specification |

### Files to CREATE

| File | Contents |
|------|----------|
| `tests/check-iwu4-confirm-flag.js` | Governance test — all 13 unit/integration tests from the test plan including mandatory path traversal test |

### Files to MODIFY

| File | Change |
|------|--------|
| `src/web-ui/routes/skills.js` | Add `handleConfirmFlagAssumptionCard(req, res)` handler: validate cardId format (hex 8-char regex; HTTP 400 if invalid), resolve session (HTTP 404 if expired), find card in assumptionCards[] (HTTP 404 if not found), validate action field (HTTP 400 if missing/invalid), mutate card status, return HTTP 200 JSON with updated card |
| `src/web-ui/server.js` | Register `POST /api/skills/:name/sessions/:id/assumption/:cardId/confirm` route pointing to the new handler |
| `src/web-ui/views/chat-view.js` | Add client-side click handler on confirm/flag buttons: call POST endpoint, update card CSS class (confirmed/flagged) and aria-label on success, show transient error text inside card on non-2xx |
| `package.json` | Add `node tests/check-iwu4-confirm-flag.js` to the `test` script chain |

### Files that MUST NOT be touched

| File | Reason |
|------|--------|
| `.github/skills/ideate/SKILL.md` | Governed file — iwu.6 scope only |
| lensComplete SSE event type in `src/web-ui/routes/skills.js` | iwu.5 scope |
| Nudge bar HTML in `src/web-ui/views/chat-view.js` | iwu.5 scope |
| `session.assumptionCardsEnabled` default value | iwu.6 scope |
| Any file under `artefacts/` | Read-only pipeline artefacts |

---

## Security implementation requirements

**cardId path traversal guard (NFR-SEC — mandatory):**
```javascript
// In handleConfirmFlagAssumptionCard
const cardId = req.params.cardId;
if (!/^[0-9a-f]{8}$/.test(cardId)) {
  return res.status(400).json({ error: 'Invalid cardId format' });
}
// No path resolution needed — cardId is not used as a file path
// The guard is the regex check above + not logging cardId in error bodies
```

**Error response bodies must not include session state** — return only `{ error: 'Session not found' }` for 404s. Do not include session.assumptionCards[] content in error bodies.

---

## Cross-story schema dependencies

| Dependency | Story | Type | Notes |
|------------|-------|------|-------|
| session.assumptionCards[] entries must exist | iwu.3 | Session state | Handler reads assumptionCards[]; iwu.3 must be merged for real data; unit tests mock session state directly |
| Card DOM with data-card-id must exist | iwu.3 | DOM data | Client-side handler reads data-card-id; unit test mocks DOM |
| #assumption-cards section must exist | iwu.2 | DOM structure | Unit tests mock; E2E requires iwu.2 merged |
| nudge bar auto-dismiss triggered by last-card confirmed | iwu.5 | State | This story updates confirmed count; iwu.5 observes it |

---

## AC verification summary

| AC | Automated | Manual | Gap |
|----|-----------|--------|-----|
| AC1 | ✅ 2 unit | — | — |
| AC2 | ✅ 2 unit (confirm + flag round-trip; non-terminal re-flag) | — | — |
| AC3 | ✅ 1 unit (ADR-019 TTL 404) | — | — |
| AC4 | ✅ 1 unit (cardId not found 404) | — | — |
| AC5 | ✅ 2 unit (path traversal 400 + no session state in body) | — | — |
| AC6 | ✅ 2 unit (invalid cardId format: too short, non-hex, path segment) | — | — |
| AC7 | ✅ 1 unit (client-side transient error on non-2xx) | — | — |
| NFR-SEC | ✅ 2 unit (path traversal guard, no session state in error body) | — | — |
| NFR-A11Y | ✅ 1 integration (axe-core) | ✅ Manual | AT announcement — acknowledged |
