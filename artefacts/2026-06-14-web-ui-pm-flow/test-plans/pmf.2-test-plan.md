## Test Plan: Ideas backlog — workspace/ideas.json and /api/ideas CRUD

**Story reference:** artefacts/2026-06-14-web-ui-pm-flow/stories/pmf.2.md
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-06-15

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | POST /api/ideas creates idea in ideas.json; HTTP 201 | check-kanban-view.js T10b (handlePostIdea exported) + direct API test needed | — | — | — | Missing direct API test | 🟡 |
| AC2 | GET /api/ideas returns { ideas: [...] }; HTTP 200 | check-kanban-view.js T10a (handleGetIdeas exported) | — | — | — | Missing direct API test | 🟡 |
| AC3 | DELETE /api/ideas/:id removes idea; HTTP 204 | check-kanban-view.js T10c (handleDeleteIdea exported) | — | — | — | Missing direct API test | 🟡 |
| AC4 | Ideas rendered as cards with title, age, delete, Start Discovery link | T6a–T6d in check-kanban-view.js | — | — | — | — | 🟢 |
| AC5 | Quick-capture form triggers POST on submit | T6b (form rendered) | — | — | 1 scenario | JS-behaviour | 🟡 |
| AC6 | XSS guard on idea title | T7a–T7b in check-kanban-view.js | — | — | — | — | 🟢 |
| AC7 | Empty title returns 400 | Direct handler test needed | — | — | — | Missing test | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Direct CRUD API behaviour (POST/GET/DELETE) | AC1–AC3, AC7 | Missing automated test | check-kanban-view.js tests exports only, not end-to-end CRUD behaviour | **Risk-accept for pmf.2 DoD:** handler logic is straightforward fs.readFileSync/writeFileSync; XSS and export tests provide partial coverage. Full API tests to be added in a pmf.2b follow-on story if CRUD defects are observed. Acknowledged: Hamish King — 2026-06-15. |
| Quick-capture form JS submit behaviour | AC5 | JS-behaviour | Client-side JS cannot be tested in Node.js unit tests | Manual smoke test after deployment |

---

## Test File

**Existing test file:** `tests/check-kanban-view.js` (30 tests)

| Test | AC | Description |
|------|----|-------------|
| T6a–T6d | AC4 | Ideas cards: title, add-form, Start Discovery link, delete button |
| T7a–T7b | AC6 | XSS: script tag not injected via idea title |
| T9a–T9b | — | workspace/ideas.json exists with `{ ideas: [] }` structure |
| T10a–T10c | AC1–AC3 (export only) | handleGetIdeas, handlePostIdea, handleDeleteIdea exported from features.js |

---

## Out of Scope for This Test Plan

- Full integration tests against a running HTTP server — deferred to pmf.2b
- Multi-tab concurrent write behaviour — accepted risk for solo operator
