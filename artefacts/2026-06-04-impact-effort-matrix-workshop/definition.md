# Definition Complete: Impact/Effort Matrix Workshop Tool

**Feature slug:** 2026-06-04-impact-effort-matrix-workshop
**Definition date:** 2026-06-04
**Slicing strategy:** User journey — two named workflow phases from design.md: (1) live canvas use during workshop, (2) post-session transcript analysis after recording is available
**Discovery approved:** 2026-06-04 (Hamish King)
**Benefit-metric status:** Active

---

## Epic structure

| Epic | Slug | Stories | Discovery scope covered |
|------|------|---------|------------------------|
| Epic 1: Live Workshop Session | iem-live-session | iem.1, iem.2, iem.3 | 2×2 grid canvas |
| Epic 2: Post-Session Analysis and Export | iem-post-session | iem.4, iem.5, iem.6, iem.7 | Transcript import, auto-segmentation, markdown export |

---

## Scope note — iem.6

**⚠️ iem.6 (Segment Review and Correction) is a design-discovered prerequisite not separately listed in discovery MVP scope.**

Discovery named 4 MVP scope items: 2×2 grid canvas, transcript import, auto-segmentation, and markdown export. The design artefact (step 11) explicitly includes accept/dismiss per segment as part of the post-segmentation facilitator interaction. Without a review step, false-positive auto-segmentation links flow directly into the export, undermining M2 (fewer clarifying questions) and M3 (faster discovery). The review step is a prerequisite for the export story delivering its benefit.

**Scope ratio:** 7 stories / 4 MVP items = 1.75. Justified: iem.2 and iem.3 are granularity subdivisions of "2×2 grid canvas," and iem.6 is an approved prerequisite. No unexplained drift.

Recorded in decisions.md as SCOPE-01.

---

## Benefit coverage matrix

| Metric | Stories that move it |
|--------|---------------------|
| M1: Write-up time (< 5 min) | iem.1, iem.2, iem.3 (enable same-session capture); iem.7 (primary delivery — export replaces manual write-up) |
| M2: Clarifying questions in outer loop (���30% fewer) | iem.4, iem.5, iem.6, iem.7 (richer transcript-linked export reduces gaps at discovery input) |
| M3: Discovery run speed (≥20% faster) | iem.4, iem.5, iem.6, iem.7 (same mechanism as M2 — richer input reduces questioning time) |
| M4: Workshop health failure condition | All stories (tool must enhance workshops not replace them — facilitator-measured externally) |

All metrics covered. No orphaned metrics. No unlinked stories.

---

## iem.1 — Application shell and 2×2 canvas

**Epic:** iem-live-session
**Stage:** definition

**As a** Facilitator
**I want** to open the application and see a 2×2 grid with clearly labelled axes and quadrant labels
**So that** I can begin capturing workshop output in real-time, enabling same-session export and eliminating post-session manual write-up (M1: write-up time)

#### Acceptance criteria

Given I open the application for the first time
When the page loads
Then a 2×2 grid is displayed with "Impact" labelled on the Y-axis (Low at bottom, High at top) and "Effort" labelled on the X-axis (Low at left, High at right)

Given the canvas is displayed
When I view the quadrant corners
Then four quadrant labels are visible: "High Impact / Low Effort" (top-left), "High Impact / High Effort" (top-right), "Low Impact / Low Effort" (bottom-left), "Low Impact / High Effort" (bottom-right)

Given I open the application in a browser with no prior session in localStorage
When the page loads
Then an empty canvas is shown with a prompt to add the first card, and no cards are displayed

Given I open the application in a browser with a saved session present in localStorage
When the page loads
Then a banner is displayed confirming the session was restored, and prior cards are rendered in their last saved positions

#### Out of scope
- Custom axis configurations (other 2×2 frameworks: value/risk, desirability/feasibility, etc.)
- Multiple simultaneous canvases
- Export functionality in this story

#### Dependencies
None

#### Architecture constraints
- React + Vite SPA: all workshop tool code must live in `workshop-tool/` at repo root — must not be added to `src/web-ui/` which is governed by Node.js CommonJS constraints incompatible with React's ESM module system
- WCAG 2.1 AA: axis labels, quadrant labels, and canvas structural elements must be present as semantic HTML text — not implied by visual layout alone

---

## iem.2 — Card creation

**Epic:** iem-live-session
**Stage:** definition

**As a** Facilitator
**I want** to add a new card with a name and optional label to the canvas
**So that** I can capture a new topic as it is introduced during the live workshop session, building the card set that the export will be structured around (M1: enables same-session capture; prerequisite for all downstream stories)

#### Acceptance criteria

