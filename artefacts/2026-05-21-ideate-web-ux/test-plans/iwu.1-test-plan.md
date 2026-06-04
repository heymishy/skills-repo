## Test Plan: Render context manifest panel with chip layout in the /ideate session shell

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.1.md
**Epic reference:** artefacts/2026-05-21-ideate-web-ux/epics/iwu-web-session-surface.md
**Test plan author:** Copilot
**Date:** 2026-06-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | #context-manifest in DOM with ≥1 chip per loaded file | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | chip-ok: filename + colour + non-colour discriminator | 2 tests | — | — | — | — | 🟢 |
| AC3 | chip-warn: filename + colour + non-colour discriminator | 2 tests | — | — | — | — | 🟢 |
| AC4 | Empty context: placeholder shown | 1 test | — | — | — | — | 🟢 |
| AC5 | Keyboard-reachable chips; AT announces filename + state | — | — | — | 1 scenario | DOM-behaviour | 🟡 |
| NFR-SEC | XSS: artefact path HTML-escaped | 1 test | — | — | — | — | 🟢 |
| NFR-A11Y | WCAG AA: chip states not colour-only; AT names | — | 1 test | — | 1 scenario | — | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Node.js | Handling |
|-----|----|----------|------------------------------|---------|
| Screen reader announcement of chip filename and state | AC5 | DOM-behaviour | Requires real AT or browser accessibility tree | Manual scenario in verification script 🟡 |
| AT-accessible name delivered to real screen reader | NFR-A11Y | DOM-behaviour | axe-core covers rules; announcement requires real browser | Manual scenario 🟡 |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved
**PCI/sensitivity in scope:** No
**Availability:** Available now — test setup creates mock context file lists
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Array of loaded context file paths (2–3 items) | Synthetic | None | |
| AC2 | Single loaded file path | Synthetic | None | |
| AC3 | Single missing file path | Synthetic | None | |
| AC4 | Empty context file array | Synthetic | None | |
| AC5 | Rendered HTML with chips | Synthetic | None | Manual verification |
| NFR-SEC | File path containing `<script>alert(1)</script>` | Synthetic | None | XSS probe |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### renders #context-manifest with chip elements for each loaded file

- **Verifies:** AC1
- **Precondition:** A context manifest helper (e.g. `buildContextManifestHtml(files)`) is called with an array of two file path strings
- **Action:** Call the helper with `['product/mission.md', 'product/tech-stack.md']`
- **Expected result:** The returned HTML string contains `id="context-manifest"` and two elements with class `chip-ok`
- **Edge case:** No

### #context-manifest section is a named element in the returned HTML

- **Verifies:** AC1
- **Precondition:** Context manifest helper called with one file
- **Action:** Call `buildContextManifestHtml(['product/mission.md'])`
- **Expected result:** HTML includes `id="context-manifest"` exactly once; chip count equals 1
- **Edge case:** No

### chip-ok displays filename (not full path)

- **Verifies:** AC2
- **Precondition:** Helper called with full path `product/mission.md`
- **Action:** Call `buildContextManifestHtml(['product/mission.md'])`
- **Expected result:** The chip text contains `mission.md` and does not contain `product/`
- **Edge case:** No

### chip-ok carries a non-colour discriminator

- **Verifies:** AC2
- **Precondition:** Helper called with one loaded file
- **Action:** Call `buildContextManifestHtml(['product/mission.md'])`
- **Expected result:** The chip-ok element contains either an explicit text label (e.g. "loaded") or an `aria-label` attribute that includes "loaded" — confirmed by HTML string inspection
- **Edge case:** No

### chip-warn displays filename and non-colour discriminator

- **Verifies:** AC3
- **Precondition:** Helper called with one missing file (passed as a warn entry)
- **Action:** Call with `{ path: 'product/constraints.md', status: 'warn' }` or equivalent API
- **Expected result:** The returned HTML contains a `chip-warn` element with `constraints.md` as display text and either a "missing" label or an `aria-label` containing "missing"
- **Edge case:** No

### chip-warn accessible name includes "missing" state

- **Verifies:** AC3
- **Precondition:** Helper called with one missing file
- **Action:** Inspect returned HTML for `chip-warn` element
- **Expected result:** Element has an `aria-label` or visible text that conveys "missing" — not just a colour class
- **Edge case:** No

### renders placeholder when context file list is empty

- **Verifies:** AC4
- **Precondition:** Helper called with empty array `[]`
- **Action:** Call `buildContextManifestHtml([])`
- **Expected result:** Returned HTML contains `id="context-manifest"` and a message like "no context loaded"; no chip elements are present
- **Edge case:** No

### HTML-escapes artefact path display values (XSS guard)

- **Verifies:** NFR-SEC
- **Precondition:** Helper called with a path containing `<script>alert(1)</script>`
- **Action:** Call `buildContextManifestHtml(['<script>alert(1)</script>'])`
- **Expected result:** Returned HTML contains `&lt;script&gt;` — the literal `<script>` tag is not present in the output; `innerHTML` would not execute the payload
- **Edge case:** Yes — XSS probe

---

## Integration Tests

### handleGetChatHtml session shell includes #context-manifest

- **Verifies:** AC1
- **Components involved:** `handleGetChatHtml` route handler, context manifest builder
- **Precondition:** A mock session is initialised with two loaded context files; `handleGetChatHtml` is called (or its output function invoked with mock req/res)
- **Action:** Call the session shell HTML generator with mock session state that includes a context file list
- **Expected result:** The returned HTML string contains `id="context-manifest"` and chip elements corresponding to the loaded files

### axe-core scan on #context-manifest passes WCAG AA rules

- **Verifies:** NFR-A11Y
- **Components involved:** axe-core, rendered HTML string
- **Precondition:** The manifest HTML is rendered with chip-ok and chip-warn elements containing the required non-colour discriminators
- **Action:** Run `axe.run` (or equivalent axe-core Node.js API) on the rendered HTML fragment
- **Expected result:** Zero violations at WCAG AA level; in particular, colour-contrast and name-role-value rules pass

---

## NFR Tests

### chip state is not communicated by colour alone

- **NFR addressed:** Accessibility
- **Measurement method:** Parse the rendered chip HTML — assert that each chip carries a text label or `aria-label` beyond the CSS class name; assert that removing the class name still leaves a textual discriminator
- **Pass threshold:** Both chip-ok and chip-warn have a non-empty accessible name or visible text label
- **Tool:** Node.js string/DOM inspection

---

## Out of Scope for This Test Plan

- Assumption cards panel and card rendering — iwu.3
- Right panel two-section layout — iwu.2
- Real-time manifest update during the session — chips are static at session start
- Screen reader device testing — covered by axe-core and manual scenario in verification script

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Actual screen reader announcement (AC5) | Requires real AT; axe-core validates rules but not real announcement | Manual scenario in verification script; axe NFR test reduces risk |
