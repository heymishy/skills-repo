# Contract Proposal: Feature picker: read pipeline-state.json and render feature list in modal (ep2-s1)

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s1.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s1-test-plan.md
**Date:** 2026-10-09

---

## What will be built

- **One new "Map feature" button per stage card** in `handleGetJourneyCanvas` (`src/web-ui/routes/journeys.js`), alongside the existing "Edit stage" affordance and `ep1-s4`'s reorder controls (`sw-stage-card` markup).
- **A feature-picker modal**, embedded in the canvas page markup, rendered server-side at page-load time from a fresh read of `pipeline-state.json`: `_repoRootAdapter.getRepoRoot(req)` (new import, existing adapter — `src/web-ui/adapters/repo-root.js`, already used by `products.js`) → `path.join(repoRoot, '.github', 'pipeline-state.json')` → `fs.readFileSync` wrapped in try/catch.
- **Explicit success/failure distinction**, deliberately diverging from `products.js`'s own existing silent `{ features: [] }` fallback convention: a read/parse failure sets a distinct error flag carried into the rendered modal, rather than being indistinguishable from "zero features really exist."
- **Client-side filter**, reusing `products.js`'s GitHub repo-picker's own filterable-listbox pattern exactly (`role="listbox"`, `oninput` filter handler, per-item `data-*` attributes, an empty-state paragraph).
- **Close/Escape handling** is a pure client-side visibility toggle — no fetch, no POST, nothing persisted.

## What will NOT be built

- Saving a feature-to-stage mapping or metric-key selection (`ep2-s2`'s own scope — no Postgres write exists in this story).
- Delivery view annotation rows (`ep2-s3`'s own scope).
- The GitHub-API-based `pipeline-state-fetch-adapter.js` path (the unrelated multi-repo fleet dashboard feature) — this story reads only the local checkout, per ADR-029 and the story's own explicit constraint.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (feature list with name + slug) | `handleGetJourneyCanvas` called with a mocked pool (`makeCanvasMockPool`) and monkey-patched `fs.readFileSync` returning a 2-feature JSON string; assert both features' name/slug present in rendered HTML | unit |
| AC2 (filter/search input) | Assert a filter `<input oninput=...>` element and per-item `data-slug`/`data-name` attributes exist | unit |
| AC3 (unreadable/unparseable file → explicit error) | Two tests: `fs.readFileSync` monkey-patched to throw (ENOENT-style), and to return invalid JSON; assert the exact error text and that the handler does not throw | unit |
| AC4 (close without selecting → no mapping) | Source-text shape check: no `fetch(`/`POST` string in the modal's close-handling script | unit |

## Assumptions

- The "Map feature" button belongs on stage cards only for this story — `ep2-s3`'s own Delivery view entry point does not exist yet, so AC1's "or in the Delivery view" clause has no implementation target in this story.
- The exact error text is `"Features could not be loaded. Check that pipeline-state.json exists."` (quoted verbatim in the story's own AC3).
- The modal's "zero features" empty state and AC3's "read failed" error state must render visibly different text, so an operator can never mistake one for the other.

## Estimated touch points

**Files:** `src/web-ui/routes/journeys.js`, `tests/check-ep2-s1-feature-picker.js` (new)
**Services:** None external.
**APIs:** None new — purely a local filesystem read, no new route.