Given the canvas is open
When I click "Add card" and enter a name in the input field and confirm
Then a card with that name appears on the canvas at the centre position

Given a card has been added and I enter an optional label
When I save the card
Then the label is displayed on the card beneath the name

Given cards have been added in the current session
When the session state is written to localStorage after each card addition
Then all cards (names, labels, current positions) are present in localStorage under the key `iem-session`

Given I have not yet entered a card name
When I view the confirm action in the "Add card" flow
Then the confirm action is disabled until at least one character has been entered

#### Out of scope
- Card deletion (out of MVP scope)
- Editing a card name after creation (out of MVP scope)
- Card templates or pre-set categories

#### Dependencies
- iem.1 (application shell and canvas must exist)

#### Architecture constraints
- React + Vite SPA: card creation component must live in `workshop-tool/` only
- WCAG 2.1 AA: card creation flow must be keyboard-operable — Tab to reach "Add card" button, Enter to confirm, Escape to cancel
- localStorage: session write must occur after every card addition; key: `iem-session`

---

## iem.3 — Card positioning and session persistence

**Epic:** iem-live-session
**Stage:** definition

**As a** Facilitator
**I want** to drag cards to their position on the 2×2 grid and have the session persist across page refreshes
**So that** I can record the group's view of each topic's impact and effort in real-time and resume without loss if the page is accidentally refreshed (M1: same-session capture without reconstruction; M2/M3: positioned cards are meaningful context in the export)

#### Acceptance criteria

Given a card is on the canvas
When I drag it using a pointer device (mouse or touch) to a new location on the grid
Then the card moves to and stays at the new location, and the card's impact and effort coordinates in session state update to reflect the new position

Given a card is on the canvas
When I select it by keyboard (Tab to focus) and press an arrow key
Then the card moves in the direction of the arrow key press and its coordinates update accordingly

Given I have positioned cards and refresh the page
When the page reloads
Then all cards are displayed at their last saved positions, restored from localStorage

Given a card is positioned on the canvas
When I view its entry in the card detail panel
Then an explicit text description of its axis position is shown — one of: "High Impact / Low Effort", "High Impact / High Effort", "Low Impact / Low Effort", or "Low Impact / High Effort" — this text must not depend on visual position alone

#### Out of scope
- Snap-to-grid or quadrant-snapping behaviour
- Undo/redo for card movements
- Multi-card selection and bulk move

#### Dependencies
- iem.2 (cards must exist before they can be positioned)

#### Architecture constraints
- `@dnd-kit/core` is the required drag-and-drop library (per design.md) — must not use react-beautiful-dnd or a custom drag implementation
- WCAG 2.1 AA: keyboard-based card movement is mandatory, not optional — arrow key interaction is AC2, not a stretch goal
- **ADR-018 / Playwright E2E required:** Card position after drag cannot be verified by jsdom (no layout engine). A Playwright spec in `tests/e2e/workshop-tool/` must verify card coordinate updates after a pointer drag event. This is a DoR H-E2E gate requirement for this story.
- localStorage: card position must be written to `iem-session` after every drag completion event (dragend / keyboard move commit)

---

## iem.4 — Transcript file import

**Epic:** iem-post-session
**Stage:** definition

**As a** Facilitator
**I want** to upload a manually exported transcript file in .txt, .srt, or .vtt format
**So that** the application can parse it into timestamped segments ready for auto-segmentation, without requiring me to use any particular recording platform or API integration (prerequisite for M2 and M3)

#### Acceptance criteria

Given I click "Import transcript" and select a .txt file
When the import completes
Then the application displays a confirmation showing the count of parsed text segments and the "Auto-segment" button becomes enabled

Given I click "Import transcript" and select a .srt file
When the import completes
Then the application parses the file into segments with start time and end time preserved for each segment, and the segment count is displayed

Given I click "Import transcript" and select a .vtt file
When the import completes
Then the application parses the file into segments with start time and end time preserved for each segment, and the segment count is displayed

Given I select a file with an extension other than .txt, .srt, or .vtt
When the import is attempted
Then an error banner is displayed with the message: "File format not recognised. Supported formats: .txt, .srt, .vtt" and no transcript is stored in session state

Given no transcript has been imported
When I view the toolbar
Then the "Auto-segment" button is disabled

#### Out of scope
- Automatic detection of the recording platform (Zoom vs Teams vs Loom) — format parsing is based on file extension only
- Cloud-based transcript import via API — manual file upload only for MVP
- Editing or correcting imported transcript segments

#### Dependencies
- iem.1 (application shell must exist for the toolbar and import controls)

