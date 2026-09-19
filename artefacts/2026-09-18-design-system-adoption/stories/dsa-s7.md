## Story: Add the "Product in Action" Demo Section to the Landing Page

**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Benefit-metric reference:** artefacts/2026-09-18-design-system-adoption/benefit-metric.md
**Domain:** web-ui

## Origin note (2026-09-19)

`dsa-s3` (landing page restyle) deliberately omitted `DESIGN.md`'s mock's "Product in action" section — a browser-chrome-framed demo of the real product in use — because the mock's own version depends on `sc-for`/`image-slot` custom elements (a tab-switching carousel across 3 static frames) this codebase has no real equivalent for, and no real screenshots existed at the time. This was explicitly documented as a known gap in `dsa-s3`'s own commit message, E2E spec header comment, and DoD (`artefacts/2026-09-18-design-system-adoption/decisions.md`, `dod/dsa-s3-dod.md`). The operator has now asked for this scope explicitly, citing it as a key conversion-relevant demo for prospective users. `dsa-s3` itself is already merged and DoD-complete — per this feature's own established convention for post-merge gaps (see `decisions.md`'s `dsa-s2`→`a3` regression-fix entry and the planned `dsa-s6` mobile-fix story), this is scoped as a NEW story rather than reopening `dsa-s3`.

**Format decision (operator-confirmed, differs from the mock):** the mock's own tab-switching, 3-frame carousel is replaced with a single looping/autoplaying GIF — simpler to build (no tab-switching JS, no multi-frame state), and a single GIF can itself show multiple product features in sequence (e.g. kanban board → skill session → shipped artefact) without needing interactive controls. The browser-chrome frame (traffic-light dots + URL bar) is kept, matching the mock's own visual treatment.

**Asset decision (operator-confirmed):** this story ships with a static, clearly-labeled placeholder (no broken image request, no new asset-serving route) — a real, high-definition demo GIF is an explicit fast-follow once one is recorded, not blocking this story. The implementation must leave an unambiguous, well-commented swap-in point (e.g. a single `<img>`/`<video>` tag with a clear `src` path and a code comment naming exactly what file to add and where) so wiring in the real asset later is a one-line change, not a rewrite.

## User Story

As a **prospective user reaching the landing page before signing up** (or an existing beta user revisiting it),
I want **to see the actual product in action, not just marketing copy**,
So that **I can judge for myself whether this tool does what it claims before committing to a sign-up**.

## Benefit Linkage

**Metric moved:** Beta user feedback on visual quality / Visual consistency across the 4 real screens
**How:** This story completes `dsa-3`'s own restyle against `DESIGN.md`'s full mock (closing a known, already-tracked gap), and directly targets the "Beta user feedback on visual quality" metric — a live product demo is explicitly named by the operator as a key conversion-relevant element for prospective users, the exact audience that metric measures.

## Architecture Constraints

