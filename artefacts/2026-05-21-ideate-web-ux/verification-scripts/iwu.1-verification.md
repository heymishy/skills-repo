# AC Verification Script: Render context manifest panel with chip layout

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.1.md
**Technical test plan:** artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.1-test-plan.md
**Script version:** 1
**Verified by:** __________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the web UI server: open a terminal in the repo root and run `node --env-file=.env src/web-ui/server.js`
2. Open a browser and navigate to the `/ideate` skill session page (e.g. `http://localhost:3000/skills/ideate/sessions/new` or equivalent)
3. Open browser DevTools (F12) and keep the Elements panel available
4. Ensure the repo has at least two context files present (e.g. `product/mission.md`, `product/tech-stack.md`)

**Reset between scenarios:** Reload the page to start a fresh session for each scenario.

---

## Scenarios

---

### Scenario 1: Context manifest panel appears with chips for loaded files

**Covers:** AC1

**Steps:**
1. Start a new `/ideate` session with context files loaded (default configuration)
2. When the session shell renders, look at the left panel
3. In the DevTools Elements panel, search for `id="context-manifest"`

**Expected outcome:**
> A section with `id="context-manifest"` is present in the DOM. Inside it, there is at least one chip element for each loaded context file.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Loaded file chips show filename and a "loaded" indicator

**Covers:** AC2

**Steps:**
1. Start a new `/ideate` session with `product/mission.md` in the context
2. In the rendered session page, find the `#context-manifest` panel
3. Locate the chip for `mission.md`
4. Read the chip's visible text and inspect any icon or label

**Expected outcome:**
> The chip displays the text "mission.md" (filename only — not the full path). The chip also shows a visual indicator beyond the background colour that communicates "loaded" — for example, a tick icon (✓) or the label "loaded". Removing the chip's colour class (e.g. `chip-ok`) would still leave a textual or icon discriminator on screen.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Missing context file chips show filename and a "missing" indicator

**Covers:** AC3

**Steps:**
1. Configure a session so that a context file is expected but not found (e.g. rename or remove `product/constraints.md` temporarily)
2. Start a new `/ideate` session
3. Find the `#context-manifest` panel and locate the chip for the missing file

**Expected outcome:**
> The chip displays the filename (e.g. "constraints.md") and a visual indicator beyond the background colour that communicates "missing" — for example, a warning icon (⚠) or the label "missing". The chip is visually distinct from loaded chips even if colour is disregarded.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Empty context shows placeholder message

**Covers:** AC4

**Steps:**
1. Configure a session with no context files loaded (empty context list)
2. Start a new `/ideate` session
3. Find the `#context-manifest` section in the DOM

**Expected outcome:**
> The `#context-manifest` section is visible on the page and contains a message such as "no context loaded". The section is not empty, hidden, or collapsed — it is present in the layout with visible placeholder text.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Keyboard navigation reaches all chips and announces state 🟡 Manual

**Covers:** AC5

**Steps:**
1. Start a session with 2–3 loaded context files and at least one missing file
2. Position keyboard focus before the `#context-manifest` panel (e.g. click the page header then Tab forward)
3. Press Tab repeatedly until you reach the first chip in `#context-manifest`
4. Continue pressing Tab to reach each subsequent chip
5. If a screen reader is available, note what is announced when each chip receives focus

**Expected outcome:**
> Every chip in `#context-manifest` receives keyboard focus in order without being skipped. For each chip, either: (a) the screen reader announces the filename and its state ("loaded" or "missing"), or (b) the chip's `aria-label` or visible label would allow a screen reader to make that announcement. No chips are unreachable by Tab key alone.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Crafted file path does not inject HTML (XSS guard)

**Covers:** NFR-SEC

**Steps:**
1. If the application accepts a context path via URL or configuration, craft a path containing `<script>alert("xss")</script>`
2. Start a session with this path in the context list
3. Observe whether an alert dialog appears and inspect the rendered chip text in DevTools

**Expected outcome:**
> No alert dialog appears. In the DevTools Elements panel, the chip text shows the literal characters `<script>alert("xss")</script>` rendered as text — the angle brackets are escaped to `&lt;` and `&gt;` and no `<script>` tag exists inside the chip element.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