#### Architecture constraints
- All transcript parsing must happen entirely client-side using the Browser File API — the file must never be uploaded to a server
- Parsed transcript segments are stored in session state under `transcript[]` in localStorage key `iem-session`
- React + Vite SPA: import and parsing logic must live in `workshop-tool/src/`

---

## iem.5 — Auto-segmentation via Claude API

**Epic:** iem-post-session
**Stage:** definition

**As a** Facilitator
**I want** to trigger automatic segmentation of the transcript by card so that each card shows which recording excerpts discuss it
**So that** I do not have to manually search the transcript for each topic, enabling post-session analysis fast enough to meet the < 5 minute write-up target (M1) and producing richer context that reduces clarifying questions in the outer loop (M2, M3)

#### Acceptance criteria

Given cards exist on the canvas and a transcript has been imported, and no Claude API key is stored in localStorage
When I click "Auto-segment"
Then an inline API key entry prompt appears; when I enter a key and confirm, the key is stored in localStorage under `iem-claude-key` and the segmentation call begins immediately

Given the API key is set and I click "Auto-segment"
When the Claude API call is in flight
Then a loading indicator is displayed and the "Auto-segment" button is disabled for the duration of the call

Given the Claude API call completes successfully
When the results are returned
Then each card's linked segments are stored in `segmentLinks[]` in session state, and the card detail panel for each card shows its linked segment excerpts with start time, end time, and a brief relevance reason

Given the Claude API returns an error response (rate limit, server error, or network failure)
When the error is received
Then an error banner is displayed with a human-readable message and a "Retry" button; no partial results are displayed and session state is not modified

Given the segmentation call has been running for more than 60 seconds without a response
When the timeout occurs
Then the loading indicator is replaced with the message: "Segmentation timed out. Try reducing the transcript length or splitting the session." along with a Retry button

#### Out of scope
- Per-card individual API calls — single batch call (all cards and full transcript in one request) is the MVP design
- Model selection UI — model is set in a constants file; not user-configurable via the UI for MVP
- Chunking strategy for transcripts exceeding Claude's context window — deferred to a follow-up story if the limit is hit in practice (see decisions.md)
- Storing the Claude API key anywhere other than localStorage

#### Dependencies
- iem.2 (cards must exist to segment against)
- iem.4 (transcript must be imported before segmentation can run)

#### Architecture constraints
- Claude API key must be stored in localStorage only; it must never be logged, included in error message text, or transmitted to any endpoint other than `api.anthropic.com`
- The API call must use the `x-api-key` header — the key must not be embedded in the request body or URL parameters
- NFR: the call must complete within 30s for a typical 60–90 minute workshop transcript at standard verbosity; the 60s timeout is a hard cutoff after which the call is abandoned
- React + Vite SPA: Claude API module and key handling must live in `workshop-tool/src/` and must be testable via a mock adapter

---

## iem.6 — Segment review and correction

**Epic:** iem-post-session
**Stage:** definition

**As a** Facilitator
**I want** to review the auto-segmentation results and dismiss false-positive links or add missed segments
**So that** the markdown export contains only verified, accurate context — protecting M2 and M3 from being undermined by low-quality auto-segmentation output that would introduce, rather than reduce, clarifying questions in the outer loop

#### Acceptance criteria

Given auto-segmentation results have been returned
When I select a card
Then the card detail panel shows all linked segments with: text excerpt, start time, end time, and relevance reason

Given I am viewing a linked segment in the card detail panel
When I click "Dismiss"
Then that segment link is removed from the card, is no longer shown in the card detail panel, and the `segmentLinks[]` array in session state is updated to reflect the removal

Given a card has no auto-linked segments
When I open the card detail panel and view the full transcript segment list
Then I can select any segment from the list and click "Add to card" to manually link it to the current card

Given I have dismissed or manually added segments
When the session state is saved to localStorage
Then the `segmentLinks[]` array reflects only the accepted segment links for each card

#### Out of scope
- Editing the text content of a transcript segment
- Re-running auto-segmentation for a single card only — full re-run is the mechanism
- Bulk accept all or dismiss all segments

#### Dependencies
- iem.5 (auto-segmentation results must exist in session state)

#### Architecture constraints
- React + Vite SPA: segment review component must live in `workshop-tool/`
- WCAG 2.1 AA: Dismiss and Add actions must be keyboard-operable; focus management after a Dismiss action must return to the next segment in the list or to the card detail panel header if no segments remain

---

## iem.7 — Markdown export

**Epic:** iem-post-session
**Stage:** definition

**As a** Facilitator
**I want** to export the complete canvas state as a structured markdown document
**So that** I can paste it directly into the outer loop discovery process without manual write-up, achieving the < 5 minute write-up target (M1) and providing richer context that reduces clarifying questions (M2) and speeds discovery runs (M3)

