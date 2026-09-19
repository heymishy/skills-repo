# Restyle the Skill-Session Chat Page to Match DESIGN.md — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in `artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s4-test-plan.md` pass. Restyle `src/web-ui/routes/skills.js`'s `_renderChatPage` (real target: only its ~85-line style block + journey-gate panel, lines 4562-4661) and `src/web-ui/views/chat-view.js`'s `renderChat` (the real bulk of the page, lines 1-552) to match `DESIGN.md`'s "Skill session" layout pattern. This requires both token-substitution (AC1/AC2) AND building two genuinely new, purely-additive interactive mechanisms that do not exist in this codebase today: a resizable-pane drag mechanism, and a Focused/Chat toggle (AC3) — see "Scope interpretation" below.
**Branch:** `feature/dsa-s4`
**Worktree:** `.worktrees/dsa-s4`
**Test command:** `npm test` (unit/integration, via `node scripts/run-all-tests.js`); `npx playwright test tests/e2e/<file>` (Playwright, per-file)
**Complexity:** 3 (highest in this epic — see story's own Complexity Rating note)

---

## Scope interpretation (read before starting)

The story's Architecture Constraints say "visual restyle only... do not change any functional/behavioral mechanism." `DESIGN.md`'s own "Skill session" pattern and its reference mock (`Skills Platform - Skill Session.dc.html`) require a resizable two-pane layout (drag handles) and a Focused/Chat segmented-control toggle — **neither exists in this codebase today**. The test plan's own AC3 test (`skill-session-layout-matches-design-md-pattern`) explicitly asserts both. The correct reading, consistent with this repo's own `ep2-s3` precedent (which added a wholly new Sign Off button/modal to this exact file via pure append): **new, purely-additive UI chrome wrapped around unchanged existing mechanisms is in scope.** What must NOT change: what happens when a user submits a chat answer, what the journey-gate Continue/Sign-off buttons do, how a diagram renders, how canvas/assumption/condition data is stored or hydrated. What's new and expected: how much of the page is visible at once, whether panes can be dragged to resize, and whether the left pane shows one question at a time (Focused) or the full thread (Chat, already built). Do not use this interpretation to justify scope beyond what AC3's own test literally asserts.

---

## Pre-verified findings (from investigation before this plan was written — do not re-derive, verify against current code once per task instead)

**Route:** `GET /skills/:name/sessions/:id/chat` (`server.js` line 3008) → `handleGetChatHtml` → `_renderChatPage` (skills.js line 3103, real body ends 4667).

**`_renderChatPage`'s real restylable surface is small** (~85 lines): a `<style>` block for `.sn-bar`/journey-stage-nav at lines 4562-4586, and the journey-gate panel markup at lines ~4614-4661. Everything else in the function (3103-4561) is either JS data prep or one large inline `<script>` block with no visual markup — leave untouched.

**The real bulk of AC1-AC3's work is in `chat-view.js`** (552 lines, single exported `renderChat(data)`): a `<style>` block at lines 213-419 containing dozens of ad-hoc hardcoded hex colors (chip/badge/card-state colors that were never token-based at all — a parallel palette invented independently of `html-shell.js`), plus a `.sw-chat` CSS Grid (`grid-template-columns: minmax(0,1fr) minmax(0,1fr)`, fixed 50/50, no resize) with a left `.sw-chat-pane` (thread) and a right pane that already branches correctly by `data.skillName`: `ideate` → Conditions panel + Assumptions panel + `#canvas-section` (3-way stack); everything else → `#sw-artefact-pane` (Artefact Draft, or Story Map when `skillName === 'definition'`) + `#canvas-section` (2-way stack). **The right-pane content variants per skill type already exist and are structurally correct** — only the stacking mechanism (fixed `max-height`% divs, no drag) needs the new resize treatment.

**Token source of truth** (`html-shell.js`, already correct and DESIGN.md-aligned since `dsa-s1` — do not "fix" these, just reuse them):
- Light `:root` (line 434-447): `--bg:#FAFAFA` `--surface:#FFFFFF` `--surface-2:#F2F3F5` `--ink:#14171A` `--ink-2:#3F454C` `--muted:#6B7280` `--muted-2:#52585F` `--muted-3:#3A3F45` `--line:#E4E7EB` `--line-2:#EDEFF2` `--accent:#2563EB` `--accent-soft:#EFF4FF` `--accent-ink:#1D4ED8` `--green:#15803D`/soft`#DCFCE7` `--amber:#B45309`/soft`#FEF3C7` `--red:#B91C1C`/soft`#FEE2E2` — `--success`/`--warn`/`--danger` are simple `var(--green)`/`var(--amber)`/`var(--red)` aliases in light mode.
- Dark `[data-theme="dark"]` (line 454-471, `@media` no-JS fallback twin at 478-483): `--bg:#0B0D10` `--surface:#0E1013` `--surface-2:#161A1F` `--ink:#F5F6F7` `--ink-2:#B4BAC2` `--muted:#9AA1AB` `--muted-2:#6B7280` `--muted-3:#454B54` `--line:#23272E` `--line-2:#1A1D22` `--accent:#3B82F6` `--accent-soft:#152238` `--accent-ink:#93C5FD` `--green:#4ADE80`/soft`#052E16` `--amber:#FCD34D`/soft`#451A03` `--red:#F87171`/soft`#450A0A`. **`--success:#34D399`/soft`#0F2318`, `--warn:#F59E0B`/soft`#2A2011`, `--danger:#F87171`/soft`#2A1416` are DISTINCT LITERAL values in dark mode, NOT aliases of `--green`/`--amber`/`--red`** (a code comment at line 461-467 already flags this explicitly — do not simplify to `var(--green)` etc., even though `--danger` happens to share `--red`'s exact hex).

**Corrected AC4 regression-spec list** (the test plan's own list is wrong — see `decisions.md`'s dedicated entry, "test-plan's AC4 regression-spec list is materially inaccurate"; use THIS list, not the test plan's): 13 local — `bri-s3.2-signup-onboarding-journey`, `cams-s1-chat-artefact-responsive`, `csd-s2-canvas-diagram-rendering`, `design-definition-canvas-render`, `dic-canvas`, `dsh-s3-breadcrumb-split-view`, `dsh-s6-archived-stage-transparent-render`, `ep2-s3-approval`, `fjcv-s1-full-journey-core-flow-and-resume`, `iwu2-right-panel-layout`, `rdac-s1-resume-shows-diagrams-artefact-conversation`, `reference-upload`, `wnl-s2-journey-gate-sticky`; 5 `@real-staging` (residual risk, do not run locally) — `a3-product-feature-ideate-canvas`, `a4-ideate-session-resume`, `b1-formed-idea-outer-loop-story-map`, `csd-s1-data-model-diagram`, `dsh-s4-resume-conversation-survives-restart`. **`iwu2-right-panel-layout.spec.js` and `cams-s1-chat-artefact-responsive.spec.js` are the highest-risk of the 13** — the first likely asserts current right-pane dimensions/structure directly, the second asserts the existing `@media (max-width:768px)` stack-not-resize behavior that must keep working unchanged once resize is added above 768px.

**Pure-append technique** (`ep2-s3`'s own established precedent on this exact file): pure-append means appending new content to the end of an existing JS string/array variable via `+` or a new array entry — never removing, reordering, or splicing existing entries. Color-value substitution *within* an existing CSS rule body (e.g. `color:#2da44e` → `color:var(--success)`) is safe and does not violate this — the discipline is specifically about HTML *structure* (element nesting/order), not about the literal characters inside an existing rule's declaration.

**Drag-resize reference implementation** (from the mock, `Skills Platform - Skill Session.dc.html` lines 338-363): a generic reusable closure taking `(axis, key, min, max, containerSelector)` — `mousedown` on a handle registers `mousemove`/`mouseup` on `document`, computes `((pos - start) / containerSize) * 100`, clamps to `[min,max]`, sets `element.style.flexBasis = pct + '%'` on move, unregisters listeners on `mouseup`. Outer split: `#sw-split-container{display:flex}`, left `section{flex:0 0 46%}`, a 5px `cursor:col-resize` handle, right `section{flex:1}`. Right-pane stacks: same pattern with `cursor:row-resize` handles between sections, last section `flex:1`.

---

## File map

```
Modify:
  src/web-ui/views/chat-view.js    — token-substitute the ad-hoc hex palette in its <style> block (213-419); add the resizable outer-split + right-pane-stack markup/CSS/script (additive, wraps existing panes); add Focused/Chat toggle markup/CSS/script + Focused-mode rendering path (additive, new code path alongside the existing Chat/thread rendering, which stays default and unchanged)
  src/web-ui/routes/skills.js      — token-substitute the .sn-bar style block and journey-gate panel's hardcoded colors (4562-4661 only); no structural changes elsewhere in _renderChatPage

Create:
  tests/e2e/dsa-s4-chat-restyle.spec.js — E2E tests for AC1-AC4
```

---

## Task 1: Token substitution — replace hardcoded colors with real design-system tokens (AC1, AC2) — ✅ COMPLETE (commit `7bc495e1`)

**Files:**
- Modify: `src/web-ui/views/chat-view.js` (its `<style>` block, lines 213-419)
- Modify: `src/web-ui/routes/skills.js` (lines 4562-4586 style block + 4614-4661 journey-gate panel only)

**This task is pure color-value substitution inside existing rule bodies — zero structural/markup changes. Lowest risk, do first.**

- [ ] **Step 1: Write the failing test**

Create `tests/e2e/dsa-s4-chat-restyle.spec.js` (new file — this becomes the story's own spec, extended by later tasks):

```javascript
'use strict';
const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

// dsa-s4 AC1/AC2: computed CSS custom-property values on the skill-session
// chat page match DESIGN.md's token tables exactly, both themes. Mirrors
// dsa-s1/dsa-s2/dsa-s3's own established token-verification pattern.

const DARK_TOKENS = {
  '--bg': 'rgb(11, 13, 16)', '--surface': 'rgb(14, 16, 19)', '--ink': 'rgb(245, 246, 247)',
  '--muted': 'rgb(154, 161, 171)', '--line': 'rgb(35, 39, 46)', '--accent': 'rgb(59, 130, 246)',
  '--success': 'rgb(52, 211, 153)', '--warn': 'rgb(245, 158, 11)', '--danger': 'rgb(248, 113, 113)',
};
const LIGHT_TOKENS = {
  '--bg': 'rgb(250, 250, 250)', '--surface': 'rgb(255, 255, 255)', '--ink': 'rgb(20, 23, 26)',
  '--muted': 'rgb(107, 114, 128)', '--line': 'rgb(228, 231, 235)', '--accent': 'rgb(37, 99, 235)',
  '--success': 'rgb(21, 128, 61)', '--warn': 'rgb(180, 83, 9)', '--danger': 'rgb(185, 28, 28)',
};

withAuth('dsa-s4 AC1: dark-mode chat page computed tokens match DESIGN.md', async ({ page }) => {
  // seed a real generic-skill chat session via the test-only endpoint (mirrors ep2-s3's own precedent)
  // navigate to /skills/<name>/sessions/<id>/chat
  // for each key in DARK_TOKENS: expect(await page.evaluate((k) => getComputedStyle(document.body).getPropertyValue(k).trim(), key)).toBe(...)
});

withAuth('dsa-s4 AC2: light-mode chat page computed tokens match DESIGN.md', async ({ page }) => {
  // same page, toggle light mode via localStorage/data-theme, assert LIGHT_TOKENS
});
```

Run it (expect fail — hardcoded hex values won't produce these computed custom-property reads correctly, or the page renders with the wrong colors): `npx playwright test tests/e2e/dsa-s4-chat-restyle.spec.js`

- [ ] **Step 2: `chat-view.js` token substitution**

Read the full `<style>` block (213-419) fresh before editing — do not rely on this plan's own summary for exact current line numbers, they may have shifted. Map every hardcoded hex to its nearest real token:
- `.chip-ok`/`.ac-badge-green`/`.assumption-card[data-state="confirmed"]` (green-family: `#DCFCE7`/`#166534`/`#BBF7D0`/`#6EE7B7`/`#F0FDF4`) → `var(--success-soft)`/`var(--success)`/border equivalents
- `.chip-warn`/`.ac-badge-amber` (amber-family: `#FEF9C3`/`#713F12`/`#FDE68A`/`#FEF3C7`/`#92400E`) → `var(--warn-soft)`/`var(--warn)`
- `.assumption-card[data-state="flagged"]`/`.ac-risk-high`/`.ci-type-constraint` (red-family: `#FCA5A5`/`#FFF1F2`/`#EF4444`/`#FEE2E2`/`#991B1B`) → `var(--danger-soft)`/`var(--danger)`
- `.ac-risk-medium` (`#F59E0B`) → `var(--warn)`; `.ac-risk-low` (`#10B981`) → `var(--success)`
- `.ac-type-desirability`/`.ac-type-viability`/`.ci-type-dependency` (purple/blue `#EDE9FE`/`#3730A3`, `#DBEAFE`/`#1E40AF`) → these don't map to a pass/fail semantic; use `var(--accent-soft)`/`var(--accent)` for blue-family, and for the purple-family either reuse `--accent` too or leave as a documented exception if visually distinct categorization is load-bearing — check with a live render before deciding, do not guess
- `.ac-type-feasibility`/`.ci-type-outcome` (green `#DCFCE7`/`#166534`) → `var(--success-soft)`/`var(--success)`
- `.ac-type-ethical` (`#F3F4F6`/`#374151`) → `var(--surface-2)`/`var(--ink-2)`
- `.dm-cx--l`/`--m`/`--h` (`#2da44e`/`#ca8a04`/`#dc2626`) → `var(--success)`/`var(--warn)`/`var(--danger)`
- `.sw-chat-insight` (`#DDD6FE` border) → keep as-is or `var(--accent-soft)` border if visually equivalent — verify live
- `.sw-chat-confirm` (`#FDE68A` border) → `var(--warn-soft)` border
- `.cv-diagram-error-box` — already token-based (`var(--red,#DC2626)` etc.) but with stale fallback values; change to `var(--danger)`/`var(--danger-soft)` and drop the stale hardcoded fallback (tokens are always defined via `html-shell.js`, no fallback needed)
- `:root { --teal: #0F766E; --teal-soft: #CCFBF1; }` — this is a custom token invented mid-file, not in `DESIGN.md`'s palette. Find its actual usage (grep `--teal` within this same file) before deciding: if it's load-bearing for a real visual distinction DESIGN.md doesn't have an equivalent for, leave it defined as-is (out of scope to redesign); if unused or trivially replaceable with an existing token, replace it. Do not silently delete without checking usage first.
- Leave the two `rgba(0,0,0,...)` shadow/overlay values alone (not semantic colors).

- [ ] **Step 3: `skills.js` token substitution (4562-4661 only)**

- `.sn-step--done .sn-icon{color:#2da44e}` → `color:var(--success)`
- `var(--line-2,#f6f8fa)` / `var(--accent-soft,#eaf1fb)` / `var(--accent,#0969da)` → drop the stale hardcoded fallbacks entirely: `var(--line-2)` / `var(--accent-soft)` / `var(--accent)`
- Journey-gate panel `color:#fff` on `background:var(--ink)` → check the live-rendered intent (likely wants to stay a fixed light-on-dark bar regardless of theme, or wants to invert with theme — verify against the mock before choosing `var(--bg)` vs. leaving `#fff` as an intentional fixed value)
- `color:var(--error,red)` → `color:var(--danger)` (`--error` is not a real token name in this codebase — this was already a bug, not just a missing fallback)

- [ ] **Step 4: Verify AC1/AC2 tests pass; run the corrected local regression subset**

`npx playwright test tests/e2e/dsa-s4-chat-restyle.spec.js` — AC1/AC2 tests pass.
Run at minimum `cams-s1-chat-artefact-responsive.spec.js` and `iwu2-right-panel-layout.spec.js` locally now (before Task 2/3 add more risk) to catch any color-substitution-caused breakage early: `npx playwright test tests/e2e/cams-s1-chat-artefact-responsive.spec.js tests/e2e/iwu2-right-panel-layout.spec.js`

- [ ] **Step 5: Complete task**
- Check off this task
- Record ending git SHA
- Set `tddState: "committed"` locally in `pipeline-state.json` (batch-commit at plan end, per established cadence)
- Commit: `feat(dsa-s4): substitute hardcoded chat-page colors with design-system tokens (AC1, AC2)`

---

## Task 2: Focused/Chat segmented-control toggle (AC3 — toggle portion) — ✅ COMPLETE (commit `c639aa80`)

**Files:**
- Modify: `src/web-ui/views/chat-view.js` only

**New, purely-additive UI: a toggle in the left-pane header switching between the existing full-thread view ("Chat", already built, stays the default) and a new "Focused" view (one question at a time). Per Scope interpretation above, this is new UI chrome, not a change to any existing chat mechanism — the underlying message data and submit behavior are unchanged; only how much is rendered/visible changes.**

- [ ] **Step 1: Write the failing test**

Extend `dsa-s4-chat-restyle.spec.js`:

```javascript
withAuth('dsa-s4 AC3 (toggle): Focused/Chat segmented control present, defaults to Chat, switching shows one question at a time', async ({ page }) => {
  // navigate to a real chat session
  // assert a segmented-control element with "Focused" and "Chat" options is present in the left-pane header
  // assert Chat is the default active state, full thread visible (existing #chat-messages content)
  // click Focused
  // assert: only the current/most-recent unanswered question is shown, prior answered turns are collapsed/hidden behind a progress indicator ("Question X of Y" or equivalent), a way to expand a previous answer exists
  // click Chat again — assert full thread is restored, nothing about the underlying message data changed
});
```

Run it — fails (no toggle exists yet).

- [ ] **Step 2: Build the toggle + Focused-mode rendering**

Add a segmented-control (reuse the mock's own CSS pattern: `display:flex;gap:2px;background:var(--surface-2);border-radius:7px;padding:2px`, active button `background:var(--bg)` or `var(--surface)`) to `.sw-chat-head` (the existing left-pane header) — pure append to that header's existing markup, do not restructure it.

Focused mode: a new, additive rendering path — do not replace `#chat-messages`'s existing DOM, instead toggle visibility (`hidden` attribute or a class) between the existing full-thread view and a new Focused-mode container that's built from the SAME `data.priorQA` array already passed into this function (no new data source, no new server call). Show only the latest unanswered question (or the most recent turn if all answered); prior turns collapse behind a simple counter/progress-dots indicator with a click-to-expand affordance for any individual prior answer. Client-side toggle only (a small inline `<script>` following this file's own existing pattern for `alwaysOnScriptHtml`/`scriptHtml`) — no new server route, no change to how answers are actually submitted (the existing textarea/Send button and Cmd/Ctrl+Enter handler stay wired exactly as they are, just shown/hidden based on toggle state, same as Chat mode already does).

- [ ] **Step 3: Verify AC3 (toggle) test passes; run `fjcv-s1-full-journey-core-flow-and-resume.spec.js` locally**

This spec exercises real multi-turn conversation flow — highest risk of the 13 local specs for this task specifically, since it's the closest thing to an integration test of the actual chat/submit mechanism this task must not touch.

- [ ] **Step 4: Complete task** (same pattern as Task 1 Step 5)
- Commit: `feat(dsa-s4): add Focused/Chat segmented-control toggle to skill-session chat (AC3 toggle)`

---

## Task 3: Resizable-pane drag mechanism — outer split + right-pane stacks (AC3 — resize portion) — ✅ COMPLETE (commit `48e6b1a4`)

**Files:**
- Modify: `src/web-ui/views/chat-view.js` only

**New, purely-additive UI: drag handles between the two main panes, and between each right-pane variant's stacked sections (Conditions/Assumptions/Canvas for ideate; Artefact-or-StoryMap/Diagrams for everything else). Port the mock's own generic `_drag(axis, key, min, max, containerSelector)` closure (see Pre-verified findings above) — do not invent a different mechanism.**

- [ ] **Step 1: Write the failing test**

Extend `dsa-s4-chat-restyle.spec.js`:

```javascript
withAuth('dsa-s4 AC3 (resize, generic): outer split + right-pane stack are draggable, generic skill shows Artefact+Diagrams', async ({ page }) => {
  // navigate to a generic (non-ideate, non-definition) skill session
  // assert a drag handle exists between the two main panes (cursor:col-resize) and between the right-pane's 2 stacked sections (cursor:row-resize)
  // assert right pane shows Artefact draft + Diagrams (existing structure, now in a resizable stack)
  // simulate a drag (mousedown, mousemove, mouseup) on the outer handle; assert the left pane's flex-basis % changed from its default
});

withAuth('dsa-s4 AC3 (resize, ideate): ideate session right pane shows Conditions/Assumptions/Canvas 3-way resizable stack', async ({ page }) => {
  // navigate to an /ideate session; assert 3 stacked sections with 2 drag handles between them; assert content matches (Conditions, Assumptions, Canvas)
});

withAuth('dsa-s4 AC3 (resize, definition): /definition session right pane shows Story map + Diagrams resizable stack', async ({ page }) => {
  // navigate to a /definition session; assert 2 stacked sections (Story map, Diagrams) with 1 drag handle
});
```

Run — fails (no drag handles exist).

- [ ] **Step 2: Implement the resize mechanism**

Change `.sw-chat`'s CSS from fixed `grid-template-columns` to `display:flex` with `flex:0 0 {pct}%` on each pane (default 50/50, or match the mock's 46/54 if that's the intended default — verify against the mock), insert a 5px drag-handle `<div>` between them. For each right-pane variant, wrap its existing stacked sections (already-correct content per skill type) in the same flex+handle pattern, replacing the current fixed `max-height`% divs. Port the mock's `_drag()` closure as a small inline `<script>` (same append-only pattern as Task 2's toggle script) — generic enough to handle all handles (outer + each right-pane stack) via the same function with different params. Keep the existing `@media (max-width:768px)` stacking behavior for below-768px — that media query already exists and switches to `1fr`/stacked; the new resize mechanism only applies above that breakpoint, matching `DESIGN.md`'s own "Responsive behavior" section (no resize attempted below 768px). Verify `cams-s1-chat-artefact-responsive.spec.js` still passes after this change specifically, since it's the spec asserting that exact media-query behavior.

- [ ] **Step 3: Verify AC3 (resize) tests pass; run the remaining local regression specs not yet run in Task 1/2**

Run all 13 corrected local specs now that both new mechanisms exist: `bri-s3.2-signup-onboarding-journey`, `csd-s2-canvas-diagram-rendering`, `design-definition-canvas-render`, `dic-canvas`, `dsh-s3-breadcrumb-split-view`, `dsh-s6-archived-stage-transparent-render`, `ep2-s3-approval`, `reference-upload`, `wnl-s2-journey-gate-sticky` (the remaining ones not already run in Task 1/2's own targeted checks), plus a final full re-run of `cams-s1-chat-artefact-responsive` and `iwu2-right-panel-layout` and `fjcv-s1-full-journey-core-flow-and-resume`.

- [ ] **Step 4: Complete task** (same pattern)
- Commit: `feat(dsa-s4): add resizable-pane drag mechanism to skill-session chat, outer split + right-pane stacks (AC3 resize)`

---

## Task 4: Full regression verification (AC4) + npm test + live browser check

**Files:** verification only, no source changes expected (fix forward if Tasks 1-3 missed something).

- [ ] **Step 1: Re-run all 13 corrected local specs together** in one pass: `npx playwright test tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js tests/e2e/cams-s1-chat-artefact-responsive.spec.js tests/e2e/csd-s2-canvas-diagram-rendering.spec.js tests/e2e/design-definition-canvas-render.spec.js tests/e2e/dic-canvas.spec.js tests/e2e/dsh-s3-breadcrumb-split-view.spec.js tests/e2e/dsh-s6-archived-stage-transparent-render.spec.js tests/e2e/ep2-s3-approval.spec.js tests/e2e/fjcv-s1-full-journey-core-flow-and-resume.spec.js tests/e2e/iwu2-right-panel-layout.spec.js tests/e2e/rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js tests/e2e/reference-upload.spec.js tests/e2e/wnl-s2-journey-gate-sticky.spec.js tests/e2e/dsa-s4-chat-restyle.spec.js`

- [ ] **Step 2: Run the full Node suite**: `npm test`. Expect the same 2 already-acknowledged baseline failures (`tests/check-p3.5-validate-trace.js`, `tests/check-pcr-s1-test-runner.js`) — re-run any standalone to confirm before flagging as new.

- [ ] **Step 3: Live browser render check** — given this story's own established precedent (every prior story in this epic found real value in this check) and this story's genuinely new interactive mechanisms (drag-resize, Focused/Chat toggle) that automated assertions alone are weakest at catching visually: load a real chat session for each of the 3 skill-type variants (generic, `/ideate`, `/definition`), both light and dark mode. Confirm: colors match tokens visually (not just computed-style-correct), drag handles are visually present and functional (not just DOM-present), the Focused/Chat toggle looks and behaves correctly, no layout breakage at a normal desktop viewport, and the existing `@media (max-width:768px)` stacking still holds at 375px/390px via `page.setViewportSize()` (the `resize_window` browser tool is confirmed unreliable for true mobile widths in this environment — use Playwright's own viewport control for the narrow-width part of this check, matching the `dsa-s2`/`dsa-s3`/`dsa-s7` precedent already established this session).

- [ ] **Step 4: Commit if any fixes were needed** (separate commit, own clear message).

---

## Post-plan note for /verify-completion

This story's diff touches `src/web-ui/routes/skills.js` (a route/handler file) — `/verify-completion`'s mandatory route/handler E2E coverage check applies, and per this plan's own corrected finding, use the **18-spec list** (13 local + 5 `@real-staging`), not the test plan's original 15-spec list, when performing that check. Name all 5 `@real-staging` specs explicitly as residual risk in the completion report, not just the 2 the test plan originally claimed.

The mandatory live browser render check also applies (this diff changes rendered UI extensively) — Chrome tooling was confirmed working as of `dsa-s7`'s own recent delivery in this same session; use it directly rather than assuming a RISK-ACCEPT is needed, unless it disconnects again.
