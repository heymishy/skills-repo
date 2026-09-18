## Story: Restyle the Skill-Session Chat Page to Match DESIGN.md

**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Benefit-metric reference:** artefacts/2026-09-18-design-system-adoption/benefit-metric.md
**Domain:** web-ui

## User Story

As a **beta user** (one of the platform's 2 onboarded external users) and as **Hamish King (Founder/Operator)**,
I want **the skill-session chat page — the screen where the actual pipeline work happens, and the one I and beta users spend the most time on — to look like a modern, consistent SaaS product**,
So that **the platform's primary working surface reflects the brand direction being set, not the dated "Notion-calm" styling**.

## Benefit Linkage

**Metric moved:** Visual consistency across the 4 real screens
**How:** This story converts the skill-session chat page — the last of the 4 real screens the metric counts — from the old token values to `DESIGN.md`'s exact token values, closing the metric from 3/4 (after `dsa-s1`/`dsa-s2`/`dsa-s3`) to 4/4.

## Architecture Constraints

- Anti-pattern guardrail (`architecture-guardrails.md`): "Any change to shared surface modules (`html-shell.js`, design tokens, navigation structure, shared CSS) is a story — even a small one."
- Confirmed via `/clarify`: reuse and extend `src/web-ui/utils/html-shell.js`'s existing custom-property architecture — this story depends on `dsa-s1`'s token rename already being in place.
- `src/web-ui/routes/skills.js` (`_renderChatPage`) is this codebase's single largest, most heavily-used file — confirmed directly via this session's own prior work (`ep2-s3`). `src/web-ui/views/chat-view.js`'s `renderChat` is also directly involved (imported and called by `skills.js`). **Pure-append discipline applies**: any edit to the journey-gate panel or other existing functional markup within `_renderChatPage` must be additive/token-value-substitution only, never a reorder of existing structural markup, matching the exact discipline this session's own `ep2-s3` story already established and verified successful on this same file.
- `DESIGN.md`'s own "Skill session" layout pattern: resizable two-pane layout (drag handle between panes, and between stacked sections within the right pane), Focused/Chat segmented-control toggle in the left pane header, right pane varying by skill (Artefact draft + Diagrams sub-panel generically; Conditions/Assumptions/Canvas for `/ideate`; Story map + Diagrams for `/definition`).
- Real target files (confirmed to exist): `src/web-ui/routes/skills.js`, `src/web-ui/views/chat-view.js`.
- This story's diff touches `routes/skills.js`, the same file `ep2-s3`'s own mandatory route/handler E2E coverage check already established requires special care for. `/verify-completion` for this story must perform the same mandatory coverage check (identify every pre-existing spec touching this page, run the non-`@real-staging` ones locally), budgeted appropriately per that repo-documented precedent — this is a process requirement on `/verify-completion` itself, not a story AC (moved here from a prior draft AC5 during `/review`, since it described a downstream pipeline step rather than an observable product behavior).

## Dependencies

- **Upstream:** `dsa-s1` (shared `--green`/`--amber`/`--red` → `--success`/`--warn`/`--danger` token rename at the `html-shell.js` level).
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given the skill-session chat page is rendered in dark mode, When its computed CSS custom-property values are inspected, Then every color token matches `DESIGN.md`'s dark-mode token table exactly.

**AC2:** Given the skill-session chat page is rendered in light mode, When its computed CSS custom-property values are inspected, Then every color token matches `DESIGN.md`'s light-mode token table exactly.

**AC3:** Given the skill-session chat page follows `DESIGN.md`'s "Skill session" layout pattern (resizable two-pane layout, Focused/Chat toggle, right pane varying by skill type), When the real page is rendered, Then this structure is present and visually matches the `Skills Platform - Skill Session.dc.html` mock.

**AC4:** Given this codebase's own pre-existing E2E specs that exercise the skill-session chat page (a substantial set — this session's own `ep2-s3` route/handler coverage check found 6 pre-existing specs touching just the journey-gate panel alone), When the restyle is applied, Then every relevant pre-existing spec still passes — no functional regression to chat, journey-gate, sub-step affordances, diagrams, or any other existing feature on this page.

## Out of Scope

- Any other of the 3 remaining real screens (artefact viewer/dashboard/landing covered by `dsa-s1`/`dsa-s2`/`dsa-s3`) — each has its own story.
- Any functional/behavioral change to the chat, journey-gate, sub-step, or diagram mechanisms themselves — this is a visual restyle only, pure-append/token-substitution, never a functional rewrite.
- Building the `design.system` DoR governance mechanism — that is `dsa-s5`.

## NFRs

- **Performance:** No measurable page-load regression from the restyle.
- **Security:** None identified.
- **Accessibility:** WCAG 2.1 AA (per `product/constraints.md` #9) — no regression to existing accessibility properties.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 3

<!-- High ambiguity: this is the largest, most complex real screen, with the most existing functional surface area (chat, journey-gate, sub-step affordances, diagrams, multiple skill-type-specific right-pane layouts) that a restyle could risk regressing. Saved for last in this epic specifically so the token-substitution pattern is already proven on 3 simpler screens first. -->

**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
