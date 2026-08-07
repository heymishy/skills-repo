## Story: NFR-security review and hardening pass for Admin User Impersonation

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-d-admin-user-impersonation.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **Hamish King (Founder/Operator, accountable for this platform's security posture as its sole operator)**,
I want **an explicit, documented security review of the impersonation feature before it's considered done — not just passing story-level tests**,
So that **the highest-risk item in this entire redesign (per discovery's own flagged risk) gets scrutiny proportionate to its risk, not the same default level of review as a nav-link fix**.

## Benefit Linkage

**Metric moved:** Privilege leakage during impersonation (risk metric)
**How:** This story is the review itself — it doesn't add new user-facing behaviour, it verifies D1–D3's implementation actually achieves the 0-leakage target the metric commits to, and hardens any gap found.

## Architecture Constraints

- This story runs after D1, D2, and D3 are implemented, not concurrently — it reviews real code, not a design.
- Reviewer is the operator themselves (no separate security team exists on this platform, per discovery's Constraints) — this story's rigor comes from a structured checklist, not from a second independent reviewer.

## Dependencies

- **Upstream:** D1, D2, D3 must all be implemented (though not necessarily merged) before this review can run against real code.
- **Downstream:** None — this is the epic's final story; Definition of Ready for the whole epic should not sign off until this story's findings are resolved.

## Acceptance Criteria

**AC1:** Given every existing admin-gated route/nav-item/settings-tab in the app (not only the ones newly built in Epic D), When audited against effective-role visibility (D2's core property), Then each one is confirmed to check the impersonated session's effective role, not the real admin's underlying role — with each route/surface explicitly listed as checked, not asserted in general terms.

**AC2:** Given the session-swap mechanism implemented in D1, When reviewed line-by-line, Then it is confirmed that no residual real-admin session state (role, elevated permissions, cached data) survives into the impersonated session, and no residual target-user state survives after exit (D2's AC4).

**AC3:** Given a concurrent-request scenario (two requests arriving during the moment of session swap), When tested directly (not just reasoned about), Then no request observes an inconsistent or mixed session state (e.g. real admin's tenantId paired with target's role, or vice versa).

**AC4:** Given the audit log (D3), When reviewed against the confirmed /clarify decision (admin-visible only, indefinite retention, no notification), Then the actual implementation matches that decision exactly — no accidental broader exposure (e.g. a debug endpoint that leaks audit entries without the `requireAdmin` gate).

**AC5:** Given any gap found in AC1–AC4, When identified, Then it is fixed before this story (and therefore the epic) is considered complete — this review is a gate, not a report that can be filed with open findings.

## Out of Scope

- Time-limiting or step-up re-authentication hardening — confirmed out of scope at the epic level; this review confirms the MVP's actual security properties, it does not expand scope to add new hardening beyond what discovery committed to.
- A second independent human reviewer — not available on this platform; explicitly noted as a real constraint, not silently worked around.

## NFRs

- **Performance:** N/A — this story is a review activity, not a runtime change (except where AC5 requires fixing a found gap).
- **Security:** This story's entire subject is security — see ACs above.
- **Accessibility:** N/A.
- **Audit:** This review's findings and resolutions must themselves be recorded in `decisions.md` for this feature, per this repo's own established practice of logging architectural/security decisions.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — the review's scope is fixed (D1–D3's implementation); what's unstable is only how much hardening work AC5 turns up, which is bounded by definition to "fix what's found," not open-ended.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
