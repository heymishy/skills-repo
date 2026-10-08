# Journey list page: index of all journeys for the tenant — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every unit test in the test plan pass (8 tests covering all 5 ACs).
**Branch:** `feature/cj-ep4-s1` (disambiguated — `feature/ep4-s1` already exists for an unrelated story)
**Worktree:** `.worktrees/cj-ep4-s1`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-ep4-s1-journey-list.js  — 8 unit tests covering AC1-AC5

Modify:
  src/web-ui/routes/journeys.js   — add handleGetCustomerJourneysList + export
  src/web-ui/server.js            — add handleGetCustomerJourneysList to the journeys.js import; one new dispatch entry for GET /customer-journeys
```

---

## Task 1: Journey list query + rendering (AC1, AC2, AC5, stage count, product resolution)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep4-s1-journey-list.js`

- [x] **Step 1: Write the failing tests** — AC1, AC1 (truncation), AC2, AC5, stage count boundaries, product resolution (6 of the 8 planned tests)
- [x] **Step 2: Run tests — failed** (`handleGetCustomerJourneysList is not a function`)
- [x] **Step 3: Implement `handleGetCustomerJourneysList`** — two queries (journeys LEFT JOINed to products, scoped by `tenant_id`; stage counts via a second `GROUP BY` query against `customer_journey_stages`, merged by id), truncation helper, empty-state branch
- [x] **Step 4: Run tests — passed**
- [x] **Step 5: Run full suite — no regressions** (726 files, 0 failed)
- [x] **Step 6: Commit** — bundled into the single implementation commit below

## Task 2: "New journey" modal (AC3, AC4)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep4-s1-journey-list.js`

- [x] **Step 1: Write the failing tests** — AC3 (modal fields), AC4 (shape: redirect-aware submit)
- [x] **Step 2: Run tests — failed**
- [x] **Step 3: Implement the modal** — reuses `products.js`'s `ep4s1-pods-modal` dialog/focus-restore pattern; product picker embedded from the existing tenant-scoped products query; submit handler checks `response.redirected` before any `.json()` call, since `POST /journeys`'s real success response is a 302 that `fetch()` auto-follows
- [x] **Step 4: Run tests — passed** (8/8)
- [x] **Step 5: Run full suite — no regressions** (726 files, 0 failed)
- [x] **Step 6: Commit** — `5fa48df6`

## Task 3: Wire the new route in server.js

**Files:**
- Modify: `src/web-ui/server.js`

- [x] **Step 1–2:** No dedicated unit test for pure dispatch wiring (matching every prior story's own precedent)
- [x] **Step 3: Implement** — `GET /customer-journeys` dispatch entry, `authGuard` only (read-only, no `requireNonViewer`), placed before the existing `POST /journeys` block
- [x] **Step 4–5:** Full suite green
- [x] **Step 6: Commit** — bundled with Tasks 1–2's commit (`5fa48df6`)

---

## After all tasks

Run `/verify-completion` — full suite + walk through `artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep4-s1-verification.md`. No live browser render check gap expected — this story has no CSS-layout-dependent behaviour (confirmed in the test plan's own Step 3a analysis), so a real Chrome check post-merge should be straightforward, same as every other list/form page in this feature.
