# DoR Contract — wfp.16 Workforce chat interface

**Story:** wfp.16
**Feature:** 2026-05-26-bsr-workforce-planner

---

## Required touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/workforce-ui/server.js` | ADD routes + adapter wiring | `GET /workforce-chat`, `POST /api/workforce-chat/turn`, `POST /api/workforce-chat/turn-stream`; wire both adapters to real implementations (D37 Task 2) |
| `src/workforce-ui/routes/workforce-chat.js` (or inline in server.js) | CREATE or ADD | Handler, context assembly, adapter setters, `__getAdapters()` (D37 Task 1) |
| `tests/workforce/check-wfp16-workforce-chat.js` | CREATE | AC verification test file |

---

## Out-of-scope (must not touch)

| File | Reason |
|------|--------|
| `workforce/teams.json` | Read-only data file |
| `workforce/roster.json` | Read-only data file |
| `workforce/initiative-map.json` | Read-only data file — T2 reads it; must not write it |
| `portfolio/*.json` | Read-only data files |
| Any existing route handlers for wfp.12–wfp.15 | Must only ADD nav link (AC10) — no other changes |
| `package.json` runtime dependencies | No new npm runtime deps allowed |

---

## Schema dependencies

`schemaDepends: []` — no upstream pipeline-state schema fields required.

---

## Prerequisite conditions

- wfp.12–wfp.15 all DoD-complete (nav links on all 4 intelligence HTML pages required for AC10).
- Intelligence server (wfp.11) DoD-complete.

---

## D37 adapter requirements (mandatory)

Both adapters must satisfy all three D37 conditions:

| Adapter | Setter | Stub default | Wiring AC | Separate wiring task? |
|---------|--------|--------------|-----------|----------------------|
| `_workforceQueryExecutor` | `setWorkforceQueryExecutorAdapter(fn)` | Throws `"Adapter not wired: workforceQueryExecutor..."` | AC5 (`__getAdapters()` returns non-stub) | ✅ Yes — implementation plan Task 2 |
| `_workforceQueryExecutorStream` | `setWorkforceQueryExecutorStreamAdapter(fn)` | Throws `"Adapter not wired: workforceQueryExecutorStream..."` | AC5 (same `__getAdapters()` check covers both) | ✅ Yes — implementation plan Task 2 |

---

## Canonical field constraint

`req.session.accessToken` is the only permitted field for the GitHub token. Static check required:
```powershell
Select-String -Pattern "req\.session\.token[^A]" src/workforce-ui/server.js
```
Must return zero results before PR can be opened.

---

## CSS-layout-dependent ACs

| AC | Item | Classification |
|----|------|----------------|
| AC1 visual chat layout | Message bubbles, toggle rendering | Manual scenario 1b |
| NFR-COMPAT | 1280px viewport | RISK-ACCEPT in decisions.md + manual scenario 14 |