- Anti-pattern guardrail (`architecture-guardrails.md`): "Any change to shared surface modules (`html-shell.js`, design tokens, navigation structure, shared CSS) is a story — even a small one." This story adds new markup/CSS to `landing.html` only — no shared-module changes expected, but confirm during implementation.
- Real target file (confirmed by `dsa-s3`'s own delivery): `src/web-ui/templates/landing.html`, read into `_LANDING_HTML` by `src/web-ui/routes/public.js`'s module-level init and served verbatim by `handleRoot` for `GET /`. Do not implement against `routes/landing.js`/its own separate `public/landing.html` — confirmed dead code, never dispatched.
- Reuse the real token values and layout conventions `dsa-s3` already established in this same file (`:root`/`[data-theme="dark"]` custom properties, the existing `.section-1120` full-bleed section pattern, `DESIGN.md`'s Components section for card/border/radius conventions) — this section is an ADDITION to the existing restyled page, not a parallel styling approach.
- Per `DESIGN.md`'s "Marketing/landing" layout pattern: this section sits within the existing full-bleed `max-width:1120px` section pattern `dsa-s3` already built, styled with a browser-chrome frame (traffic-light dots + URL-bar-style label) matching the mock's own visual treatment — see `artefacts/2026-09-18-design-system-adoption/reference/Skills Platform - Landing.dc.html`'s "Product in action" section for the exact visual reference (traffic-light colors, border-radius, box-shadow values).
- Per this feature's own FEATURE-WIDE mobile-responsiveness requirement (`DESIGN.md`'s "Responsive behavior" section, added 2026-09-19): the browser-chrome frame must scale down proportionally at narrow viewports, not clip or force horizontal overflow — the exact failure class already found and fixed twice in this feature (`dsa-s2`'s dashboard, `dsa-s3`'s own hero cards during implementation).

## Dependencies

- **Upstream:** `dsa-s3` (this section is added to the same file `dsa-s3` already restyled; depends on its token/layout work already being in place).
- **Downstream:** A future fast-follow story to swap the placeholder for a real, recorded high-definition demo GIF — not created yet, not blocking this story's own completion.

## Acceptance Criteria

**AC1:** Given the landing page is rendered (either theme), When the page is scrolled to below the hero section, Then a "Product in action" section is present, containing a browser-chrome-framed area (traffic-light dots in red/amber/green, a URL-bar-style label reading a real or representative domain) matching `DESIGN.md`'s mock's own visual treatment.

**AC2:** Given the "Product in action" section, When no real demo GIF asset exists yet (the case at this story's own completion), Then a clearly-labeled static placeholder is shown inside the browser-chrome frame (not a broken image, not blank/empty space) — the placeholder honestly communicates "demo coming soon" or equivalent, not a fake/misleading screenshot.

**AC3:** Given the "Product in action" section's markup, When a future story or the operator adds a real demo GIF file, Then wiring it in requires only replacing a single, clearly-commented `src`/asset reference — no markup restructuring, no new CSS, no JS changes.

**AC4:** Given the "Product in action" section is rendered in dark mode and in light mode, When its computed CSS custom-property values (borders, backgrounds, text) are inspected, Then they match `DESIGN.md`'s token tables exactly, consistent with the rest of `dsa-s3`'s own already-restyled page.

**AC5:** Given the real landing page (with this new section) is rendered at a real mobile viewport width (375px and 390px), When the page is measured, Then `document.body.scrollWidth` does not exceed the viewport width (no horizontal overflow) and the browser-chrome frame scales down proportionally rather than clipping or forcing overflow.

**AC6:** Given the landing page's pre-existing functionality (everything `dsa-s3` already verified: tokens, hero, golden-trace demo, hero cards, auth panel), When this new section is added, Then no existing functional behavior regresses — verified by re-running `dsa-s3`'s own full regression suite (9 Node check-scripts + `lphf-s1` through `s5` E2E specs + `dsa-s3-landing-restyle.spec.js`) before and after this change.

## Out of Scope

- Sourcing, recording, or producing the real product demo GIF — this story ships a static placeholder; the real asset is an explicit, separate fast-follow.
- Building a general-purpose image/video asset-serving mechanism beyond what's needed to serve this one placeholder/future GIF — reuse the simplest approach that fits `landing.html`'s own existing self-contained-file pattern (e.g. an inline data-URI placeholder or a single new static file under `src/web-ui/public/`, decided during implementation), not a new CMS/asset-pipeline.
- The mock's own tab-switching, multi-frame carousel interaction — explicitly replaced with a single GIF per the operator's own format decision above.
- Any other of the 3 remaining real screens (artefact viewer/dashboard/skill-session chat) — each has its own story or is already complete.
- Rewriting marketing copy elsewhere on the page.

## NFRs

- **Performance:** A GIF asset (once added) must not meaningfully regress page-load time — this is the first page a prospective user loads. The placeholder shipped by this story is not itself a performance risk (no real media file yet); flag real-GIF file-size budgets as a consideration for the follow-up story that adds the real asset.
- **Security:** None identified — a static image/GIF asset introduces no new data flow or user input.
- **Accessibility:** WCAG 2.1 AA (per `product/constraints.md` #9) — the placeholder and any future GIF must have appropriate `alt` text; an autoplaying/looping GIF must not violate WCAG's flashing-content guidance (no more than 3 flashes per second) — flag as a check for the follow-up story once a real asset exists, verify the placeholder itself has no such issue now.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

<!-- Well understood: the target file, token system, and layout conventions are all already established by dsa-s3's own delivery. The only real unknown is the exact placeholder implementation approach (inline vs. static file), a small, bounded decision to make during implementation, not a source of real ambiguity. -->

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
