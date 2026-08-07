## Story: Persistent viewing-as banner, exit flow, and permission-scoped visibility

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-d-admin-user-impersonation.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **Hamish King (Founder/Operator, mid-impersonation session)**,
I want **an unmissable banner showing exactly who I'm viewing as, a reliable way to exit back to my own identity, and to see only what that user would actually see**,
So that **I never forget I'm impersonating someone, can always get back to my own account, and never accidentally retain my own admin capabilities while looking at their view**.

## Benefit Linkage

**Metric moved:** Privilege leakage during impersonation (risk metric)
**How:** This story is the direct implementation of the metric's target (0 admin-only surfaces reachable while impersonating a non-admin) — the effective-role visibility logic this story builds is what the metric measures.

## Architecture Constraints

- The banner must be rendered by the shared shell (`html-shell.js`) itself, not by individual route handlers — otherwise a route that forgets to check impersonation state could render without the banner, defeating its purpose as an unmissable indicator.
- Visibility of every admin-only nav item, settings tab, and route-level gate must key off the *effective* role (the target user's real role during impersonation), never the underlying admin's real role — this is the core security property named in discovery and must be applied consistently everywhere `requireAdmin` or equivalent role checks currently exist, not just in the nav.
- Depends on D1's session-swap mechanism — this story does not re-implement session state, it reads and reacts to it.

## Dependencies

- **Upstream:** D1 (start impersonation session) must exist — this story consumes the session state D1 establishes.
- **Downstream:** D4 (NFR-security review) directly audits this story's effective-role visibility logic as its primary subject.

## Acceptance Criteria

**AC1:** Given an active impersonation session, When any page in the app renders, Then a persistent banner appears at the very top of the viewport (above all other content) showing the target's login and tenant, and this banner cannot be dismissed or hidden by any user action other than exiting impersonation.

**AC2:** Given an active impersonation session where the target user is NOT an admin, When the sidebar or Settings page renders, Then no admin-only nav item (Admin credits) or settings tab (Credits, Impersonate) is visible — even though the underlying account performing the impersonation is a real admin.

**AC3:** Given an active impersonation session where the target user IS an admin, When the sidebar or Settings page renders, Then admin-only items ARE visible — reflecting that user's own real role accurately, not a blanket "always hide admin items while impersonating" rule that would misrepresent what the target user actually sees.

**AC4:** Given an active impersonation session, When the admin clicks "Exit impersonation" in the banner, Then the session immediately reverts to the real admin's own identity and permissions, the banner disappears, and no target-user session state persists anywhere (cookies, server-side session store) after exit.

**AC5:** Given an active impersonation session, When the underlying session expires or the server restarts, Then the user is returned to a signed-out state (not left in an ambiguous half-impersonating state) — impersonation state does not survive independently of the normal session lifecycle it's layered on top of.

## Out of Scope

- The audit log viewing UI — that is D3.
- Time-limiting sessions — confirmed out of scope at the epic level.

## NFRs

- **Performance:** No measurable impact — the banner and effective-role check add negligible overhead to existing page renders.
- **Security:** This story implements the epic's central security property (AC2/AC3) and must be the primary subject of D4's NFR-security review — specifically, every existing admin-gated surface in the app (not just the ones newly built in this feature) must be audited to confirm it checks effective role, not real role, once this story ships.
- **Accessibility:** The banner's striped/warning visual treatment is never colour-only — it includes the ⚠ icon and explicit text, matching this session's established accessibility convention.
- **Audit:** Exit is logged with an end-timestamp on the same audit entry D1 created for the session start (not a new, separate entry) — see D3 for the audit-record shape this depends on.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — depends on D1's session-swap investigation landing on a concrete mechanism first.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
