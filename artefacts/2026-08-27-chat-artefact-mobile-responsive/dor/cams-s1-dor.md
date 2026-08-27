# Definition of Ready: cams-s1 — Stack the chat/artefact split-panel into a single column on mobile

**Story reference:** artefacts/2026-08-27-chat-artefact-mobile-responsive/stories/cams-s1-stack-chat-artefact-panels-on-mobile.md
**Test plan reference:** artefacts/2026-08-27-chat-artefact-mobile-responsive/test-plans/cams-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-27
**Track:** Short-track (bug fix, from the original 4-item live production bug report, 2026-08-25 — the last of the four still un-actioned)

---

## Contract review

Fix target confirmed via direct source inspection: `views/chat-view.js`'s `.sw-chat` grid has zero `@media` queries anywhere in the file. The fix reuses an established breakpoint (`html-shell.js`'s existing `max-width: 768px` sidebar drawer) and an established Playwright responsive-test pattern (`lphf-s2/s3/s4/s5-responsive.spec.js`), combined with a verified local mock-gateway journey-driving pattern (`rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js`) for reaching the two affected authenticated pages without needing real staging. **✅ Contract review passed** — no ambiguity remains about scope or test approach.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an operator running a skill session... from a phone or narrow browser window" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC6 each have 1+ dedicated E2E test or existing-suite re-run |
| H4 | Out-of-scope section is populated | ✅ | 4 explicit exclusions, each with reasoning |
| H5 | Benefit linkage field references a named metric | ✅ N/A (short-track direct correctness fix) | No formal benefit-metric artefact; direct operator bug report cited |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ (short-track exemption) | No `/review` was run — short-track |
| H8 | Test plan has no uncovered ACs | ✅ | Test plan's "Coverage gaps" section explicitly classifies the CSS-layout ACs as automated Playwright tests (B2 compliance), not left uncovered |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Breakpoint value, stacking order, height behaviour, and test-pattern reuse all explicitly specified |
| H-E2E | CSS-layout-dependent AC gate | ✅ | AC1-AC5 are CSS-layout-dependent — classified per B2 as automated Playwright E2E tests (option 1), following this repo's own established `lphf-s*` precedent. No RISK-ACCEPT needed. |
| H-NFR | NFR profile or explicit `NFRs: None — reviewed [date]` | ✅ | Story's NFR section fully populated (performance, security, accessibility, audit) |
| H-GOV | Governance approval (`## Approved By` in discovery artefact) | ✅ (short-track exemption) | No discovery artefact — short-track |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass. 14/14.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | N/A — satisfied |
| W2 | Scope stability declared | ✅ | — | N/A — satisfied |
| W3 | Verification method for CSS-layout ACs is real browser rendering, not code-reading | ✅ | — | N/A — satisfied via H-E2E |

No warnings raised.

---

## Oversight level

**Medium** — a pure CSS fix with no new security/data surface, but it is the first story this session to require genuine visual/layout verification via Playwright rather than unit-level assertions, and it makes one real design decision (stacking order + height behaviour) that a reviewer should sanity-check renders acceptably, not just that it compiles.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

No section of this file is directly implicated — this story is a CSS-only responsive fix to a shared view component, not a new HTML-render-function or shell-rendering pattern change.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: cams-s1 — Stack the chat/artefact split-panel into a single column on mobile
  — artefacts/2026-08-27-chat-artefact-mobile-responsive/stories/cams-s1-stack-chat-artefact-panels-on-mobile.md
Test plan: artefacts/2026-08-27-chat-artefact-mobile-responsive/test-plans/cams-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Task order:
1. src/web-ui/views/chat-view.js: add a
   `@media (max-width: 768px) { ... }` block (matching html-shell.js's
   existing breakpoint value, line 760 there) that:
   a. Changes `.sw-chat`'s `grid-template-columns: minmax(0,1fr)
      minmax(0,1fr)` to a single column (`grid-template-columns: 1fr`
      or equivalent), and changes `height: calc(100vh - 48px - 64px);
      max-height: 820px` to `height: auto` so the page scrolls
      naturally instead of each pane independently scrolling in a
      cramped fixed-height box.
   b. Do NOT reorder the DOM -- the chat pane is already first, the
      artefact/canvas pane second; stacking preserves this order
      automatically once grid-template-columns collapses to one column.
   c. Remove/override any `overflow: hidden` on `.sw-chat-pane` under
      this breakpoint if it would otherwise clip stacked content given
      the new height:auto behaviour -- verify by actually rendering,
      not by inspection alone.
2. Write tests/e2e/cams-s1-chat-artefact-responsive.spec.js per the test
   plan, reusing (duplicating, not importing, per this repo's own
   convention) rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js's
   local mock-gateway journey-driving helpers and
   lphf-s2/s3/s4/s5-responsive.spec.js's viewport-loop + overflow/
   bounding-box assertion pattern. Cover AC1-AC5 (375px and 1280px
   cases for both the live chat page and the historical stage view,
   plus the ideate 3-panel variant).
3. Re-run check-mfc1-model-first-chat-session.js,
   check-csd-s1-derisk-canvas-mermaid.js,
   check-csd-s2-canvas-diagram-rendering.js, and any other test
   asserting on .sw-chat/.sw-chat-pane markup, then the full suite,
   then run the new Playwright spec locally (npm run test:e2e or the
   equivalent scoped invocation for this one file) and confirm it
   passes against the local NODE_ENV=test server -- do not just trust
   the CSS looks right, actually render it.

Constraints:
- No new npm dependencies.
- Do not touch html-shell.js's existing sidebar breakpoint/drawer
  mechanism.
- Do not change any HTML structure, class names, or JS behaviour in
  chat-view.js -- CSS only, inside the new media query block.
- Do not introduce a tabbed/collapsible mobile UX -- plain vertical
  stacking only, per the story's Out of Scope.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests (e.g.
  the ideate 3-panel variant behaving unexpectedly under height:auto):
  add a PR comment describing the ambiguity and do not mark ready for
  review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal named sign-off — short-track, Complexity 2, operator-reported bug
**Signed off by:** Claude (agent), on operator direction ("Yes please" — write up the mobile responsive story)
**Date:** 2026-08-27
**Proceed:** Yes — all hard blocks pass, no warnings raised
