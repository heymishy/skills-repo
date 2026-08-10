## Story: Diagrams generated during a live /ideate session never appear when resuming/viewing that stage's history

**Epic reference:** None — short-track (bug fix, found by the operator directly while reviewing a real production feature)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **product owner reviewing a feature I worked on earlier**,
I want **the diagrams my `/ideate` session generated to still be visible when I resume or view that stage's history**,
So that **I don't lose a key part of what the session produced just because I navigated away and came back — diagrams are a differentiating capability of this platform and must survive being revisited**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — the operator reported directly: resuming a feature with real LLM-generated artefacts and diagrams does not show the diagrams as expected. Diagrams are explicitly named by the operator as a key differentiator of the web UI meant to be "hero"-ed, so a resumed/historical view silently dropping them is a significant, real product gap, not a cosmetic one.

**How:** Root-caused via direct source read. `handleGetJourneyStageView` (`src/web-ui/routes/journey.js`) is the "resume/view a completed stage" route (`/journey/:id/stage/:stageName`). When the stage being viewed is `ideate` and durable turn history exists (`_useChatSplit`), it deliberately renames the skill for rendering purposes:
```javascript
skillName: stageName === 'ideate' ? 'ideate-history' : stageName,
```
This was done (per the surrounding code comment, never formalised in any story/DoD/decisions.md) so `renderChat`'s canvas-support check (`isIdeate || skillName === 'design' || skillName === 'definition'`) fails to match — the reasoning given was that the 3-panel Conditions/Assumptions/Canvas layout "needs live lens/assumption state this durable-turns view does not have." That reasoning is correct for the *interactive* lens/assumption controls, but conflates them with diagrams, which are static, already-generated content — dropping them was an unintended side effect, not a deliberate scope decision.

Two further mechanical facts, confirmed by direct source read, that shape the fix:
1. Diagrams are emitted by the LLM as `---CANVAS-JSON: {...}---` markers **during the live conversation itself** (`skills/ideate/SKILL.md`: "emit exactly one CANVAS-JSON marker per lens output"), not inside the final artefact draft. `session.turns[].content` is saved with the **raw, unstripped** `fullText` (`skills.js:4828`) — the markers are genuinely present in durable turn history, recoverable by scanning it.
2. `renderChat`'s `readOnly: true` mode (used by this exact history view) suppresses its **entire** inline client-side `<script>` block (`chat-view.js` line ~133), including the JS that would normally populate and render canvas blocks (`renderCanvasBlock`/`mermaid.run()`). Even if `canvasBlocks` data were made available, nothing currently exists to render it into the DOM in read-only mode.

## Architecture Constraints

- **Reuse the existing CANVAS-JSON marker format and `parseCanvasBlock`'s type-allowlist** (`skills.js:812-828`) — export it (or an equivalent multi-marker extraction helper) for reuse in `journey.js`, rather than duplicating the parsing logic.
- **Do not restore the interactive lens/assumption-confirm UI in the read-only history view.** The original scope concern (no live lens/assumption state) remains valid for those specific elements — this story adds diagram-only rendering, not general interactivity.
- **Add a minimal, read-only-safe rendering path**, not a reuse of the full live `scriptHtml`. `chat-view.js`'s `readOnly` branch needs a narrow addition: when diagram data is present, emit just enough inline script to append the pre-built diagram blocks to `#canvas-panel` and call `window.mermaid.run()` once on load — no confirm buttons, no lens navigation, no SSE-pump wiring.
- **Server-render the canvas panel's initial content is not required** — client-side population via a `window.__SW_INITIAL_CANVAS_BLOCKS__`-style init variable (the same pattern already used for the live page's own resume-after-redeploy case, `skills.js:2626-2637`) is the established, proven pattern; reuse its shape.
- **`handleGetJourneyStageView` must pass the real `stageName`** (not a renamed sentinel) when diagrams are present, so `renderChat`'s canvas-panel DOM structure renders — but must NOT re-enable the footer/input-form or the full interactive script (those stay governed by `readOnly: true` exactly as today).

## Dependencies

- **Upstream:** None — fixes already-shipped `dsh-s3` (durable session history breadcrumb view) and interacts with the already-shipped canvas/diagram mechanism (`csd-s1`/`csd-s2`/`inc4`).
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a completed `/ideate` stage whose durable turn history contains one or more `---CANVAS-JSON: {...}---` markers with a type from the existing allowlist (`cluster-tree`, `table`, `text`, `data-model`, `system-architecture`, `program-design`, `drift-signal`), When the operator visits `/journey/:id/stage/ideate` to view that stage's history, Then each diagram renders as an actual rendered visual (not raw marker text, not a missing/empty panel).

**AC2:** Given the same scenario, When the page loads, Then `mermaid.min.js` is loaded and `mermaid.run()` executes exactly once against the reconstructed diagram nodes — no duplicate script tags, no double-initialization.

**AC3:** Given a completed `/ideate` stage whose turns contain a malformed or unrecognised-type CANVAS-JSON marker, When the history view renders, Then that specific marker is silently skipped (matching `parseCanvasBlock`'s existing null-return behaviour) — it does not throw, and other valid diagrams on the same page still render.

**AC4:** Given the history view (readOnly mode), When the page renders, Then no interactive lens-navigation, assumption-confirm, or condition-item controls appear — this story adds diagram display only; the existing read-only scope for those other elements is unchanged.

**AC5:** Given a completed, non-`ideate` stage (e.g. `design` or `definition`, both of which can also emit CANVAS-JSON per `csd-s3`/`csd-s4`), When its history is viewed, Then the same diagram-rendering fix applies consistently — this is not an `ideate`-only fix, since the underlying `renameSkillName` sentinel trick and the same `readOnly`-script-suppression gap apply identically to those skills' history views too.

**AC6:** Given a completed stage with zero CANVAS-JSON markers in its turn history, When its history is viewed, Then no diagrams panel appears at all (or an empty-state, matching current non-diagram behaviour) — no regression to the common case.

## Out of Scope

- **Restoring interactive lens/assumption-confirm/condition-item controls in the read-only history view** — explicitly not part of this fix; those elements remain non-interactive/absent as today.
- **Changing how CANVAS-JSON markers are emitted or the LLM-facing skill instructions** — untouched.
- **The live chat page's own diagram rendering** — already correct (confirmed live this session); untouched.
- **Editing/regenerating a diagram from the history view** — this story is display-only, matching the view's existing read-only posture.

## NFRs

- **Correctness:** Closes a real, currently-live, operator-reported gap in a capability the product explicitly wants to differentiate on.
- **Security:** Reuses mermaid's existing `securityLevel: "strict"` initialization (`skills.js:3699`) and the existing `escHtmlClient`-equivalent escaping for marker content — no new XSS surface introduced by rendering historical diagram data.
- **Performance:** Marker extraction is a single scan over already-fetched turn content (no new DB queries beyond the `_dshTurns` fetch this view already performs).

## Complexity Rating

**Rating:** 2 — the root cause and data availability are fully traced and confirmed, but the fix touches two files (a new server-side extraction helper, a new client-side read-only-safe rendering script variant) and must correctly preserve the existing readOnly-mode guarantees (AC4) while adding new rendering capability, which requires care.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
