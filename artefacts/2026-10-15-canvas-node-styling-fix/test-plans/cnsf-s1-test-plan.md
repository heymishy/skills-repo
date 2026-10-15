## Test Plan: Override drawflow's vendor-default node/port/connector colours with the app's own design tokens

**Story reference:** artefacts/2026-10-15-canvas-node-styling-fix/stories/cnsf-s1-canvas-node-token-styling.md
**Review reference:** artefacts/2026-10-15-canvas-node-styling-fix/review/cnsf-s1-review-1.md (PASS, run 1)
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-10-15
**Test runner:** `node scripts/run-all-tests.js`

---

## Note on E2E detection (Step 3a)

No AC describes drag-and-drop, pointer coordinates, scroll behaviour, or on-screen position — every AC is a colour/border/stroke VALUE check (AC1–AC5) or an explicit classification note confirming layout-dependence does not apply (AC6). Per CLAUDE.md's B2 rule, this is not CSS-layout-dependent — no E2E test or RISK-ACCEPT is required.

## Note on verification approach for computed colour values

This repo's own established pattern for "does the rendered CSS actually resolve to the right value" (`check-jcx-hotfix3-cx-grid-visibility.js`, `check-jcx-s7-panel-feedback-and-polish.js`, and others) constructs a `JSDOM` instance from `handleGetJourneyCanvas`'s own rendered `bodyContent` and asserts via `getComputedStyle`. Two refinements for this story specifically:

1. **Selector/value text assertions** (string-level, no jsdom needed) confirm the exact override rule — selector and `var(--token)` declarations — is present, byte-identical to what Task 1 will add.
2. **One jsdom cascade-specificity proof** confirms the override actually WINS against the real vendor rule, not just that both rules happen to exist. This constructs a jsdom document combining (a) the real vendor CSS rule text, copied verbatim from `node_modules/drawflow/dist/drawflow.min.css` (not a simplified stand-in — a faithful specificity proof), (b) this story's own override rule as it will actually render in `bodyContent`, and (c) a minimal inline `:root` block defining `--surface`/`--line`/`--accent`/`--accent-soft` to distinct placeholder hex values (a stand-in for the real tokens defined in `html-shell.js`, which `handleGetJourneyCanvas`'s own output does not include on its own — `html-shell.js` wraps `bodyContent` into the full page at a different layer). `getComputedStyle` is then asserted to resolve to the placeholder values, not the vendor's hard-coded ones — proving the override's specificity is genuinely higher, not merely coincidentally untested.
3. **Dark-mode (AC5)** is verified by a text-level assertion that the override rule contains only `var(--...)` references and no hard-coded hex literal — since both light and dark resolve the SAME token, correctness follows from not having a second, hard-coded value; the token's own per-theme values are out of this story's scope (already defined and already correct in `html-shell.js`).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Node background/colour/border/radius override rule present | 1 test | 1 test (cascade-specificity proof) | — | — | — | 🟢 |
| AC2 | Selected-state override rule present | 1 test | 1 test (cascade-specificity proof) | — | — | — | 🟢 |
| AC3 | Port colour override rule present, input/output identical | 1 test | 1 test (cascade-specificity proof) | — | — | — | 🟢 |
| AC4 | Connector stroke/width override rule present | 1 test | 1 test (cascade-specificity proof) | — | — | — | 🟢 |
| AC5 | No hard-coded hex literal in any override rule (token-only) | 1 test | — | — | — | — | 🟢 |
| AC6 | CSS-layout classification (not applicable, confirmed) | — | — | — | — | — | 🟢 |

---

## Coverage gaps

No gaps. AC6 requires no test of its own — it is a classification note, confirmed correct by AC1–AC5 containing no layout/position/scroll assertion.

---

## Test Data Strategy

**Source:** Synthetic — a single mocked stage rendered via `handleGetJourneyCanvas` (reusing this repo's own established `makeCanvasMockPool`/`withMockedPipelineState` helpers, unchanged); the real vendor CSS rule text is read directly from `node_modules/drawflow/dist/drawflow.min.css` at test time (not hard-coded from memory, so a future `drawflow` version bump that changes the vendor rule is caught rather than silently assumed).
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC4 | One stage, rendered Canvas view HTML; the real vendor CSS file's own node/selected/port/connector rules | `handleGetJourneyCanvas` output + `fs.readFileSync` of the real vendor CSS | None | |
| AC5 | The override rule's own source text | Rendered HTML | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1 (unit): node override rule text present

- **Verifies:** AC1
- **Precondition:** Rendered Canvas view HTML
- **Action:** Search the rendered `<style>` block for the node override rule
- **Expected result:** A rule selecting the drawflow node (scoped to win over the vendor rule) sets `background:var(--surface)`, `color:var(--ink)`, `border:1px solid var(--line)`, `border-radius:8px` — no other property (width/padding/position/display unchanged, out of scope)
- **Edge case:** No

### AC2 (unit): selected-state override rule text present

- **Verifies:** AC2
- **Precondition:** Rendered Canvas view HTML
- **Action:** Search the rendered `<style>` block for the selected-state override rule
- **Expected result:** A rule selecting the drawflow node's own `.selected` state sets `background:var(--accent-soft)` and `border-color:var(--accent)`
- **Edge case:** No

### AC3 (unit): port override rule text present, input and output identical

- **Verifies:** AC3
- **Precondition:** Rendered Canvas view HTML
- **Action:** Search the rendered `<style>` block for the port override rule
- **Expected result:** One rule (or two with identical declarations) covering both `.input` and `.output` sets `background:var(--surface)` and `border:2px solid var(--line)` for both — no separate yellow-input treatment
- **Edge case:** No

### AC4 (unit): connector override rule text present

- **Verifies:** AC4
- **Precondition:** Rendered Canvas view HTML
- **Action:** Search the rendered `<style>` block for the connector override rule
- **Expected result:** A rule selecting `.connection .main-path` sets `stroke:var(--line)` and `stroke-width:2px`
- **Edge case:** No

### AC5 (unit): no hard-coded hex literal in any override rule

- **Verifies:** AC5
- **Precondition:** The 4 override rules' own combined source text
- **Action:** Scan for a `#[0-9a-fA-F]{3,6}` hex-colour pattern within the override rules specifically (not the whole file, which legitimately contains hex values elsewhere for unrelated existing styling)
- **Expected result:** Zero matches — every colour value in the override rules is a `var(--...)` token reference
- **Edge case:** No

---

## Integration Tests

### AC1–AC4 (integration): cascade-specificity proof — the override wins against the real vendor rule

- **Verifies:** AC1, AC2, AC3, AC4 (the "actually wins the cascade" portion, not just "the rule exists")
- **Precondition:** A jsdom document combining: (a) the real vendor CSS rule text read directly from `node_modules/drawflow/dist/drawflow.min.css` via `fs.readFileSync`, (b) this story's own 4 override rules as rendered in `bodyContent`, (c) a minimal inline `:root` block defining `--surface`, `--line`, `--ink`, `--accent`, `--accent-soft` to distinct placeholder hex values, (d) one drawflow node element carrying both the vendor's own class and this story's scoping class/ancestor, one `.selected` node, one `.input`/`.output` pair, and one `.connection .main-path` SVG path
- **Action:** `getComputedStyle` each element
- **Expected result:** Every element resolves to its override's placeholder value (not the vendor's hard-coded `#0ff`/`red`/`#fff`/`#ff0`/`#4682b4`) — proving the override's specificity genuinely beats the real vendor selector, not a simplified stand-in
- **Edge case:** No

---

## Gap table

No gaps.
