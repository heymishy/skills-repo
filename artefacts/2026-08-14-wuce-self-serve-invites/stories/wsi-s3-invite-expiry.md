## Story: Expired invites (past 24 hours) are rejected cleanly

**Epic reference:** artefacts/2026-08-14-wuce-self-serve-invites/epics/epic-1-self-serve-invite-flow.md
**Discovery reference:** artefacts/2026-08-14-wuce-self-serve-invites/discovery.md
**Benefit-metric reference:** artefacts/2026-08-14-wuce-self-serve-invites/benefit-metric.md
**Domain:** [auth]

## User Story

As a **teammate who received an invite email but didn't act on it in time**,
I want **a clear message telling me the invite expired, rather than a confusing failure**,
So that **I understand I need a new invite, instead of assuming something is broken**.

## Benefit Linkage

**Metric moved:** Time from invite creation to invitee access
**How:** This story is the security bound this feature's own /clarify decision established (`decisions.md`, Q4) in place of full invite-management (revoke/resend remain out of scope) — without it, an invite is effectively permanent, which the operator explicitly rejected.

## Architecture Constraints

- Extends `wsi-s2`'s own redemption check (the same code path that checks `redeemed_at IS NULL`) with an additional `expires_at > NOW()` condition — this is a refinement of `wsi-s2`'s logic, not a separate dispatcher branch or separate route.
- No new table or column — `expires_at` already exists on `team_invitations` from `wsi-s1`.

## Dependencies

- **Upstream:** `wsi-s1` (the `expires_at` column this story checks), `wsi-s2` (the redemption logic this story extends)
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given an invite whose `expires_at` has passed and has NOT been redeemed, When the invitee clicks the link, Then the acceptance is rejected with a clear "this invite has expired" message — not a generic error, not a silent failure.

**AC2:** Given an invite whose `expires_at` has passed, When the rejection occurs, Then no `team_memberships` row is created and the `team_invitations` row's `redeemed_at` remains `NULL` — an expired invite is never treated as successfully redeemed.

**AC3:** Given an invite that is still within its 24-hour window, When the invitee clicks the link, Then acceptance proceeds normally (unaffected by this story) — this is a regression guarantee, not just the expired-path's own correctness.

## Out of Scope

- **Any way to extend or renew an expired invite** — the admin must create a new invite; matching the epic's own Out of Scope (no resend/revoke management UI).
- **Configurable expiry duration** — the 24-hour window is fixed, per `decisions.md`'s Q4 resolution; making it configurable is a future refinement, not this story.

## NFRs

- **Performance:** Not applicable beyond `wsi-s2`'s own existing performance profile — this is a single additional timestamp comparison.
- **Security:** An expired invite must never be redeemable under any circumstance, including a race between "about to expire" and a concurrent accept attempt — the expiry check and the atomic redemption check happen together, not as separate, independently-racy steps.
- **Accessibility:** The expired-invite error message is real, readable text — not just an HTTP status code with no explanation.
- **Audit:** Not required beyond `wsi-s2`'s own existing audit logging — an expired-invite rejection is not itself a state change worth a separate audit log entry.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
