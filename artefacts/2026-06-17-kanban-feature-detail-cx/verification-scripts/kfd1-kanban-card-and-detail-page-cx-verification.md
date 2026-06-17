# AC Verification Script: Truncated Kanban card titles, artefact-count indicator, and design-system-styled feature/artefact detail pages

**Story reference:** `artefacts/2026-06-17-kanban-feature-detail-cx/stories/kfd1-kanban-card-and-detail-page-cx.md`
**Technical test plan:** `artefacts/2026-06-17-kanban-feature-detail-cx/test-plans/kfd1-kanban-card-and-detail-page-cx-test-plan.md`
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. In a terminal, run `npm start` from the repo root to start the web UI on `http://localhost:3000` (or whatever port is configured in your `.env`).
2. Open a browser and navigate to `http://localhost:3000`. You should see the login page.
3. Sign in with your GitHub account. You should land on the dashboard or the `/features` route.
4. Make sure you have the branch containing this story's implementation checked out (or the working tree that implements kfd1) — the main branch will still show the old unstyled pages.

**Reset between scenarios:** No state is written by these scenarios; each one is read-only. Simply navigate back to the starting URL between steps.

---

## Scenarios

---

### Scenario 1: Card titles are truncated on the Kanban board

**Covers:** AC1 (title truncation and hover tooltip)

**Steps:**
1. Navigate to `http://localhost:3000/features?view=board`.
2. Find any feature whose name is longer than roughly 48 characters — a good example is "Skills Platform Phase 4 — Opus model evaluation and production-readiness gate" (if present). Look at its card on the board.
3. Check that the title text on the card is shortened — it should end with "…" rather than being cut off mid-word by the card edge.
4. Hover your mouse over the card title.

**Expected outcome:**
> The card shows a shortened version of the title ending with "…" (an ellipsis character, not three dots). When you hover over the title text, a native browser tooltip appears showing the full, uncutted title. No long title overflows the card boundary or wraps to multiple lines.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 2: Feature names use a real em dash (no garbled characters)

**Covers:** AC1 (mojibake data correction)

**Steps:**
1. Navigate to `http://localhost:3000/features?view=board`.
2. Find the cards for these three features:
   - "Skills Platform Phase 4 — Opus model evaluation…"
   - "Skills Platform Phase 3 — …"
   - "Non-Technical Channel — …"
   (Exact card labels may differ; look for the ones that previously showed garbled characters like "ÃƒÂ¢" or "â€".)
3. Read each card's title text carefully.

**Expected outcome:**
> Each of the three feature names displays a proper em dash ("—") where the em dash belongs. No card shows character sequences like "Ã", "â€", "Â", or similar garbled byte fragments. The titles read as normal English text.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 3: Artefact count badge appears on every Kanban card

**Covers:** AC2

**Steps:**
1. Navigate to `http://localhost:3000/features?view=board`.
2. Look at any feature card that is known to have artefacts on disk (e.g. any active feature with a discovery or DoR document).
3. Check for a small badge or indicator below/near the card title that shows a count.
4. Find a feature that is brand new with no artefacts yet (if one exists in the pipeline state).

**Expected outcome:**
> Every card on the board shows an artefact count indicator. Cards with artefacts show "N artefacts" (where N is a number ≥ 1). Cards with no artefacts show "No artefacts yet" rather than simply omitting the badge. The indicator style is visually subordinate to the title (smaller, muted).

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 4: Ideation-stage features appear in the Discovery lane

**Covers:** AC5

**Steps:**
1. Navigate to `http://localhost:3000/features?view=board`.
2. Look at the "Discovery" lane column on the board.
3. Check whether the features "Non-Technical Channel — …" and "Cloud Platform — …" (or their current name equivalents; these had `stage: "ideation"`) appear there.

**Expected outcome:**
> Both ideation-stage features appear as cards in the Discovery column, visible alongside other discovery-stage features. They are not absent from the board entirely.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 5: Feature detail page follows the design system

**Covers:** AC3

**Steps:**
1. Navigate to `http://localhost:3000/features?view=board`.
2. Click on any feature card that has at least two artefacts (e.g. a feature with a discovery doc and a DoR).
3. You should be taken to `/features/<slug>`.
4. Look at the artefact list on the page.

**Expected outcome:**
> The page uses the same sidebar, topbar, colour scheme, and typography as the rest of the web UI (not a visually different or unstyled page). The artefact list is grouped by stage (e.g. a "Discovery" section and a "Ready Check" section), each displayed as a visually distinct card with a small uppercase section heading. The items inside each group are styled consistently (not a raw bullet list). Dates and file links are readable.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 6: Single artefact page is wrapped in the design system and renders markdown properly

**Covers:** AC4

**Steps:**
1. From the feature detail page (reached in Scenario 5), click on one of the artefact links (e.g. "Discovery" or "Ready Check").
2. You should be taken to `/artefact/<slug>/<type>`.
3. Read the page.

**Expected outcome:**
> The page has the same sidebar navigation and topbar as every other page in the web UI — it is NOT a blank white page with unstyled browser-default text. The document body uses a serif font for body text. Headings are large and clearly distinguished. Paragraphs have comfortable line spacing. If the artefact contains a code block, it appears in a monospace font on a light background. If the artefact contains a table, it is readable (not overlapping text). There is a small metadata bar near the top of the document (if the artefact has YAML front-matter) showing status/date information.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 7: Not-found artefact page still uses the design system

**Covers:** AC4 (404 path)

**Steps:**
1. In the browser address bar, type a URL for an artefact that does not exist: `http://localhost:3000/artefact/does-not-exist/discovery`.
2. Press Enter.

**Expected outcome:**
> The page shows an "Artefact not found" message. The page is NOT a blank browser-error page — it still has the sidebar, topbar, and colour scheme of the rest of the web UI. The status code returned is 404 (you can verify this in the Network tab of browser DevTools if desired, but it is not required).

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Edge case: Very long feature titles stay within their card bounds

**Covers:** AC1 (overflow guard)

**Steps:**
1. Navigate to `http://localhost:3000/features?view=board`.
2. Look at every card across all lanes.

**Expected outcome:**
> No card title overflows the card's visible boundary, appears to clip text without ellipsis, or causes the card height to expand noticeably beyond the other cards. All titles fit neatly within their cards.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Edge case: Board loads within an acceptable time with all features visible

**Covers:** NFR — Performance

**Steps:**
1. Hard-refresh the board page: navigate to `http://localhost:3000/features?view=board` with an empty browser cache (Ctrl+Shift+R or equivalent).
2. Note roughly how long the page takes to show content.

**Expected outcome:**
> The board appears within a few seconds. There is no noticeably longer load compared to the board before this story's changes. The full list of active features (typically ~20-25) is visible without an error or timeout.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Card titles truncated with tooltip | | |
| Scenario 2 — Em dash, no garbled characters | | |
| Scenario 3 — Artefact count badge on cards | | |
| Scenario 4 — Ideation features in Discovery lane | | |
| Scenario 5 — Feature detail page design system | | |
| Scenario 6 — Artefact page design system + markdown | | |
| Scenario 7 — 404 path still uses shell | | |
| Edge case — No card overflow | | |
| Edge case — Board load time acceptable | | |

**Overall verdict:** [ ] All pass — ready to proceed  
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
