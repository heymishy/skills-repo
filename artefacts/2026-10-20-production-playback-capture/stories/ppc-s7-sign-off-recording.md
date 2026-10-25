# Story: Record an in-app sign-off decision on captured evidence

**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Discovery reference:** artefacts/2026-10-20-production-playback-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-10-20-production-playback-capture/benefit-metric.md
**Domain:** [web-ui]

---

## Background

The CX/UX spike (`artefacts/2026-10-20-production-playback-capture/spikes/cx-ux-playback-pattern-outcome.md`, 2026-10-26) found that every approval-workflow and UAT-sign-off source researched converged on the same structural element — a recorded decision tied to a named approver and the exact evidence version it was made against — yet no story in this epic (`ppc-s1`–`ppc-s6`) builds one. The epic's own goal statement ("evidence viewed, sign-off decision made") was, until now, satisfied only by the PO deciding off-platform. `benefit-metric.md`'s own Metric 2 ("Time to DoD sign-off") already claimed to measure "time to... recording a sign-off decision," but its real measurement method only captured a page-view event, because no decision was ever actually recorded — an overclaim this story resolves rather than works around.

Direct code inspection (this story's own `/definition` session) confirmed the reusable building blocks:
- `admin-credits.js`'s own `adminId` resolution pattern (`req.session.login || req.session.userId`, never `req.session.accessToken` — CLAUDE.md's canonical-field rule) is the established identity-for-audit-trail pattern in this codebase; this story reuses it for the sign-off `by` field rather than inventing a new identity mechanism.
- `journeys.data` is a JSONB blob with an explicit allowlist in `journey-store-pg.js`'s `_sanitise()` (the `fdn-s1` rule) — `ppc-s1`'s `captureTargets`, `ppc-s2`'s `captureAllDuration`, and `ppc-s4`'s `pipelineStateStorySlugs` are all direct precedent for adding a new field this way. No new table or migration is needed; a `signOff` field follows the identical pattern.
- ADR-025 tenant/product scoping applies identically to this write as to every other `ppc` write — no new access-control mechanism is needed, the existing guard is reused as-is.

## User Story

As a **tenant Product Owner**,
I want to **record my sign-off decision (Approved / Needs changes) directly on the capture-evidence page, tied to my identity and the exact evidence coverage I saw when I decided**,
So that **the decision is a durable, visible record instead of something that only happened off-platform and is invisible to anyone who looks at the feature later**.

## Benefit Linkage

**Metric moved:** m2 (Time to DoD sign-off) — directly. This story is what makes Metric 2's own stated measurement ("time to... recording a sign-off decision") actually true, replacing the page-view proxy it was using. **Also moves:** m1 (Self-service DoD validation adoption) — a visible decision record is itself evidence the self-service loop was used end-to-end, not just opened.

## Architecture Constraints

- Identity resolution reuses `req.session.login || req.session.userId` exactly as `admin-credits.js`'s `adminId` pattern does — never `req.session.accessToken` (CLAUDE.md mandatory canonical-field rule).
- The decision is stored in `journeys.data.signOff` — add it to `journey-store-pg.js`'s `_sanitise()` allowlist (`fdn-s1` rule: an unlisted field silently vanishes after a Postgres-backed restart). No schema migration.
- ADR-025: the write and the read both filter by the same `tenant_id`/`product_id` pair as every other `ppc` route — reuses the existing access-control guard, does not introduce a new one.
- NFR-Accessibility (carried from `ppc-s1`/`ppc-s6` precedent): the sign-off form uses plain `<form>`/`<button>` elements, no client-side JS required.

## Dependencies

- **Upstream:** `ppc-s1` (the page this adds a sign-off action to), `ppc-s6` (the dashboard-shell/coverage-summary page the sign-off area is placed alongside) — both must be in place for this story's ACs to have a page and a coverage line to reference.
- **Downstream:** `benefit-metric.md`'s Metric 2 measurement method is updated as part of this same `/definition` session (see that artefact) to use this story's own decision-recorded event instead of the page-view proxy.

## Acceptance Criteria

**AC1:** Given a PO is viewing the capture-evidence page for one of their own features, When the page renders, Then a sign-off action area shows two choices — "Approve" and "Needs changes" — plus an optional free-text comment field, using the same plain `<form>`/`<button>` pattern as the existing capture-trigger forms.

**AC2:** Given the PO submits a sign-off decision, When the form posts, Then the decision is written to `journeys.data.signOff` as `{ status: 'approved' | 'needs-changes', by, at, comment, coverageSnapshot }` — `by` resolved via `req.session.login || req.session.userId` (never `accessToken`), `at` a UTC timestamp, `coverageSnapshot` the AC coverage summary at the moment of decision (e.g. "7 of 7 ACs captured") — scoped to the same `tenant_id`/`product_id` as every other `ppc` write.

**AC3:** Given a sign-off decision already exists for this feature, When the PO (or anyone else with access) reloads the page, Then the recorded decision — status, who, when, and the coverage snapshot it was made against — renders near the existing coverage line, so a later viewer sees it was already decided without re-deriving anything.

**AC4:** Given a sign-off decision already exists and new evidence is captured afterward (e.g. the PO re-runs capture-all), When the page renders, Then the existing recorded decision stays visible but is explicitly marked with the coverage snapshot it was recorded against (e.g. "Approved against 5 of 7 ACs") — it must never silently imply it covers evidence captured after the decision was made.

**AC5:** Given the sign-off submit request, When it is handled, Then it passes through the same tenant/product access-control check as every other `ppc` write (ADR-025) — a PO cannot record a decision for a feature outside their own tenant/product, verified by a dedicated test mirroring `ppc-s1`'s own access-control test pattern.

**AC6:** Given no sign-off decision exists yet for a feature, When the PO views the page, Then the sign-off area's empty state reads unambiguously ("No decision recorded yet") — never blank, and never visually indistinguishable from a recorded "Approved" state (applies the same empty-state-specificity finding `ppc-s6` AC4 already applies).

## Out of Scope

- Editing or retracting a previously recorded decision — once recorded, it is a permanent entry; recording a *new* decision later (if circumstances change) is a fast-follow, not built here.
- Multi-approver workflows requiring more than one PO's sign-off — single-decision-maker only, matching this epic's existing single-PO-per-tenant framing.
- Notification/alerting when a decision is recorded (e.g. emailing an engineer) — no such mechanism exists elsewhere in `ppc`; not building one now.
- Any change to how `/discovery`'s DoD-complete status itself is derived — this story only records a human decision alongside it, it does not feed back into `dodStatus`.

## NFRs

- **Performance:** One additional JSONB write on form submit — same cost class as `ppc-s2`'s existing `captureAllDuration` write, no new infra.
- **Security:** Identity resolved via `req.session.login || req.session.userId`, never `accessToken` (CLAUDE.md canonical-field rule); ADR-025 tenant/product scoping identical to every other `ppc` write (AC5).
- **Accessibility:** Plain `<form>`/`<button>` elements, no client-side JS required (AC1) — matches `ppc-s1`/`ppc-s6`'s own keyboard-operable precedent. Empty-state specificity per AC6.
- **Audit:** This story is itself the audit mechanism closing `benefit-metric.md` Metric 2's own measurement gap — no separate audit requirement beyond what AC2/AC3 already store and display.

## Complexity Rating

**Rating:** 2
<!-- Some ambiguity, known unknowns — the stale-decision edge case (AC4) and the new JSONB field need real design during implementation, even though the underlying mechanisms (identity resolution, JSONB allowlist writes, tenant-scoped access control) are all proven elsewhere in this codebase. -->
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
