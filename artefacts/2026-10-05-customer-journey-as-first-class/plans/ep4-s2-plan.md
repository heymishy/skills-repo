# Navigation and entry points: "Journeys" nav link and product page link — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every unit test in the test plan pass (6 tests covering all 4 ACs).
**Branch:** `feature/ep4-s2`
**Worktree:** `.worktrees/ep4-s2`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-ep4-s2-nav-and-product-link.js  — 6 unit tests covering AC1-AC4

Modify:
  src/web-ui/utils/html-shell.js           — add ONE new NAV_ITEMS entry
  src/web-ui/routes/products.js            — handleGetProductView gets one new query; _renderProductView gets one new trailing parameter + header link
  tests/check-pan-s1-product-aware-navigation.js  — correct U6.1 (no longer a false regression)
  tests/check-wuce18-html-shell.js         — correct T3.1 (no longer a false regression)
```

---

## Task 1: "Journeys" nav link (AC1, AC4)

**Files:**
- Modify: `src/web-ui/utils/html-shell.js`
- Test: `tests/check-ep4-s2-nav-and-product-link.js`

- [x] **Step 1: Write the failing tests** — AC1 (NAV_ITEMS entry + renders on an unrelated page), AC4 (real `<a href>`)
- [x] **Step 2: Run tests — failed** (`expected a NAV_ITEMS entry with id "journeys"`)
- [x] **Step 3: Implement** — one new `NAV_ITEMS` row (`id: 'journeys'`, `label: 'Journeys'`, `href: '/customer-journeys'`, main section, single-glyph icon matching sibling entries)
- [x] **Step 4: Run tests — passed**
- [x] **Step 5: Run full suite — 3 pre-existing regressions found** (see Task 3)
- [x] **Step 6: Commit** — bundled into the single implementation commit below

## Task 2: "View journey" product-page link (AC2, AC3)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-ep4-s2-nav-and-product-link.js`

- [x] **Step 1: Write the failing tests** — AC2 (link present + correct href), AC2 ordering (shape), AC3 (no link when absent), wiring shape
- [x] **Step 2: Run tests — failed**
- [x] **Step 3: Implement** — `handleGetProductView` gets one new query (`SELECT id FROM customer_journeys WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1`, tenant-safe by construction since `product_id`'s own tenant ownership is already verified earlier in the same handler); `_renderProductView` gets one new trailing parameter `firstJourneyId` (appended LAST — 18 existing test files call it positionally), rendering a "View journey" link in the existing header button row when truthy, nothing when falsy
- [x] **Step 4: Run tests — passed** (6/6)
- [x] **Step 5: Run full suite — no NEW regressions from this task specifically** (same 3 pre-existing failures as Task 1, all from the nav-link change)
- [x] **Step 6: Commit** — bundled below

## Task 3: Correct two pan-s1-era regression tests (unplanned, discovered at full-suite run)

**Files:**
- Modify: `tests/check-pan-s1-product-aware-navigation.js`
- Modify: `tests/check-wuce18-html-shell.js`

- [x] **Step 1: Diagnose** — `npm test` surfaced 3 failures: `check-pan-s1-product-aware-navigation.js` (`U6.1`), `check-wuce18-html-shell.js` (`T3.1`), and `check-jrf-s1-new-feature-redirect.js` (`IT6`, a downstream meta-check that only failed because `check-pan-s1` did). Both `U6.1` and `T3.1` asserted the literal text `>Journeys<` would never reappear — a guard written specifically for `pan-s1`'s own 2026-07-30 removal of the *old*, product-duplicate skill-session journeys concept, not a permanent ban on the label.
- [x] **Step 2: Correct, not bypass** — `T3.1` now asserts the Journeys link is present AND targets `/customer-journeys`; `U6.1` now checks only `"Run a Skill"`'s continued absence (still fully valid, unrelated to this story), dropping its own now-incorrect `"Journeys"` half. See `decisions.md` D9 for the full rationale.
- [x] **Step 3: Run full suite — clean** (727 files, 0 failed, all 3 prior failures resolved, no new ones)
- [x] **Step 4: Commit** — bundled into the single implementation commit (`1d7b6a11`)

---

## After all tasks

Run `/verify-completion` — full suite + walk through `artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep4-s2-verification.md`. No live browser render check gap expected — a nav link and a product-page link are both low-risk, easily real-browser-checkable either locally (matching `ep4-s1`'s own precedent) or post-deploy on staging.
