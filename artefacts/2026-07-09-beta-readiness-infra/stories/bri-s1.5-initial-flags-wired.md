## Story: Create and wire the 3 initial flags across both projects

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-1-feature-flags.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

**Correction (2026-07-09, post-/review):** the original brief named `model-routing-glm52` and `billing-v2` as illustrative placeholder flag names — neither a GLM-5.2 model route nor a v2 billing flow exists anywhere in the codebase (confirmed by repo-wide search). Replaced with 2 real, already-shipped UI surfaces so every AC in this story is concretely testable now: `product-kanban-view` (gates `handleGetProductKanban`) and `org-kanban-view` (gates `handleGetOrgKanban`), alongside `wizard-ui`.

## User Story

As **Hamish (Founder/Operator)**,
I want the 3 named flags (`wizard-ui`, `product-kanban-view`, `org-kanban-view`) created in both PostHog projects and actually wired to gate real, already-shipped app behaviour,
So that flag toggling is proven end-to-end with real features, not just the abstract mechanism from S1.1–S1.4.

## Benefit Linkage

**Metric moved:** Metric 2 — Feature flags toggle without a redeploy
**How:** This is the story where the metric becomes concretely measurable — 3 real flags, each demonstrably togglable without a deploy, is the direct evidence the metric requires.

## Architecture Constraints

- Depends on S1.1–S1.4 (helper, project separation, bootstrap, tenant targeting) all being in place first.
- D37: each flag check in application code goes through the shared `isEnabled()` helper — no flag-specific bespoke evaluation logic.

## Dependencies

- **Upstream:** S1.1, S1.2, S1.3, S1.4 — all four must be complete before this story can wire real behaviour to real flags.
- **Downstream:** None within this epic. Sub-feature 2 (staging) benefits from having a real flag to test the staging promote-gate against.

## Acceptance Criteria

**AC1:** Given the `wizard-ui` flag is created in both the staging and prod PostHog projects, When it's toggled off, Then the wizard canvas UI element it gates does not render; when toggled on, Then it does render — verified in both environments independently.

**AC2:** Given the `product-kanban-view` flag is toggled off, When a tenant navigates to the product Kanban board, Then `handleGetProductKanban` returns a not-found/disabled response instead of rendering the board; when toggled on, Then the board renders normally — with no redeploy between toggles.

**AC3:** Given the `org-kanban-view` flag is toggled on for a specific tenant, When that tenant navigates to the org Kanban board, Then `handleGetOrgKanban` renders it; other tenants (flag off) receive a not-found/disabled response — proving the tenant-level targeting from S1.4 works with a real, customer-facing flag.

**AC4:** Given all 3 flags exist in the staging project, When the staging project's flag list is compared to the prod project's, Then all 3 flags exist by the same name in both — "mirrored across both projects" as named in discovery.

## Out of Scope

- Any 4th flag beyond the 3 named — additional flags are created ad hoc post-MVP as needed, not part of this story.
- Automated flag-parity checking between projects (e.g. a CI check that fails if staging and prod flag lists diverge) — manual verification is sufficient for MVP; automation is a future enhancement.

## NFRs

- **Performance:** None beyond S1.1/S1.3's existing budgets.
- **Security:** `org-kanban-view` gating must not expose org Kanban data for a tenant it isn't targeted at, even transiently — verified via the same tenant-isolation guard (ADR-025) as any other tenant-scoped surface.
- **Accessibility:** The `wizard-ui` gated element, when rendered, meets the same WCAG 2.1 AA bar as the rest of the wizard canvas (no new exemption introduced by flag-gating).
- **Audit:** None identified beyond S1.1.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
