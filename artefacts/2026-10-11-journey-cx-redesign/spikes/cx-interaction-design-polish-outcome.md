# Spike Outcome: CX interaction/visual design polish — display grid + authoring flow (post jcx-s6 structural fix)

**Opened:** 2026-10-14 | **Scope:** Standard | **Steps taken:** 11 (web search on journey-mapping tool visual-design comparisons — Smaply/UXPressia/Custellence — specifically looking for named "clunky" complaints; web search + direct fetch of eleken.co's timeline-UI-design guidance for typography/spacing/color/density/anti-patterns; web search on Linear's own timeline view and general timeline UI patterns; web search on dashboard/data-grid empty-state design patterns — Carbon/Supabase/Segment/Cloudscape; web search on data-table density specifics — Atlassian 8px spacing scale + row-height tokens, Material Design density presets; live Chrome zoom-screenshot of the current Customer experience tab on `wuce-staging.fly.dev`; direct `getComputedStyle` extraction of real row/label/cell/header/curve values from the live DOM via `javascript_tool`; operator redirect to also research the stage-authoring/editing workflow itself, not just the rendered display; direct read of `src/web-ui/routes/journeys.js`'s own stage-creation and stage-edit-panel code; web search on journey-mapping-tool inline-editing/add-stage workflow conventions — Splice, QuestionPro, Figr; live reproduction, via `javascript_tool`, of the actual "+ Add stage" interaction from the Customer-experience view to confirm a suspected defect)
**Done condition met:** Yes
**Artefact path:** `artefacts/2026-10-11-journey-cx-redesign/spikes/cx-interaction-design-polish-outcome.md`
**Trigger:** Operator, the day after `jcx-s6`/`jcx-hotfix3` shipped the swimlane-grid structural fix: "The overall cx isn't right yet, tbh ui is better.. I want a more deeply thoroughly research spike on cx patterns for how to map customer journeys, from multiple sources and determine how best to implement for our journey mapping experience. Feels very clunky today." First pass covered the rendered grid's own visual polish (Part 1 below). The operator then redirected ("it seems more a practical, user does this, then that sequence of steps... the journey of making a journey") to also cover the step-by-step authoring/editing flow itself — confirmed scope: fold both into this one spike (Part 2 below).

---

## Part 1 — Rendered grid visual polish

### Outcome: REFINE (visual/interaction design quality of the already-correct grid — not a further structural change)

### What was found

`jcx-s6` fixed the real structural gap (swimlane/timeline grid, columns, aligned rows) the prior two spikes identified, and `jcx-hotfix3` closed the one regression it introduced. The grid itself — column layout, row alignment, curve-on-chart stage labels — is confirmed correct and live. The "still clunky" feeling has a different, more specific root cause: **the grid has no visual hierarchy between real content and empty/placeholder content, and its spacing doesn't follow a consistent rhythm.** Both are concrete, fixable, and were directly measured against the live DOM, not guessed at.

1. **Empty-cell placeholder text renders with full-strength body-text color — identical to real data.** Direct `getComputedStyle` extraction: a cell showing "Not set" and a cell showing a real pain-point both render at `color: rgb(20,23,26)` (near-black), `font-size: 13px`. Every empty-state design-system source checked (Carbon, Supabase, Segment, Cloudscape) converges on the same rule: empty-cell content must be visually dulled (muted color and/or reduced weight) relative to real data, precisely so a dense grid doesn't read as uniformly "full" of noise. This is the single most load-bearing finding — it's a one-line CSS fix with an outsized effect on perceived polish, and it directly explains "feels clunky" better than any structural factor, since the structure is already fixed.

2. **A newly created stage defaults to the literal, unstyled text "new" as its own name** — confirmed live via a fresh zoom-screenshot (a 4th stage was added to the test journey since the last check, rendering as lowercase "new" with no placeholder styling, identical treatment to a real stage name). This is the same root defect as finding 1 (default/placeholder content given no visual distinction from real content) showing up one level higher, in the stage header itself rather than just the data rows.

3. **Grid spacing doesn't follow a consistent base unit.** Direct measurement: row padding is `10px 0px`; column-gap between cells is `12px` (confirmed from the inline CSS). Every data-table density source checked (Atlassian's design system, Material Design) is built on an 8px base spacing scale — 8/16/24px multiples throughout. `10px` and `12px` are both off-rhythm: neither is a multiple of 8, and the two values don't even match each other. On their own each is a tiny visual discrepancy; compounded across 5 repeated rows and multiple columns, this is a real contributor to a layout "feeling" slightly off without any single element being obviously wrong — exactly the kind of defect a structural review (checking "does the grid exist, are columns aligned") would never surface, and exactly what the operator's own "clunky" word describes.

