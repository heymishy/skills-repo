# Decisions: Landing Page Hero Features

Architectural and scope decisions for `2026-08-08-landing-page-hero-features`, logged per CLAUDE.md's mandatory decisions.md rule.

---

## D1 — Landing page keeps its own self-contained visual identity, does not adopt `html-shell.js`'s shared design tokens

**Date:** 2026-08-08 (/definition)
**Context:** `templates/landing.html` has always had its own self-contained `<style>` block (dark theme, GitHub-style palette), separate from the authenticated app's shared `DESIGN_SYSTEM_CSS` custom properties in `html-shell.js`. This epic adds substantial new hero content to the page, raising the question of whether to harmonize with the shared design system (consistent with the rest of the authenticated app) or keep the landing page's own established identity.
**Decision:** Keep the landing page's existing self-contained style block. New hero-section CSS extends it in the same pattern, rather than adopting `html-shell.js`'s shared tokens.
**Rationale:** The landing page is a deliberately distinct pre-auth marketing surface (common practice for landing pages to differ visually from an authenticated app shell) — this was already the established choice at `lab-s1.2` (2026-07-01), not an oversight. Harmonizing it now would be a visual-identity redesign, which was never scoped in discovery/benefit-metric/epic — doing so here would be scope creep. It also sidesteps entirely the class of bug found and fixed in `kbsf-s1` this same day (CSS custom properties referenced without being defined), since the landing page never depends on `html-shell.js`'s tokens in the first place.
**Revisit trigger:** If a future discovery explicitly scopes a landing-page visual-identity redesign (not just content additions), revisit whether shared tokens should be adopted then.

---

## D2 — Golden-trace demo candidate selection: build-time swappable comparison, then delete the loser

**Date:** 2026-08-08 (/discovery, /clarify)
**Context:** Two real candidate features (`interactive-kanban-boards`/`s3.1` and `code-shape-diagrams`/`csd-s2`) were both evaluated as the golden-trace demo's content source. Rather than picking one from static screenshots, the operator wanted to compare both by seeing them live.
**Decision:** Build both candidates' 4-frame content behind a one-line build-time config flip, compare in a real running/preview build, then delete the losing candidate's content entirely before merge. No lasting toggle, config flag, or content-management capability ships to production.
**Rationale:** Confirmed via `/clarify` (2026-08-08, Q1) — this is the smallest mechanism that lets a real side-by-side comparison happen without building a general-purpose content-swap feature that would outlive its one-time purpose. Matches the "no CMS/editable content" scope boundary already set in discovery.
**Revisit trigger:** None expected — this decision resolves once one candidate is locked and the other deleted (tracked via `lphf-s1` AC3).

---

## D3 — Golden-trace demo is a static, curated snapshot — not a live query against pipeline state, and not live LLM generation

**Date:** 2026-08-08 (/discovery)
**Context:** The demo could show either (a) a pre-baked, curated snapshot of a real completed feature's chain, or (b) a live view that queries `pipeline-state.json`/GitHub in real time for an unauthenticated visitor, or (c) an interactive flow where a visitor types their own problem statement and watches discovery happen live.
**Decision:** Static, curated snapshot only (option a). Options (b) and (c) are explicitly out of scope.
**Rationale:** Live querying (b) requires new public read-only endpoints, rate-limiting, and cache-invalidation concerns not needed to prove the concept. Live generation (c) means unauthenticated visitors triggering real LLM calls — a materially different, much larger feature with cost and abuse-vector exposure that doesn't belong in a landing-page redesign. Confirmed via `/clarify` (2026-08-08) and logged in discovery's Out of Scope section.
**Revisit trigger:** If real usage data later shows visitors specifically asking "can I try this myself right now," a live-trial/sandbox mode would be its own separate discovery — not a retrofit of this static demo.
