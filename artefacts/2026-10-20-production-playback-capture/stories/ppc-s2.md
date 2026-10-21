# Story: Extend to full-feature capture loop with timing validation

> **Revised 2026-10-21, post-/review Run 1 (finding 1-H1, inherited from `ppc-s1`):** `ppc-s1`'s AC2 was revised to use one-time manual target entry per AC rather than an (unproven, non-generalising) auto-derivation mechanism. This story's loop now explicitly accounts for ACs that may not yet have a stored target (AC6 below) — see `decisions.md`'s 2026-10-21 DESIGN entry.

**Epic reference:** `artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md`
**Discovery reference:** `artefacts/2026-10-20-production-playback-capture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-10-20-production-playback-capture/benefit-metric.md`
**Domain:** `[web-ui]`

## User Story

As a **Tenant Product Owner**,
I want to **trigger capture for all of a feature's acceptance criteria in one action, with a loading state while it runs**,
So that **I can review a whole feature's evidence and sign off in a single sitting, instead of triggering each AC one at a time.**

## Benefit Linkage

**Metric moved:** Time to DoD sign-off (Metric 2)
**How:** The single-sitting sign-off target can't be met by `ppc-s1`'s per-AC trigger alone — this story is what actually lets a Product Owner review a whole feature's evidence in one pass.

## Architecture Constraints

- Builds directly on `ppc-s1`'s session-reuse auth mechanism and tenant-scoped surface — no new architecture decisions introduced here.
- Per `discovery.md`'s trigger-mechanics decision, capture stays **synchronous** for this story. Do not silently introduce a job queue or async mechanism even if timing (AC3/AC4 below) suggests it's needed — raise it as a SCOPE decision instead (see AC4).
- Must comply with ADR-018 (Playwright is the E2E framework; `NODE_ENV=test` auth-bypass fixtures are test-fixture-layer only — this story's capture loop must drive the real session, never the bypass) and ADR-025 (multi-tenancy enforced at the application layer via `tenant_id`/`product_id` scoping, inherited unchanged from `ppc-s1`'s access-control check).

## Dependencies

- **Upstream:** `ppc-s1` must be DoD-complete — this story extends its single-AC mechanism to the full set of ACs.
- **Downstream:** None within this epic.

## Acceptance Criteria

**AC1:** Given a tenant's Product Owner is viewing a DoD-complete feature with N acceptance criteria (N>1) on the new surface, When they click a single "Capture all evidence" action, Then the system sequentially captures a screenshot for every AC that already has a stored capture target (per `ppc-s1` AC2), using the same session-reuse mechanism, with no per-AC manual trigger required.

**AC2:** Given the "Capture all evidence" action has been triggered, When the capture is running, Then the UI displays a loading state (e.g. "capturing AC 3 of 8") until all captures complete, and a second concurrent "Capture all evidence" trigger for the same feature is blocked while one is already in progress.

**AC3:** Given the capture-all action has completed against a real feature with its real AC count, When the elapsed wall-clock time is measured, Then it is recorded as this story's own DoD evidence — not estimated — so the synchronous-vs-async decision from `discovery.md` can be confirmed or revisited with real data.

**AC4:** Given the measured capture time from AC3 exceeds 60 seconds for a real feature, When this is discovered, Then the story's DoD does not silently ship synchronous capture as "done" — a SCOPE note is logged in `decisions.md` flagging that async should be revisited, per `discovery.md`'s own named trigger condition.

**AC5:** Given one AC's capture fails mid-loop (e.g. the target screen errors or times out), When the Product Owner views the results, Then the ACs that succeeded still display their captured screenshots, and the failed AC shows a clear retry option — one failure does not discard the whole feature's results.

**AC6:** Given a feature has one or more ACs with no stored capture target yet (per `ppc-s1` AC2/AC4), When the "Capture all evidence" action runs, Then those ACs are skipped with a clear, named indicator identifying which specific ACs were skipped and why — not a silent omission, and not a failure that blocks capturing every other AC in the same run.

## Out of Scope

- Rate limiting the capture-trigger endpoint — `ppc-s3`.
- Building an async job queue — only ever a new story if AC4's trigger fires; never built silently inside this one.
- Video capture, automated redaction, and ffmpeg presentation polish — epic-level out of scope (fast-follow).

## NFRs

- **Performance:** capture time is measured and reported as real DoD evidence (AC3); target informed by `discovery.md`'s ~30-60 second threshold — this story establishes the real number rather than assuming one.
- **Security:** inherits `ppc-s1`'s session-handling constraint unchanged — no new exposure since this reuses the same mechanism in a loop.
- **Accessibility:** the progress indicator must be exposed to assistive technology (e.g. an `aria-live` region announcing progress), not purely visual.
- **Audit:** none identified beyond `ppc-s1`.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — AC4 is a designed internal trigger for re-opening scope if real timing data demands it, not a sign of instability.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