4. **Row label font-size (11px) is below the general ~12px sustained-reading floor**, while the row height itself (measured: `48.5px`) is actually already close to Atlassian's own "Regular" 48px density token — so row height is fine, but the label reading comfortably inside it is slightly undersized. Label color (`rgb(63,69,76)`, a muted slate) and weight (700) are already the right treatment for a secondary label — only the size needs a small bump.

5. **The emotion curve reserves a fixed 164px of vertical height regardless of content.** Per the eleken.co guidance on timeline-chart density, a chart's height should scale with what it's actually showing, not reserve a fixed block disproportionate to its information content. Now that `jcx-s6` already put stage names directly on the chart (closing the prior spike's own finding 2), the curve itself is a fairly simple 3-dot line — 164px of height ahead of 5 more data-dense rows below pushes real content further down the page than it needs to be, without adding legibility.

6. **Tool-comparison research directly validates the operator's own word choice.** A fresh search on Smaply/UXPressia/Custellence (the closest commercial comparables to this feature) found UXPressia specifically called "clunky" by reviewers — and the concrete complaints behind that word were consistently about visual density and inconsistent empty/placeholder treatment, not missing structure. This is a strong signal that "clunky" in this exact product category is a visual-polish word, not a structure word — consistent with findings 1-5 and with the operator's own explicit "ui is better" acknowledgment that the structural fix already landed.

### Reasoning

`jcx-s6` closed the gap the first two spikes measured (does a swimlane/timeline grid exist, are stage columns and rows aligned, does the curve carry stage labels) — and live verification confirms it did so correctly. The operator's continued "clunky" read is not inconsistent with that; it's evidence of a different, narrower category of gap that a structural review is not designed to catch: consistency of visual treatment (empty vs. real content) and consistency of spacing rhythm. Both are measurable (confirmed via direct `getComputedStyle` reads above, not inferred) and both have a single well-established fix pattern in design-system literature, independent of which specific journey-mapping competitor is used as the reference.

---

## Part 2 — Authoring/editing flow ("the journey of making a journey")

### Outcome: FIX + REFINE (one confirmed functional defect, plus a genuine interaction-flow gap)

### What was found

The operator's redirect was correct and surfaced something Part 1 could not have found, because Part 1 only examined the already-populated, rendered grid. Reading `journeys.js`'s own stage-creation/edit code directly, then reproducing the actual click flow live, found the authoring experience has a real defect at its very first step, plus a genuine multi-step friction gap matching the "sequence of steps" framing.

1. **CONFIRMED LIVE DEFECT: "+ Add stage" is non-functional from both the Canvas and Customer-experience views — the two views a user actually works from by default.** Mechanism, read directly from the code and reproduced live: clicking "+ Add stage" inserts a new, unsaved stage-name `<input>` into `#sw-journey-stages`, the legacy stage-card list. That container is hidden (`display:none`) in BOTH the Canvas view (the page's own default on load) and the Customer-experience view (`jcx-s6`'s own view, where a user populating CX data is actually working) — it is visible only in the Delivery view. The code then calls `input.focus()`, which silently no-ops on a descendant of a `display:none` ancestor per the HTML spec. Live reproduction via `javascript_tool` confirms both failure modes exactly: `stagesListDisplay` stayed `"none"` after the click, the new input existed in the DOM but was fully invisible, and `document.activeElement` remained the Add-stage button itself, never the new input. **A user on the Customer-experience tab — exactly where the operator and this whole epic are focused — who clicks "+ Add stage" sees nothing happen at all.** No visual feedback, no focus change, no error. This is not a new regression from `jcx-s6`; the underlying `#sw-journey-stages{display:none}` rule for the Canvas view predates it (from `ep2-s3`'s own 3-view toggle), and `jcx-s6` only extended the same already-broken pattern to the Customer-experience view too, following its own established precedent. It has likely been broken, silently, since the 3-view toggle shipped — directly relevant to "feels very clunky," since this is literally the first action in building a journey.

2. **On successful save, the page performs a full `window.location.reload()`** — even once the invisible-input defect above is fixed, saving a new stage's name discards the user's current view (the toggle is pure client-side state, not persisted or round-tripped) and always returns them to the default Canvas view, not wherever they were working. A user adding a 4th stage while reviewing the Customer-experience grid is unconditionally bounced back to Canvas just to see their own new stage.

3. **Populating a stage's actual CX content (the 7 fields the swimlane grid displays) requires leaving the grid entirely for a separate side panel.** The name is set inline (when reachable at all, per finding 1); every other field — description, customer actions, touchpoints, channel, emotion, pain points, opportunities, moment of truth — lives only in a single shared "Edit stage" drawer, opened by a small link, with no visible connection to the specific swimlane row it will populate. Each field also autosaves independently on blur (8 separate requests per stage, no combined submit), with one shared, 1.5-second "Saved" flash for the whole panel rather than per-field confirmation — tabbing quickly through several fields can blur-save field 2 before field 1's own flash has even cleared, with no way to tell which fields actually persisted.

4. **This is consistent with, not contradicted by, how comparable tools structure the same flow.** A fresh search on journey-mapping-tool authoring conventions (Splice, QuestionPro, Figr) converges on a hover-reveal "+" directly at the point of insertion in the map itself, with the name entered in place and no modal/drawer round-trip for the primary create action — the opposite of both defects above (hidden-list insertion point, full-page reload, separate-panel-for-everything-else). This is a genuine, multi-source-grounded interaction-design gap, not a matter of taste.

### Reasoning

The operator's own framing — "user does this, then that, sequence of steps... the journey of making a journey" — pointed at exactly the right layer. Part 1's findings (empty-state color, spacing rhythm) are real but can only make an already-functioning grid look more polished. Finding 1 here is different in kind: it is a confirmed, reproduced functional defect in the very first step of the authoring sequence, from the two views a user is actually meant to use, not a cosmetic issue. It plausibly accounts for a meaningful share of "feels very clunky" on its own, independent of anything Part 1 found.

---

## Combined recommendations (both parts)

**What needs to change:** Findings 1 of Part 2 is a functional bug fix (restore "+ Add stage" to work from whichever view the user is on, not only Delivery). Finding 2 of Part 2 (reload resets view) and finding 3 (panel-based multi-field authoring) are interaction-flow improvements. Part 1's 5 findings are CSS-only polish. None require a data model change, a new route, or a new chart dependency; none touch `jcx-s6`'s own grid structure.

**Suggested direction, prioritized:**

- **P0 — BUG FIX — make "+ Add stage" actually work from the Canvas and Customer-experience views.** Smallest correct fix: stop appending the new-stage input into the legacy `#sw-journey-stages` list; insert it as its own small inline affordance that's visible in whichever view is currently active (e.g., a lightweight "+ Add stage" row appended directly to the swimlane grid's own column area in the CX view, and to the drawflow canvas in the Canvas view), so `input.focus()` succeeds and the user sees what they're typing. Given this is a confirmed, reproduced functional defect (not a preference), recommend treating it with the same urgency as `jcx-hotfix2`/`jcx-hotfix3` rather than bundling it behind a lower-priority polish story.
- **P0 — Give empty/placeholder content (both field values and stage names) a distinct, muted visual treatment.** (Part 1, finding 1/2.) Empty cell values and a default/unnamed stage header both move from full-strength `rgb(20,23,26)` to the muted slate already used for row labels (`rgb(63,69,76)`) and/or an em dash (`—`) in place of "Not set," per Carbon/Cloudscape convention.
- **P1 — Stop resetting the view on stage-add.** Once finding 1 is fixed, drop the `window.location.reload()` in favor of an in-place DOM append (the pattern the name-input code already uses for the optimistic insert, just without discarding it afterward) so the active view persists.
- **P1 — Normalize grid spacing to an 8px rhythm.** (Part 1, finding 3.) Row padding `10px 0px` → `8px 0px`; column-gap `12px` → `8px`/`16px`.
- **P2 — Bump row-label font-size from 11px to 12px.** (Part 1, finding 4.)
- **P2 — Reduce the emotion curve's fixed height from 164px to ~100-120px.** (Part 1, finding 5.)
- **P2 — Consider per-field save confirmation in the edit panel**, or at minimum a panel-level "last saved Xs ago" rather than one shared, fast-fading flash — lower priority than the above since it is a friction issue, not a broken interaction.
- **Not recommended — do not redesign the edit panel into a hover-reveal-per-row inline-editing model to match Splice/QuestionPro/Figr exactly.** That would be a genuinely larger interaction redesign (editing fields directly inside the swimlane grid cells rather than via a side panel) — real, reference-grounded, but a bigger change than this spike's own fixes above; worth naming as a deferred, bigger idea rather than silently folding into this pass.
- **Not recommended — do not touch grid structure, column layout, or alignment.** Nothing found here contradicts any part of `jcx-s6`'s own already-shipped, already-verified structural design.

**Return to:** Operator decision below on how to proceed, given Part 2's finding 1 is a confirmed bug and not just a polish preference.

**What needs to change:** CSS-only. No data model change, no new route, no new chart dependency, no change to `jcx-s6`'s own grid structure (columns/rows/alignment stay exactly as shipped).

**Suggested direction, prioritized:**

- **P0 — Give empty/placeholder content (both field values and stage names) a distinct, muted visual treatment.** Concretely: empty cell values changed from `rgb(20,23,26)` to the same muted slate already used for row labels (`rgb(63,69,76)`) or lighter, and/or switched from the word "Not set" to an em dash (`—`) — the conventional data-table empty-cell marker per Carbon/Cloudscape. Apply the identical treatment to a default/unnamed stage header (finding 2) — same root cause, same fix, same CSS class reused in both places.
- **P0 — Normalize spacing to an 8px rhythm.** Row padding `10px 0px` → `8px 0px`; column-gap `12px` → `8px` (or `16px` if more visual separation between stage columns is wanted — either is on-rhythm, `12px` is not). Small, mechanical, every row benefits.
- **P1 — Bump row-label font-size from 11px to 12px.** Keep the existing color/weight treatment, which is already correct.
- **P1 — Reduce the emotion curve's fixed height from 164px**, now that stage labels live on-chart rather than needing extra vertical room for a separate label row beneath it. A smaller, content-proportional height (roughly 100-120px) keeps the chart legible while surfacing the 5 data rows beneath it sooner.
- **Not recommended — do not touch grid structure, column layout, or alignment.** Nothing found here contradicts any part of `jcx-s6`'s own already-shipped, already-verified structural design. This is a polish pass layered on top of it, not a revision of it.

**Return to:** Operator decision below on whether to scope this as a new short story now.

---

## Sources

- Smaply / UXPressia / Custellence visual-design comparison (web search) — UXPressia specifically reviewer-called "clunky"; underlying complaints centered on density/visual-noise, not missing structure
- eleken.co, timeline UI design guidance — typography/spacing/color/density, chart-height-proportional-to-content anti-pattern
- Linear's own timeline view + general timeline UI pattern research (web search)
- Dashboard/data-grid empty-state design patterns — Carbon, Supabase, Segment, Cloudscape (web search) — muted color and/or em-dash convention for empty cells; one empty state per page rather than repeated per-cell loud text
- Atlassian design system (8px spacing scale; Condensed/Regular/Relaxed 40/48/56px row-height tokens) and Material Design density presets (web search)
- Direct live measurement: `getComputedStyle` extraction from `wuce-staging.fly.dev`'s own rendered Customer experience tab (row padding, row height, label/cell font-size and color, header font-size/weight, curve row height) — grounds every recommendation above in the actual shipped values, not assumption
- Direct read of `src/web-ui/routes/journeys.js` (stage-creation handler, edit-panel markup and save-wiring script) — grounds Part 2's findings in the actual shipped code, not assumption
- Splice / QuestionPro / Figr journey-mapping-tool authoring-workflow conventions (web search) — hover-reveal inline "+" at the point of insertion, no modal/drawer round-trip for the primary create action
- Direct live reproduction via `javascript_tool`: clicked the real "+ Add stage" button on `wuce-staging.fly.dev` from the Customer-experience view and confirmed both failure modes (hidden container, failed focus) against the real DOM — not inferred from code alone

---

## Discovery fields resolved

No discovery-field changes for Part 1 (presentation CSS only). Part 2's finding 1 is a confirmed functional defect in existing, already-shipped behaviour (pre-dating this feature's own `discovery.md`) rather than a new scope item — no MVP scope, data model, or architecture constraint from `discovery.md` is affected by fixing it.
