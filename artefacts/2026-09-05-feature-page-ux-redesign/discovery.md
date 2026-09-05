# Discovery: Feature-detail page UX redesign

**Status:** Approved
**Created:** 2026-09-05
**Approved by:** Hamish King — Operator/Engineer — 2026-09-05
**Author:** Claude Code (agent, operator-directed — Hamish King)

---

## Problem Statement

The feature-detail page (`GET /features/:slug`, `src/web-ui/routes/features.js`) mixes two visually inconsistent rendering conventions on one page. The feature-level artefact list (top) uses the shared `.sw-card`/`.sw-section-title` design-system classes. The per-story breakdown added later by `fapg-s1` (bottom, `renderGroupedArtefactIndexHtml`) uses plain, ad-hoc-inline-styled `<details>`/`<summary>` accordions that were never wired into that design system. An operator scanning a multi-story feature (e.g. `2026-06-22-wuce-multi-tenancy`, 20+ stories across 5 phases) hits a visible style seam partway down the page. Separately, the navigation path an operator takes to reach this page in the first place (from the dashboard, a product page, or a story's own DoD) has not been reviewed for clarity or friction.

## Who It Affects

Primary personas (per `product/mission.md`): **Developer/Engineer** and **Tech Lead**, using the web UI to check pipeline/artefact state, find a specific artefact, or navigate into a story's own DoR/DoD/plan — trying to quickly orient, not read a design showcase.

Critically, during the platform's current **beta stage**, this page and its nav path are also seen by **prospective clients evaluating the product**. This persona is used to Apple-level UX/UI design and modern SaaS-grade polish — a visibly inconsistent or "unfinished-looking" screen reads as a quality signal about the whole product, not an isolated cosmetic detail.

## Why Now

This was explicitly deferred on 2026-08-31 during the `2026-08-31-web-ui-navigation-legibility` discovery, with the stated condition: "worth a dedicated UX review pass once specific defects on that page are identified" (`workspace/capture-log.md`, 2026-08-31 entry). That condition is now met — a concrete instance of the defect was found firsthand on a real multi-story feature page (`2026-06-22-wuce-multi-tenancy`) during independent verification of an unrelated production fix.

The stakes are higher than an internal papercut: the platform is in **active beta**, and this page/nav path is seen by prospective clients during evaluation. Average or inconsistent UX at this stage is a plausible **silent churn trigger** — a prospective client who finds the experience visibly unpolished may simply not convert, without ever stating why.

## MVP Scope

A redesigned `/features/:slug` page presenting one coherent, modern visual language end-to-end — eliminating the `.sw-card` → plain-`<details>` seam — plus a reviewed navigation path into it (from dashboard/product page/story DoD, plus a quick audit during `/definition` to confirm those are the exhaustive real entry points — not assumed complete at discovery time). **The visual-language decision (incremental token restyle vs. a materially new visual language) is deferred to an optional `/design` pass between `/benefit-metric` and `/definition`, rather than locked at discovery time** (resolved via /clarify — see Clarification log). Scoped to **this one page and its direct entry points only**. Done means: a beta-caliber visitor scanning a large multi-story feature (e.g. `wuce-multi-tenancy`) sees one coherent, modern design from top to bottom, and can reach it from the dashboard without a jarring or confusing hop.

## Out of Scope

- **Platform-wide design-system overhaul** — other pages (`/features` list, `/dashboard`, `/products/:id`, story detail pages, kanban board) are out of scope even where they share the same dated patterns; this initiative fixes the feature-detail page and its direct entry points only.
- **Backend/data changes** — `getFeatureStoryStructure`, `groupArtefactsByStory`, `_listArtefacts`, and the underlying artefact/story data model are unchanged; this is a rendering/CX-layer initiative only.
- **New functionality** — no new capabilities (inline editing, search/filter within the artefact list, the existing "Board" view toggle) are added; scope is redesigning what already exists into one coherent, polished surface, plus fixing the nav path to reach it.

## Assumptions and Risks

[ASSUMPTION] Prospective/beta clients see this specific `/features/:slug` page during evaluation — believed likely but not directly confirmed (no analytics or user-research evidence yet). Given this remains unverified, `/benefit-metric` should define its primary metric on a measurable proxy (e.g. the design-quality self-review bar in Success Indicator 2) rather than a direct client-conversion causal claim, until real usage data confirms or refutes this assumption.
There is no existing design-system/style-guide artefact to follow (confirmed via /clarify, 2026-09-05) — `CLAUDE.md`'s "Style guide"/"Pattern library" fields are correctly empty. This redesign is a blank slate for self-authored visual judgment against the existing token system, or for whatever `/design` proposes.
Whether to extend the existing `.sw-card`/`.sw-section-title` tokens or introduce a materially new visual language is deliberately left open (resolved via /clarify, 2026-09-05) — not an unconfirmed assumption baked into scope, but an explicit decision deferred to an optional `/design` pass, per the MVP Scope section above.

**Risk:** if the actual client drop-off driver during beta evaluation turns out to be something else entirely (pricing, missing features, unclear value proposition) rather than visual polish, this initiative fixes a real, confirmed defect but may not move the metric that motivated it. Visual polish is being treated as a plausible contributing factor, not a proven dominant one.

## Directional Success Indicators

1. **Visual consistency of `/features/:slug`:** Baseline: 1 visible style seam per multi-story feature page (the `.sw-card` → plain-`<details>` transition), confirmed on `2026-06-22-wuce-multi-tenancy`. Target: 0 — a single coherent visual language top to bottom. Measured via: manual/visual review (CSS-layout-dependent — to be classified at DoR per `CLAUDE.md`'s CSS-layout AC rule, as either a Playwright visual-regression test or a RISK-ACCEPT + manual smoke test).
2. **Perceived design quality ("Apple/SaaS-tier" bar):** Baseline: `[UNKNOWN BASELINE]` — no prior design-quality rating exists for this page. Target: the page passes a subjective "would a design-conscious evaluator consider this on par with a modern SaaS product" review by the operator, and/or any unprompted beta feedback confirms no negative reaction. Measured via: direct operator review post-implementation (same live-verification convention used for `stcs-s1`/`ptvs-s1` this session), plus any unprompted beta feedback if it surfaces.
3. **Nav path clarity:** Baseline: `[UNKNOWN BASELINE]` — no current friction log for how operators reach this page. Target: an operator can reach `/features/:slug` from the dashboard/product page in a number of clicks/decisions that feels obvious, with no confusing or dead-end hop. Measured via: direct click-through review of the current path(s) during `/definition`.

## Constraints

- **Accessibility floor is non-negotiable** (`product/constraints.md` #9): WCAG 2.1 AA minimum applies to the redesigned page regardless of visual treatment.
- **No CSS framework in the stack** — `src/web-ui` is raw Node `http.createServer()` with zero Express/React/Tailwind dependency; styling is hand-authored CSS-in-JS template strings using an existing CSS custom-property token set (`--ink`, `--muted`, `--line`, `--surface`, `--bg`, `--amber`, `--red`, etc.). The redesign works within this existing token system rather than introducing a new framework.
- **Playwright is the sole E2E framework** (ADR-018, `.github/architecture-guardrails.md`) — any CSS-layout-dependent AC this produces must be classified at DoR per `CLAUDE.md`'s own rule: automated Playwright visual-regression test, or RISK-ACCEPT + manual smoke test — never left unclassified.
- **No design tool/design artefact currently exists** to reference (`CLAUDE.md`'s "Pattern library"/"Style guide" fields are still `[FILL IN]`) — consistent with the assumption above; this redesign will be self-authored against the existing token system, following the precedent of prior web-ui redesign stories in this repo.
- No time/budget constraint beyond standard pipeline overhead — a short-track-sized visual/CX fix, not a multi-sprint programme.

## Contributors

- Hamish King — Operator/Engineer

## Reviewers

- None — solo operator session (contributor and approver are the same person, Hamish King, Operator/Engineer). No non-engineering reviewer available for this discovery; M3 (non-engineering outer loop attribution rate) is not measured for this feature.

## Approved By

Hamish King — Operator/Engineer — 2026-09-05

---

## Clarification log

[2026-09-05] Clarified via /clarify:
- Q: Incremental restyle of existing tokens, or a materially new visual language?  A: Let `/design` decide — deferred to an optional `/design` pass rather than locked at discovery time.
- Q: Can you confirm prospective clients actually see this specific page?  A: Unconfirmed but believed likely — `/benefit-metric` should use the design-quality self-review proxy (Success Indicator 2), not a direct client-conversion causal claim, until real usage data exists.
- Q: Is there an existing design reference (Figma, moodboard, competitor benchmark) to follow?  A: No — confirmed blank slate for self-authored visual judgment or a `/design` proposal.
- Q: Are dashboard/product-page/story-DoD the exhaustive real entry points into this page?  A: Not sure — worth a quick audit during `/definition` rather than assuming completeness now.

**Assumptions remaining open:** 1 (client-visibility of this page, deliberately left as a proxy-metric mitigation rather than fully resolved — see Assumptions and Risks section).
**Assumptions resolved this session:** 2 (design reference — confirmed none exists; visual-language direction — deferred to /design by design, not by default).

---

**Next step:** Human review and approval → /benefit-metric
