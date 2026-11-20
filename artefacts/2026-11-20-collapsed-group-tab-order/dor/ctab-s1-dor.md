## Definition of Ready: Content inside a collapsed product-view group is not reachable by keyboard or screen reader until the group is opened

**Story reference:** artefacts/2026-11-20-collapsed-group-tab-order/stories/ctab-s1-collapsed-group-not-focusable.md
**Test plan reference:** artefacts/2026-11-20-collapsed-group-tab-order/test-plans/ctab-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Track:** short

## Contract Proposal
- `src/web-ui/routes/products.js` (AC1 to AC4, AC6): the two stylesheet strings for `.a4-module-body` and `.a4-module-body--collapsed` only; no markup, script or other page.
- `tests/check-ctab-s1-collapsed-group-not-focusable.js` (T1, T2) and `tests/e2e/ctab-s1-collapsed-group-tab-order.spec.js` (T-E1 to T-E4).
- `decisions.md` and a DoD.
- Not built: no change to which groups start collapsed, to `a4ToggleModule`, to the search or bulk-assign scripts, to any other page, or to any design token.

## Contract Review
Contract review passed. All 7 acceptance criteria map to a named test, an existing check or spec, or the diff check. `products.js` is a required touchpoint and appears in no exclusion list; the files in the exclusion list (other routes, `html-shell.js`, other specs) have no assertions in the new tests.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. `src/` changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | a person using a keyboard or screen reader |
| H2 | At least 3 ACs in Given / When / Then | Pass | 7 ACs |
| H3 | Every AC has a test | Pass | AC7 is a recorded diff check |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC classified (B2) | Pass | the behaviour is focus order, not pixel layout; it is verified by an automated Playwright Tab traversal named in the contract (`tests/e2e/ctab-s1-collapsed-group-tab-order.spec.js`). Visual layout is unchanged by `visibility` and is covered by the existing `a4-module-expand-collapse` height check |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | none added or changed |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no colour, font or spacing token is added or changed; `hasDesignSystemTrack` is not set |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | `visibility: hidden` also hides the content from screen readers while collapsed, which is the intent; a screen-reader user opens the group through its header (a real `button` with `aria-expanded`). The header is not hidden. |
| W2 | Accepted | A group opened by search or bulk assign is opened by removing the same class, so it needs no extra work; the node check `check-pflx-s1` already proves the class removal, and T-E4 proves the rows are then reachable in a real browser. |
| W3 | Accepted | The existing specs `ep2-s1` and `ep2-s2` already click the group header before asserting a row is visible, and `bmau-s1` fails today for an unrelated, unknown reason; none of them is expected to change, and they are run before and after to compare. |
| W4 | Accepted | The collapse animation must look the same. The delay on the `visibility` transition (0.25 s on collapse, none on expand) is what preserves it; `a4-module-expand-collapse` measures the height mid-animation and must still pass. |
| W5 | Accepted | Local runs create real `artefacts/*e2e*` folders; the agent works in a worktree and removes it afterwards, staging exact paths only. |

## Oversight level
**Low** - a stylesheet change with an accessibility purpose and no data or behaviour change. The operator reviews the pull request and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-20-collapsed-group-tab-order/stories/ctab-s1-collapsed-group-not-focusable.md
Test plan: artefacts/2026-11-20-collapsed-group-tab-order/test-plans/ctab-s1-test-plan.md
Goal: write the node check and the E2E spec first and confirm T1, T2 and T-E1 (and T-E3's last assertion) fail; then change the two stylesheet rules in products.js so a collapsed body is visibility:hidden with a delayed transition and an expanded body is visible with no delay; run the new tests, the two node checks and the five group specs; open a draft PR.
Constraints:
- Touch only the two stylesheet strings in src/web-ui/routes/products.js, the new check, the new spec, and artefacts.
- Do not change markup, a4ToggleModule, the search or bulk-assign scripts, any other page, or any design token.
- Preserve each file's existing line endings.
- Local runs happen in the worktree; snapshot or remove only what the run created, by exact path; never git add a directory in the main checkout.
- Check the absolute path contains .worktrees/ctab-s1/ before every edit.
```
