# Decisions: Product-aware navigation

---

**Decision:** GAP — no discovery artefact for this feature
**Date:** 2026-07-30
**Context:** Short-track path (per CLAUDE.md) intentionally skips `/discovery` through `/review` for bugs, small fixes, and bounded refactors.
**Decision:** Proceed without a discovery artefact. H-GOV is acknowledged as a structural short-track exception, not an oversight.
**Rationale:** Scope was fully validated through a design mockup (published artifact `eec7406c-b509-424d-a5b8-2dcb0715935a`) that the operator explicitly approved before this story was written, including a live mid-conversation refinement (products listed directly in the sidebar rather than behind a generic Home page). This gives the same scope-validation confidence a discovery artefact would, in a lighter-weight form appropriate for a UX/nav change.

---

**Decision:** Bounded wiring — only 3 of ~63 `renderShell` call sites get the live products sidebar list in this story
**Date:** 2026-07-30
**Context:** `renderShell` is called from roughly 63 places across this codebase (37 in `journey.js` alone). The design mockup shows the products list persisting on every page, which would imply wiring all 63.
**Decision:** Wire only `handleGetDashboard`, `handleGetProductView`, and `handleGetJourney` — the 3 primary entry-point pages. All other call sites (skill-session chat views, admin pages, artefact views, the roadmap page, etc.) are left unchanged; their sidebars render without a Products section, exactly as today.
**Alternatives considered:** Wire every call site in this one story — rejected as disproportionate risk for a single short-track pass (Complexity would push well past 3, and regressing any of ~60 rarely-touched pages is a real risk with no corresponding test-plan value, since most of those pages are reached only after already being inside a product/journey context where the missing sidebar list is a minor, not a functional, gap).
**Rationale:** The 3 wired pages cover every path an operator takes to *start* navigating (dashboard, a specific product, the no-product bucket) — the actual friction point identified. Deep/nested pages a user reaches only after already choosing a product don't carry the same "where do I go next" ambiguity the mockup was designed to fix.
**Made by:** Claude (agent), during story authoring, 2026-07-30
**Revisit trigger:** If operator feedback shows the missing Products section on unwired pages (e.g. a skill-session chat view) is itself confusing, wire additional call sites as a follow-up story — not by expanding this one's scope after the fact.
