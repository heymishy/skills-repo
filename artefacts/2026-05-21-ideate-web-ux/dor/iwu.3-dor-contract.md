# DoR Scope Contract: iwu.3 — Stream assumption cards from SSE marker events

**Story:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.3.md
**DoR:** artefacts/2026-05-21-ideate-web-ux/dor/iwu.3-dor.md
**Date:** 2026-06-04

---

## Required file touchpoints

### Files to READ before implementing (mandatory context)

| File | Reason |
|------|--------|
| `src/web-ui/routes/skills.js` | Contains `handlePostTurnStreamHtml` — the SSE stream handler to be extended; read in full including the SSE event loop pattern |
| `src/web-ui/utils/html-shell.js` | Contains `escHtml` — required for card text escaping |
| `src/web-ui/views/chat-view.js` | Session shell HTML — understand the #assumption-cards section structure (added by iwu.2) |
| `.github/architecture-guardrails.md` | Mandatory pre-implementation read |
| `artefacts/2026-05-21-ideate-web-ux/stories/iwu.3.md` | ACs, ADR-018 marker protocol, cardId derivation spec |
| `artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.3-test-plan.md` | Test specification |

### Files to CREATE

| File | Contents |
|------|----------|
| `tests/check-iwu3-assumption-cards.js` | Governance test — all 14 unit/integration tests from the test plan |

### Files to MODIFY

| File | Change |
|------|--------|
| `src/web-ui/routes/skills.js` | Extend `handlePostTurnStreamHtml`: strip `---ASSUMPTION-JSON: {...}---` markers; parse payload; derive cardId; append card to session.assumptionCards[]; emit assumptionCard SSE event. Feature flag: skip emit when session.assumptionCardsEnabled === false. |
| `src/web-ui/views/chat-view.js` | Add client-side JavaScript handler for assumptionCard SSE event: parse event data, build card HTML with escaped text, data-card-id, type tag label, risk label, confirm/flag buttons, append to #assumption-cards within 500ms |
| `package.json` | Add `node tests/check-iwu3-assumption-cards.js` to the `test` script chain |

### Files that MUST NOT be touched

| File | Reason |
|------|--------|
| `.github/skills/ideate/SKILL.md` | Governed file — iwu.6 scope only |
| Confirm/flag endpoint registration in `src/web-ui/server.js` | iwu.4 scope |
| `src/web-ui/routes/skills.js` confirm/flag handler logic | iwu.4 scope |
| lensComplete SSE event type | iwu.5 scope |
| `session.assumptionCardsEnabled` default value | iwu.6 scope — must remain false until iwu.6 merges |
| Any file under `artefacts/` | Read-only pipeline artefacts |

---

## Cross-story schema dependencies

| Dependency | Story | Type | Notes |
|------------|-------|------|-------|
| #assumption-cards DOM section must exist | iwu.2 | DOM structure | Unit tests mock this section; E2E tests require iwu.2 to be merged. Document as PR comment if testing E2E before iwu.2 merges. |
| session.assumptionCards[] populated by this story | iwu.4 | Session state | iwu.4 depends on cards being in session state; this story creates the array entry |
| Card DOM (data-card-id) created by this story | iwu.4 | DOM data | iwu.4 confirm/flag reads data-card-id from DOM; this story must write it |

---

## AC verification summary

| AC | Automated | Manual | Gap |
|----|-----------|--------|-----|
| AC1 | ✅ 2 unit + 1 integration | — | — |
| AC2 | ✅ 2 unit (incl. 500ms timing) | — | — |
| AC3 | ✅ 2 unit (feature flag = false) | — | — |
| AC4 | ✅ 2 unit (XSS probe) | — | — |
| AC5 | ✅ 1 unit (unknown type rendered raw) | — | — |
| AC6 | ✅ 2 unit (emission order, unique cardIds) | — | — |
| NFR-SEC | ✅ 1 unit (XSS probe) | — | — |
| NFR-PERF | ✅ 1 unit (500ms timing) | — | — |
| NFR-A11Y | ✅ 1 integration (axe-core) | ✅ Manual | AT announcement — acknowledged |
