## Test Plan: Navigation and entry points: "Journeys" nav link and product page link

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s2.md
**Epic reference:** navigation-entry-points-and-journey-list
**Test plan author:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

---

**Real architecture grounding (confirmed by direct code read, 2026-10-09):**

- **Nav link (AC1):** `html-shell.js`'s `NAV_ITEMS` array drives every page's sidebar (`renderSidebar` → `_renderNavLink`, shared by `renderShell`/`renderShellWithNav` — every route already goes through this). A real `pan-s1` decision (`artefacts/2026-07-30-product-aware-navigation/decisions.md`) **deliberately removed** an old `'journey'` NAV_ITEMS row — but that was the *old*, product-duplicate skill-session journeys concept ("Journeys duplicated each product's own List/Board view"). `customer_journeys` is a different, genuinely tenant-wide concept (a journey can have `product_id: null` — confirmed by `ep1-s1`'s own schema and `ep4-s1`'s own "No product" fallback), matching the exact precedent already set twice post-`pan-s1` for `'pod-manager'` and `'signals'` (both tenant-wide, both added as flat `NAV_ITEMS` rows with their own "shipped with no nav entry" comments). Adding a `'journeys'` entry here is consistent with that established pattern, not a reversion of `pan-s1`'s own redesign — not logged as a new `decisions.md` entry since it is applying, not overriding, existing precedent.
- **AC4 (keyboard reachability) is satisfied by construction**, not by new work: `_renderNavLink` already renders a real `<a href="...">` element for every `NAV_ITEMS` entry — natively focusable and activatable, no custom JS control. One confirming test asserts the real anchor tag exists; no new keyboard-handling code is written.
- **Product-page link (AC2/AC3):** `handleGetProductView`/`_renderProductView` in `products.js` is the real product detail page. `_renderProductView` already has 17 positional parameters, and **18 existing test files call it directly with positional arguments** (`check-a1-modules-taxonomy-crud.js`, `check-a4-module-grouped-rendering.js`, and 16 others — confirmed by grep). The new parameter (`firstJourneyId`, nullable) **must be appended at the very end** of the signature — inserting it anywhere else would silently shift every one of those 18 calls' positional arguments onto the wrong parameters, a class of defect none of those tests would catch locally since JS doesn't enforce arity. `handleGetProductView` gains one new query: `SELECT id FROM customer_journeys WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1`, result passed through as the new trailing argument.
- **"View journey" link placement:** rendered in the same header button row as the existing "Kanban"/"Roadmap"/"Standards" links (`_renderProductView`, confirmed exact insertion point by direct code read), only when `firstJourneyId` is truthy — matching AC3's "no broken link, no empty placeholder" requirement exactly (the whole `<a>` is conditionally omitted, not rendered disabled/greyed).
- **Icon convention:** every existing `NAV_ITEMS` entry (`▦`, `⬡`, `◎`, `⚙`, `◈`, `◧`) uses a single unicode glyph character in the `icon` field, not an SVG — this predates `DESIGN.md`'s own icon-spec rule (the same situation as `kanban-view.js`'s older `&uarr;`/`&darr;` entities). Matching this array's own existing, consistent convention for the one new sibling entry, rather than retrofitting SVG into a single array where every other row is a plain character.

---

**E2E/browser-layout detection (Step 3a):** No AC matches any CSS-layout-dependent trigger pattern (no drag-and-drop, no pointer coordinates, no `getBoundingClientRect`). AC4's keyboard-reachability claim rests on the element being a real `<a href>` (a DOM-structural fact, verifiable without a rendered browser), not on any CSS-dependent focus-order/visibility behaviour. No E2E spec required, no RISK-ACCEPT needed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | "Journeys" nav link renders on every page, targets `/customer-journeys` | 1 test | — | — | — | — | 🟢 |
| AC2 | "View journey" link renders for a product with ≥1 associated journey, targeting the earliest (`created_at` ASC) | 1 test | — | — | — | — | 🟢 |
| AC2 (ordering) | With 2+ journeys for the same product, the link targets the EARLIEST one, not the latest or an arbitrary one | 1 test | — | — | — | — | 🟢 |
| AC3 | No "View journey" link (and no broken/empty placeholder) when a product has zero associated journeys | 1 test | — | — | — | — | 🟢 |
| AC4 | The "Journeys" nav link is a real, keyboard-focusable `<a href>`, not a JS-only control | 1 test | — | — | — | — | 🟢 |
| (wiring shape) | `handleGetProductView` issues the new `customer_journeys` lookup query and passes its result through to `_renderProductView`'s new trailing parameter | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All ACs are fully unit-testable — the nav link via `html-shell.js`'s own `renderSidebar`/`NAV_ITEMS`, the product-page link via `_renderProductView` called directly with mock data (matching this file's own 18-precedent testing convention), and the query-wiring via a source-text shape assertion on `handleGetProductView` (avoiding the need to mock that handler's many other heavy dependencies — modules adapter, product rollup, repo picker — none of which this story touches).

