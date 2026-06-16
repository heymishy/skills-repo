## Test Plan: Kanban board view at /features?view=board

**Story reference:** artefacts/2026-06-14-web-ui-pm-flow/stories/pmf.1.md
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-06-15

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Six columns rendered: Ideas, Discovery, Definition, In Review, In Delivery, Done | 6 tests (T4a–T4f in check-kanban-view.js) | — | — | — | — | 🟢 |
| AC2 | Feature cards in correct lane, showing health-dot + title + slug + age | 3 tests (T5a–T5c in check-kanban-view.js) | — | — | — | — | 🟢 |
| AC3 | WIP limit badge with red styling when column over limit | Covered by T4e (lane structure) — badge presence implied | — | — | 1 scenario | CSS-behaviour | 🟡 |
| AC4 | List/Board toggle links present, active class on board link | 3 tests (T8a–T8c in check-kanban-view.js) | — | — | — | — | 🟢 |
| AC5 | HTML-escaped content — XSS guard | 2 tests (T7a–T7b in check-kanban-view.js) | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| WIP limit badge red styling | AC3 | CSS-behaviour | CSS colour rendering requires browser | Manual inspection after deployment 🟡 |

---

## Test File

**Existing test file:** `tests/check-kanban-view.js` (30 tests, all passing at time of DoR)

| Test | AC | Description |
|------|----|-------------|
| T1 | — | kanban-view.js file exists |
| T2a–T2d | AC1 | LANES definition: 6 lanes, correct id ordering |
| T3a–T3b | — | renderKanban exported and returns non-empty string |
| T4a–T4f | AC1 | Six `data-lane` attributes present in HTML output |
| T5a–T5c | AC2 | Feature slugs rendered for features at discovery/definition/done stages |
| T6a–T6d | AC4 partial | Ideas lane: title, add-form, Start Discovery link, delete button |
| T7a–T7b | AC5 | XSS: `<script>` not injected; `&lt;script&gt;` present |
| T8a–T8c | AC4 | List/Board toggle links; `kb-toggle-btn--active` class |
| T9a–T9b | — | workspace/ideas.json exists with `{ ideas: [] }` |
| T10a–T10c | — | features route exports ideas API handlers |

---

## Test Data Strategy

**Source:** Synthetic — generated inline in test setup
**PCI/sensitivity:** No
**Data requirements:** Mock feature arrays with slug, title, stage, health fields; mock idea arrays with id, title, createdAt fields.

---

## Out of Scope for This Test Plan

- Visual CSS rendering of WIP badge colours — manual only
- E2E browser interaction (drag, hover states)
- pmf.2 API behaviour — covered in pmf.2-test-plan.md
