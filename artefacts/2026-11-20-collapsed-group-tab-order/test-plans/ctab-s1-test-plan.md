## Test Plan: Content inside a collapsed product-view group is not reachable by keyboard or screen reader until the group is opened

**Story reference:** artefacts/2026-11-20-collapsed-group-tab-order/stories/ctab-s1-collapsed-group-not-focusable.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Test runner (read from package.json and playwright.config.js):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New check: `tests/check-ctab-s1-collapsed-group-not-focusable.js`, plain Node, rendering the page with `productsRoute._renderProductView` exactly as `check-pdt-s1-consolidate-epic-list.js` does. New E2E spec: `tests/e2e/ctab-s1-collapsed-group-tab-order.spec.js`, Playwright, outside the `npm test` chain (ADR-018), run with `NODE_ENV=test`, `E2E_LOCAL_SUITE=true` and `npx playwright test <file>`; it builds its product and feature with the same helpers `frsr-s1` uses (`withAuth`, `connectRepoToProduct`, `getCsrfToken`).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | No Tab stop inside a collapsed group | - | - | 1 (T-E1) | - | - | 🟢 |
| AC2 | Header + Enter opens the group; next Tab is inside it | - | - | 1 (T-E2) | - | - | 🟢 |
| AC3 | Activating the header again takes the content out of the tab order | - | - | 1 (T-E3) | - | - | 🟢 |
| AC4 | Emitted CSS: hidden with a delayed transition when collapsed; visible, no delay, when not | 1 (T1, T2) | - | - | - | - | 🟢 |
| AC5 | Existing group checks and specs pass unchanged | 2 (existing) | - | 4 (existing) | - | - | 🟢 |
| AC6 | A search-opened group's rows are reachable by Tab | - | - | 1 (T-E4) | - | - | 🟡 |
| AC7 | Changed files are as stated | - | - | - | 1 (M1) | Diff check | 🟢 |

AC6 is yellow because it exercises the search auto-expand script in a real browser; if the search box needs setup the spec cannot do cheaply, the existing jsdom check `check-pflx-s1` already proves the class is removed (that is the whole mechanism), and the E2E step is dropped with a note in the DoD rather than faked.

## Red-first plan

T1 and T2 fail before the change (the emitted rule for a collapsed group has no `visibility`). T-E1 fails before the change: the probe found 6 Tab stops inside collapsed groups, and the spec asserts 0. T-E2 and T-E3 pass before and after for the header and the opening; their final assertions (the content is out of the tab order when collapsed again) fail before. Each is run before the change, and the failing result is recorded in the pull request.

## Tests

- **T1 (AC4, node):** render the product view with one group; extract the stylesheet; assert the rule for `.a4-module-body--collapsed` contains `visibility: hidden` and a transition that delays `visibility` by 0.25 s.
- **T2 (AC4, node):** the base `.a4-module-body` rule does not hide the body and its visibility transition has no delay (so expanding shows at once). If jsdom resolves the cascade for `visibility`, assert the computed value is `hidden` on a collapsed body and `visible` after removing the class; otherwise the check stays on the emitted rules.
- **T-E1 (AC1):** create a product with one feature (groups start collapsed). Click an empty area, then press Tab up to 120 times, and for each stop record whether the focused element is inside `.a4-module-body--collapsed`. Assert the count is 0 and that more than 10 stops were seen (so the traversal really ran).
- **T-E2 (AC2):** focus the group header, press Enter, assert `aria-expanded="true"`, press Tab, assert the focused element is inside that group's body (the row link, `a.pvc-item-link`).
- **T-E3 (AC3):** from T-E2's state, focus the header and press Enter again, assert `aria-expanded="false"`, then repeat the Tab traversal from the header and assert no stop is inside the group.
- **T-E4 (AC6):** use the product page's search box with the feature's name so the group opens, then Tab and assert a stop inside the group.

## Manual steps

- **M1 (AC7):** `git diff --stat master...HEAD` lists only `src/web-ui/routes/products.js`, the new check, the new spec, one entry in `tests/e2e/capability-matrix.json`, and artefacts; the `src/` diff touches only the two stylesheet strings.
- **Local run:** the new spec, `a4-module-expand-collapse`, `frsr-s1`, `ep2-s1` and `ep2-s2` together, in a worktree with a copy of `sessions-store/` as before, so the product view has realistic data; delete the copy with the worktree.
- **Screen reader (not automated):** an accessibility-tree snapshot (`page.accessibility.snapshot` or `locator.ariaSnapshot`) of the collapsed page shows the header but not the rows; recorded as a one-line check in the DoD if it works cheaply.

## Deliberate updates to existing tests

None expected. The existing specs already open a group before touching its rows.
