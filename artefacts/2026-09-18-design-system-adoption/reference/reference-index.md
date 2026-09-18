# Reference Index

**Feature:** Design system adoption
**Programme / initiative:** standalone
**Last updated:** 2026-09-18

---

## Source documents

| File | Type | Owner | Relevance | Notes |
|------|------|-------|-----------|-------|
| `DESIGN.md` | Design token/rule reference | Hamish King | Canonical typography, color tokens (dark + light), spacing/radius, component rules, icon spec, layout patterns per screen type, and rules for agents extending the system | Grounded in the Style Guide `.dc.html` file — treat that as the visual source of truth, this as the token/rule reference |
| `Skills Platform - Style Guide.dc.html` | Design Components mock | Hamish King | Full visual reference: color swatches, type scale, buttons, badges, cards, inputs, nav, tables, icon set | Source of truth for exact visual values |
| `Skills Platform - Dashboard.dc.html` | Design Components mock | Hamish King | Restyled mock of the real `/dashboard` app-shell screen | Compare against `src/web-ui/routes/*.js` current dashboard rendering |
| `Skills Platform - Landing.dc.html` | Design Components mock | Hamish King | Restyled mock of the marketing/landing page | Compare against `src/web-ui/routes/public.js` |
| `Skills Platform - Skill Session.dc.html` | Design Components mock | Hamish King | Restyled mock of the skill-session chat screen (two-pane resizable layout, Focused/Chat toggle, right-pane artefact draft + diagrams) | Largest mock (34KB) — this is the most complex real screen, `_renderChatPage` in `src/web-ui/routes/skills.js` |
| `Skills Platform - Artefact Viewer.dc.html` | Design Components mock | Hamish King | Restyled mock of the artefact/document viewer (two-column, sign-off + comments sidebar) | Compare against the real artefact-viewing routes |
| `github.md` | Repo investigation notes | Hamish King (or a prior agent session) | Confirms the current baseline being replaced is `src/web-ui/utils/html-shell.js`'s `DESIGN_SYSTEM_CSS` (the "Notion-calm" design system, confirmed real via direct code read — comment at `html-shell.js:7`), and maps each of the 4 mock screens to real target files. All 7 target file paths listed independently verified to exist: `routes/landing.js`, `routes/dashboard.js`, `views/dashboard-view.js`, `views/chat-view.js`, `routes/artefact.js`, `views/artefact-view.js`, `templates/landing.html` | Accurate, verified — safe to treat as a real starting map for /design's Step 2/3, though `skills.js`'s `_renderChatPage` (not `views/chat-view.js` alone) is the actual chat-page renderer per this session's own prior investigation — check both |
| `image-slot.js`, `macos-window.jsx`, `support.js` | Mock-tooling scripts | Hamish King | Supporting scripts for the `.dc.html` mocks (likely Design Components authoring tool runtime, not app code) | Confirm whether any of this is meant to ship, or is authoring-tool-only scaffolding |
| `uploads/*.png` (3 files) | Screenshots | Hamish King | Pasted reference images used while building the mocks | Context only unless discovery says otherwise |
| `.thumbnail` | Preview image | Hamish King | Thumbnail preview of the design system file bundle | Context only |

---

## Programme context

### Problem context
Not yet established — pending /discovery. A new dark-first visual design system (tokens, typography, component rules, layout patterns) has been produced, covering 5 real screen types in the existing product (dashboard, landing, skill-session chat, artefact viewer, plus the style guide itself). This reference folder captures the design system as delivered; /discovery will establish the underlying problem, personas, and scope boundary for adopting it.

### Stakeholders and sponsors
Hamish King — Founder/Operator (also the platform's sole current real user, per the related `2026-07-21-web-ui-experience-redesign` feature's own discovery artefact).

### Related initiatives
`artefacts/2026-07-21-web-ui-experience-redesign/` — an existing, separate feature (currently at `definition-of-done`, health `amber`) covering information-architecture and functional gaps (product view at scale, stale nav, settings/billing UI, admin impersonation) across some of the same real screens. Distinct scope from this design system work (visual language vs. functionality/IA), but touches overlapping files — worth checking for merge/sequencing considerations during /definition.

### Known constraints
Per `product/constraints.md`:
- **#8 — Design artefacts are referenced, not embedded.** The platform references design artefacts via URL in `context.yml`; it does not embed design content in SKILL.md files.
- **#9 — Design system compliance is structural, not advisory.** For stories with a `design.system` context tag, design system component usage is a DoR hard block. WCAG 2.1 AA is a hard floor, not an NFR.
- **#10 — The platform does not generate design artefacts.** It validates that they exist and meet declared standards; it doesn't produce wireframes/tokens/specs itself. This design system was produced outside the platform (by the operator), consistent with that boundary.

### Committed targets or deadlines
None known yet — pending /discovery.
