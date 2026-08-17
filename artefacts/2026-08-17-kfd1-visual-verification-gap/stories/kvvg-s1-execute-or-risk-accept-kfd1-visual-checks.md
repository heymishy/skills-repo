## Story: Execute kfd1's unexecuted manual visual-verification scenarios, or log an explicit RISK-ACCEPT

**Epic reference:** None — short-track, closing a self-documented gap from `kfd1` (`2026-06-17-kanban-feature-detail-cx`)
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As a **platform maintainer**,
I want **`kfd1`'s AC3/AC4 CSS-layout-dependent qualitative requirements (kanban detail pages "reading as" the rest of the platform, markdown legibility, table/spacing) either actually verified or explicitly RISK-ACCEPTed**,
So that **a DoR-accepted verification plan that was never executed doesn't sit indefinitely as an invisible gap between "looks probably fine" and "confirmed correct"**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track gap-closure) — closes a process gap self-documented in `kfd1`'s retroactive DoD (written 2026-08-17): the DoR accepted "manual verification scenarios cover the visual gaps" as mitigation for AC3/AC4's qualitative requirements, but `verification-scripts/kfd1-kanban-card-and-detail-page-cx-verification.md` Scenarios 5-7 were never executed (every checkbox blank, every Notes field empty), no Playwright visual-regression spec covers `.sw-card`/`.sw-doc`/`.sw-section-title`, and no `decisions.md` RISK-ACCEPT was logged for this feature — directly violating this repo's own CLAUDE.md standard ("CSS-layout-dependent ACs must be classified at DoR time (B2)": every such AC needs either an automated visual-regression test or an explicit RISK-ACCEPT + smoke-test action item; neither exists here).
**How:** Either outcome (real verification, or an explicit accepted risk) is better than the current silent, undocumented gap — this closes the process violation, not necessarily a real defect (the feature has been live ~2 months with no reported visual issues).

## Architecture Constraints

- Reuse the exact scenarios already written in `artefacts/2026-06-17-kanban-feature-detail-cx/verification-scripts/kfd1-kanban-card-and-detail-page-cx-verification.md` (Scenarios 5, 6, 7) — do not redesign the verification approach, just execute it (or formally supersede it with an automated visual-regression spec, per the two acceptable paths named in CLAUDE.md's B2 rule).
- If choosing the automated-test path: follow the existing Playwright spec conventions already used elsewhere in `tests/e2e/` for this repo, targeting `.sw-card`, `.sw-doc`, `.sw-section-title` rendering on the kanban detail pages.
- If choosing the RISK-ACCEPT path: the entry must go in a `decisions.md` for this feature (create one if it doesn't exist) plus a corresponding post-deployment smoke-test action item in `workspace/state.json` `pendingActions`, per CLAUDE.md's B2 rule exactly.

## Dependencies

- **Upstream:** `kfd1` (merged, PR #388) — this story closes a gap that story's own retroactive DoD (2026-08-17) surfaced.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `kfd1`'s verification-script Scenarios 5, 6, and 7 (qualitative "reads as one system," markdown legibility, table/spacing), When this story is executed, Then either (a) all three are actually run against current production and their result checkboxes/Notes fields are filled in with real findings, or (b) an automated Playwright visual-regression spec is written covering `.sw-card`/`.sw-doc`/`.sw-section-title` rendering and passes.

**AC2:** Given the chosen path in AC1, When it reveals a real visual defect, Then that defect is documented as a new finding (not silently fixed inline) for separate triage — this story's scope is closing the verification gap, not fixing unknown-in-advance visual bugs.

**AC3:** Given the chosen path in AC1 is manual verification (not automated), When it completes, Then an explicit RISK-ACCEPT entry is logged in `artefacts/2026-06-17-kanban-feature-detail-cx/decisions.md` (created if absent) per CLAUDE.md's B2 standard, plus a corresponding smoke-test action item in `workspace/state.json` `pendingActions`.

## Out of Scope

- Redesigning or expanding the kanban/detail page UI itself — this story only closes a verification-process gap, not a design change.
- Any other feature's similar unexecuted-verification gaps — scoped to `kfd1` only; if this pattern recurs elsewhere, that's a separate finding.

## NFRs

- **Performance:** None identified.
- **Security:** None identified.
- **Accessibility:** Not applicable — verification only, no UI change.
- **Audit:** None new.

## Complexity Rating

**Rating:** 1 — either executing 3 already-written manual scenarios or writing one small Playwright spec; low ambiguity.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