---

## Test Data Strategy

**Source:** Synthetic — extends `html-shell.js`'s own existing test conventions for `renderSidebar`, and the 18-precedent convention of calling `_renderProductView` directly with mock positional arguments.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | None — `NAV_ITEMS` is a static array | Synthetic | None | Call `renderSidebar` with an arbitrary `active` value (e.g. `'org-kanban'`) to confirm the Journeys link appears on a page that is NOT itself the journeys page |
| AC2 | `_renderProductView` called with a mock `firstJourneyId` (a UUID string) | Synthetic | None | Assert the rendered link's `href` is exactly `/journeys/<that id>` |
| AC2 (ordering) | Two mock journey rows with different `created_at` values | Synthetic | None | Assert the query's own `ORDER BY created_at ASC LIMIT 1` shape (source-text) — the actual row selection is Postgres's job, not re-implemented client-side, so this is a shape check, not a data-sort re-test |
| AC3 | `_renderProductView` called with `firstJourneyId: null` | Synthetic | None | Assert no "View journey" text/link anywhere in the rendered output |
| AC4 | Rendered nav HTML | Synthetic | None | Regex: the Journeys entry's markup is `<a href=...>`, not `<button>`/`<span onclick=...>` |
| (wiring shape) | `handleGetProductView`'s own source text | Synthetic | None | Assert the new query string and that its result is passed as `_renderProductView`'s LAST positional argument |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### "Journeys" nav link renders on every page with the correct target

- **Verifies:** AC1
- **Action:** Call `renderSidebar` (or `renderShell`) with `active: 'org-kanban'` (a different page) and an empty products list
- **Expected result:** The rendered sidebar HTML contains a nav link with `href="/customer-journeys"` and the label "Journeys" — present regardless of which page is active, confirming it's a persistent, not conditional, entry
- **Edge case:** No

### The "Journeys" nav link is a real keyboard-focusable anchor

- **Verifies:** AC4
- **Action:** Extract the Journeys entry's markup from the rendered sidebar HTML
- **Expected result:** The element is a real `<a href="/customer-journeys" ...>` tag — not a `<button onclick>`, `<div>`, or `<span>` with a JS handler
- **Edge case:** No

### "View journey" link renders for a product with an associated journey

- **Verifies:** AC2
- **Action:** Call `_renderProductView` directly (matching this file's own 18-precedent convention) with all existing required args plus the new trailing `firstJourneyId: 'journey-abc'`
- **Expected result:** Rendered HTML contains a "View journey" link with `href="/journeys/journey-abc"`
- **Edge case:** No

### The link targets the earliest journey, not an arbitrary one, when multiple exist

- **Verifies:** AC2 (ordering)
- **Action:** Inspect `handleGetProductView`'s own new query source text
- **Expected result:** The query reads `ORDER BY created_at ASC LIMIT 1` exactly — confirms intent to select the earliest row, not the latest or unordered-first
- **Edge case:** Yes

### No "View journey" link when the product has no associated journeys

- **Verifies:** AC3
- **Action:** Call `_renderProductView` with `firstJourneyId: null`
- **Expected result:** No "View journey" text, no `<a>` targeting `/journeys/`, and no empty/disabled placeholder element in its place
- **Edge case:** Yes

### `handleGetProductView` wires the new query and passes its result through correctly

- **Verifies:** (wiring shape)
- **Action:** Read `handleGetProductView`'s own source text
- **Expected result:** Contains `SELECT id FROM customer_journeys WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1`, and the resolved value is passed as the LAST positional argument to `_renderProductView` (not inserted anywhere else in the 17-existing-argument call, which would silently misalign every other argument)
- **Edge case:** Yes
