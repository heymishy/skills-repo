## Story: Reopen a completed stage's live session from the step-nav

**Epic reference:** `epics/reopen-and-revise-earlier-stage.md`
**Discovery reference:** `artefacts/2026-08-27-revise-earlier-stage/discovery.md`
**Benefit-metric reference:** `artefacts/2026-08-27-revise-earlier-stage/benefit-metric.md`
**Domain:** [web-ui]

## User Story

As an **Operator (solo product owner + engineer running the outer loop)**,
I want to **click a completed stage's step-nav link and land directly in that stage's live, resumable chat session instead of a static read-only view**,
So that **I can ask a follow-up question or request a revision without restarting the journey**.

## Benefit Linkage

**Metric moved:** Earlier-stage revisions completed without a journey restart
**How:** This story is the entry point — without a live session behind a done-stage link, no revision can happen at all, so it directly enables the metric's numerator.

## Architecture Constraints

- ADR-022: must extend the existing per-stage session model (one session per skill stage) — do not introduce a session-spanning mechanism.
- ADR-023: any handoff into the reopened session must inject the current on-disk artefact content via `priorArtefacts`, read via `fs.readFileSync` (disk canonicity) — not from in-memory `session.artefactContent`.
- ADR-024: `GET /api/journey/:id` response shape is a governed contract — verify `completedStages`, `stage`, and `stages[]` still satisfy existing consumers (breadcrumb, step-nav) after this change.
- Precedent: `kcrs-s1`/`adsr-s1`'s existing-session-first pattern (`getGetHtmlSession()` check before falling back to a fresh session) — reuse this pattern for the "does a resumable session already exist for this stage" check rather than reinventing it.
- ADR-018: any new browser-facing behaviour needs a `tests/e2e/` Playwright spec.

## Dependencies

- **Upstream:** None
- **Downstream:** res-s2 (artefact overwrite), res-s3/res-s4 (materiality flow) all build on this story existing

## Acceptance Criteria

**AC1:** Given a journey with a completed stage (e.g. discovery) whose session still exists in memory, When the operator clicks that stage's step-nav link, Then the browser lands on `/skills/:skill/sessions/:id/chat` for that stage's session — not the static `/journey/:id/stage/:skill` view.

**AC2:** Given a journey with a completed stage whose in-memory session no longer exists (server restart, session pruned), When the operator clicks that stage's step-nav link, Then a fresh session is created for that stage with the existing artefact content injected as `priorArtefacts` (per ADR-023), and the operator lands in that new live session.

**AC3:** Given the operator is in a reopened stage's live session, When they load `GET /api/journey/:id`, Then `stage` and `stages[]` are unchanged from before the reopen, and the relevant `completedStages` entry's `skillName`, `artefactPath`, and `completedAt` are unchanged — no entry is added, removed, or reassigned to a different stage. **Clarified at DoR (contract review):** if the reopen took AC2's fresh-session path, that entry's `sessionId` MAY update to point at the newly created session (so a subsequent reopen can use AC1's cheaper existing-session path instead of creating another fresh session every time) — this is the only field permitted to change, and only on the fresh-session path. On AC1's existing-session path, `sessionId` is also unchanged since no new session was created.

**AC4:** Given the step-nav renders stages the operator has NOT yet completed, When they view the step-nav, Then only stages already present in `completedStages` show the live-session link behaviour introduced by this story — a not-yet-reached future stage's link is unaffected.

## Out of Scope

- The artefact-index page's plain "View" link and any other entry point besides the step-nav — per discovery's clarification log, these stay pointed at the static read-only view.
- What happens to the artefact once the operator sends a revision turn — that's res-s2.

## NFRs

- **Performance:** Reopening a stage with an existing live session must not create a new session — zero additional session-creation round-trip, matching the `adsr-s1` precedent's performance rationale.
- **Security:** No new input surface — reuses the existing `getGetHtmlSession()` read-only lookup already used by `handleGetJourneyById`.
- **Accessibility:** None identified beyond existing step-nav link accessibility (unchanged markup pattern).
- **Audit:** A stage reopen fires a distinct audit/PostHog event (`earlier_stage_reopened`, per the benefit-metric M1 measurement method) so usage can be measured.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