#### Acceptance criteria

Given at least one card exists on the canvas
When I click "Export"
Then a markdown file is downloaded to my local machine

Given the downloaded file is opened
When I inspect its structure
Then it contains one section per card with: the card name as a level-2 heading (##), an explicit axis position text line (e.g. "Position: High Impact / Low Effort"), and a list of linked transcript segments each showing the text excerpt and timestamp range (start – end)

Given a card has no linked transcript segments
When the export is generated
Then the card section is still included in the export with its name and axis position, with the note: "No transcript segments linked"

Given no cards exist on the canvas
When I view the toolbar
Then the "Export" button is disabled with tooltip text: "Add at least one card before exporting"

#### Out of scope
- Structured schema format for programmatic API consumption by the outer loop (deferred pending outer loop integration confirmation — see decisions.md open question 1)
- PDF export
- Export to Confluence, Jira, or any external platform
- Export filename customisation

#### Dependencies
- iem.1 (canvas must exist)
- iem.2 (cards must exist and have names)
- iem.3 (card positions must be present in session state for the axis position text)
- iem.6 (reviewed segment links are the recommended input; export is functional without review if the facilitator chooses to skip it)

#### Architecture constraints
- React + Vite SPA: export module must live in `workshop-tool/src/`
- Export must use the browser's native file download mechanism (Blob + URL.createObjectURL, or showSaveFilePicker where supported) — no server upload of any kind
- The exported file must be valid Markdown renderable by any standard Markdown viewer

---

## Scope accumulator summary

- Discovery MVP scope items: 4
- Stories written: 7
- Coverage: 4/4 MVP items covered
- Scope additions approved via scope note: 1 (iem.6 — design-discovered prerequisite)
- Scope ratio: 1.75 — above 1.5 threshold; justified by granularity subdivisions (iem.2, iem.3 from "canvas") and one approved prerequisite (iem.6)
- Verdict: ✅ Clean

---

## Decisions record

**SCOPE-01 — iem.6 scope addition**
Date: 2026-06-04
Decision: Add iem.6 (Segment review and correction) as an approved prerequisite story not in the original discovery MVP scope
Context: Discovery named 4 MVP items. The design artefact (step 11) explicitly includes accept/dismiss per segment as part of the post-segmentation workflow.
Rationale: Without a review step, false-positive segment links flow directly into the export and introduce low-quality context that would increase, not reduce, clarifying questions in the outer loop — directly undermining M2 and M3.
Operator approved: 2026-06-04

**DEFER-01 — Chunking strategy for long transcripts**
Date: 2026-06-04
Decision: Single-batch Claude API call is the MVP design. Chunking strategy deferred to a follow-up story if context window limits are hit in practice.
Rationale: Single-batch is simpler, avoids per-card rate-limit exposure, and Claude's large context window is adequate for typical 60–120 minute sessions. No facilitator has reported transcripts exceeding available context.
Revisit trigger: First occurrence of a context window error during auto-segmentation.

**DEFER-02 — Structured export schema for outer loop integration**
Date: 2026-06-04
Decision: Free-form structured markdown is the MVP export format. A structured schema conforming to the outer loop consumption contract is deferred to a post-MVP story.
Rationale: The outer loop consumption contract is unconfirmed (discovery assumption A3 / open question 1 in design.md). Implementing a schema against an unconfirmed contract risks rework.
Revisit trigger: Outer loop integration is confirmed and a consumption contract is specified.

---

## Architecture guardrails checked at definition

| Guardrail | Status | Notes |
|-----------|--------|-------|
| ADR-018 (Playwright E2E) | Applied | iem.3 canvas drag interaction requires Playwright spec — noted as Architecture Constraint and DoR H-E2E gate requirement |
| MC-A11Y-01 (keyboard-accessible interactive elements) | Applied | iem.3 keyboard card movement is AC2 (mandatory); iem.6 Dismiss and Add are keyboard-operable per Architecture Constraint |
| MC-A11Y-02 (colour not sole status indicator) | Applied | iem.1 quadrant labels are text; iem.6 segment state uses text action labels not colour alone |
| Tech stack isolation (workshop-tool/ directory) | Applied | All 7 stories carry Architecture Constraint: `workshop-tool/` only, not `src/web-ui/` |
| MC-SEC-02 (no credentials in committed files) | Applied | iem.5 Architecture Constraint: API key in localStorage only, never logged or transmitted outside `api.anthropic.com` |
| ADR-011 (artefact-first) | ✅ Complying — discovery → benefit-metric → design → definition sequence followed |