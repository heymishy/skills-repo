## Story: Handoff to short-track pipeline + post-fix confirmation

**Epic reference:** artefacts/2026-11-08-incident-triage-and-respond/epics/itar-e1-triage-and-respond.md
**Discovery reference:** artefacts/2026-11-08-incident-triage-and-respond/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-incident-triage-and-respond/benefit-metric.md

## User Story

As a **delivery engineer responding to an alert**,
I want to **hand off an incident's triage context into the existing short-track pipeline, and get the incident record updated once the fix is confirmed**,
So that **I don't manually re-check logs myself, and the loop actually closes instead of leaving a confirmed bug like `tenant_admin_bootstrap_failed` unfixed with nothing tracking whether a future fix even worked**.

## Benefit Linkage

**Metric moved:** Handoff + post-fix confirmation
**How:** This story is the only mechanism that can deliver "100% of incidents that reach a merged fix get a confirmation status recorded" — stories 1–3 create and surface the record, but nothing closes the loop back to it without this story.

## Architecture Constraints

- Attaches context to the *existing*, unmodified short-track pipeline (`/test-plan → /definition-of-ready → coding agent → /definition-of-done`) — this story does not add new fix/test/promote mechanics, per the discovery's own Out of Scope.
- Post-fix confirmation has two paths, per the discovery's own resolved assumption: automated re-check where initiative 2's detection already exists for this incident's original trigger, or manual confirm otherwise (the only option today, since initiative 2 hasn't shipped — not a fallback-of-convenience). The implementation plan must name both paths as explicit, separate branches, not a single assumed-automated path.
- `product/constraints.md` #13: the test plan must assert the incident record's confirmation status field was actually updated when a linked story reaches DoD — not just that a handoff instruction was followed.
- `product/constraints.md` #12 (forward-looking, not yet active): if this story's handoff or confirmation ever posts via initiative 2's Teams adapter once that exists, the same credential-storage rule applies — noted here so it isn't missed when that integration point is eventually wired, not an open question for this story's own MVP scope (which doesn't yet post to Teams).

## Dependencies

- **Upstream:** itar-s1 (the record this story links to and updates), itar-s2 (the triage summary this story attaches at handoff).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given an incident record has a triage summary, When a human decides to act on it, Then a short-track story is created with the triage summary's context (known prior incidents, suggested next step) attached — e.g. referenced in the story's own discovery-equivalent context or DoR notes — and the incident record is updated to link that story's slug.

**AC2:** Given a story linked to an incident record reaches `dodStatus: complete`, When this story's post-fix check runs, Then it attempts to re-run the incident's original triggering check if an automated one exists (from initiative 2, once shipped) — and if none exists yet, prompts for a manual confirm step instead, per the discovery's own accepted MVP fallback.

**AC3:** Given either confirmation path (automated re-check or manual confirm) completes, When the result is known, Then the incident record's status is updated to `confirmed` or `not-confirmed` accordingly — never left at its pre-fix status once a linked story reaches DoD, which would silently misrepresent the incident as still being investigated.

**AC4:** Given the confirmation result is `not-confirmed` (the fix didn't actually resolve the original symptom), When this is recorded, Then the incident record remains open/flagged rather than being closed — the fix attempt is logged as tried-but-unsuccessful, giving the next triage attempt real prior-incident context instead of a falsely-closed record.

## Out of Scope

- Any new automated detection mechanism for the re-check — reuses whatever initiative 2 eventually ships; this story does not build detection itself.
- Posting confirmation results to Teams or any chat channel — not yet wired; noted as a forward-looking constraint above, not built now.
- Long-term/delayed re-measurement of whether a confirmed fix continues to hold weeks later — initiative 5's post-DoD follow-through territory.

## NFRs

- **Performance:** Not applicable — a bounded, triggered check at DoD time, not a standing process.
- **Security:** None beyond itar-s1's existing data handling; the forward-looking Teams-credential note above applies only once that integration is actually built.
- **Accessibility:** Not applicable — no UI in this story.
- **Audit:** The confirmation status and its timestamp, recorded on the incident record itself, are the audit trail — directly feeding this metric's own measurement method (count of DoD-complete, incident-linked stories cross-checked against confirmation status).

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
