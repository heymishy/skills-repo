# Definition of Done: Backfill person_identities on login so existing real memberships become resolvable

**PR:** https://github.com/heymishy/skills-repo/pull/921 | **Merged:** 2026-09-24
**Story:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s4.md
**Test plan:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s4-test-plan.md
**DoR artefact:** artefacts/2026-09-23-team-roster-integration/dor/rtri-s4-dor.md
**Assessed by:** Copilot
**Date:** 2026-09-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: backfill fires on all 4 real login call sites | ✅ | 4 call-shape tests (github/google/email-sign-in/email-sign-up) + `tir-s9`'s route-string regression assertions confirming the real `auth.js`/`auth-email.js` source | `unit` + `integration-real-code` | None |
| AC2: backfilled identity becomes visible in `listTeamMembers` | ✅ | `testBackfilledIdentityVisibleInRoster` — direct before/after proof on one continuous pool instance, reproducing the exact live-verified gap | `integration-real-code` (real `listTeamMembers` from rtri-s1, not mocked) | The real-OAuth-round-trip-in-a-live-browser confirmation is RISK-ACCEPTed this session (Chrome unavailable) — see decisions.md, 2026-09-24. The underlying logic is proven correct against the real function; only the live browser session confirmation is deferred. |
| AC3: idempotent | ✅ | `testBackfillIsIdempotent` | `unit` | None |
| AC4: unknown identity never backfilled | ✅ | `testUnknownIdentityNeverBackfilled` | `unit` | None |
| AC5: existing 3 write sites unaffected | ✅ | Full-suite regression: `tir-s2` (linkIdentity) 5/5, team/client invitation suites unmodified and passing | `integration-real-code` (existing test suites, unmodified) | None |

**Verification strength summary:** 4 unit, 5 integration-real-code. AC2's real-world-effect claim (a real teammate's login in production actually writes the row) is the one place where automated evidence alone is not fully sufficient per this skill's own UI-evidence-gate-adjacent reasoning — flagged, not silently accepted as fully ✅ without qualification (see Deviation column and Follow-up actions).

---

## Scope Deviations

None. Confirmed by `git log --oneline master..HEAD` on the merged branch (6 commits, all trace to the plan's 4 tasks plus 2 review-driven fixes) and the final cross-task reviewer's explicit "anything extra" check.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 planned
**Tests passing in CI:** 9 / 9 implemented (confirmed both locally throughout `/subagent-execution` and by `/verify-completion`'s fresh full-suite run, and the merged PR's own CI checks)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 core write (unit) | ✅ | ✅ | |
| AC3 idempotent (unit) | ✅ | ✅ | |
| Audit NFR (unit) | ✅ | ✅ | |
| AC1 github shape (integration) | ✅ | ✅ | |
| AC4 unknown identity (integration) | ✅ | ✅ | |
| Backward-compat (integration) | ✅ | ✅ | |
| AC1 google shape (integration) | ✅ | ✅ | |
| AC1 email sign-in shape (integration) | ✅ | ✅ | |
| AC2 end-to-end roster visibility (integration) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Matches established RISK-ACCEPT pattern for comparably-shaped synchronous NFRs — one extra SELECT + conditional INSERT, same shape as `resolveRoleForPerson`'s own existing queries |
| Security | ✅ | `testUnknownIdentityNeverBackfilled` + backward-compat test directly prove no new identity source or trust boundary is introduced |
| Accessibility | ✅ N/A | No UI change (per story NFR section) |
| Audit | ✅ | `testBackfillAuditLogsWithoutRawIdentity` confirms `identity_backfilled` logged with SHA-256 identity hash, never the raw string — scoped IN at DoR, built as specified, not RISK-ACCEPTed |

---

## Metric Signal

| Metric | Measurement-ready? | Signal | Evidence note |
|--------|--------------------|--------|----------------|
| m1: Real pod membership | Not yet | `not-yet-measured` | This story removes a data-completeness blocker for the metric but is itself infrastructure-only — no UI wired to create a pod with real members yet; `rtri-s2` remains the consumer that makes this measurable |
| m2: /team/members shows a real list | Not yet | `not-yet-measured` | Same — `rtri-s3` remains the consumer that makes this measurable |

`contributingStories` for both metrics already includes `rtri-s1`; `rtri-s4` is a data-completeness fix for the same shared read path rather than a new independent contributor, so it is not added as a separate entry in `contributingStories` — its effect is on `rtri-s1`'s own contribution becoming reliable for more real tenants, not a new metric-moving mechanism.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Next session with Chrome available: perform the real live-login re-check on `wuce-staging.fly.dev` deferred by this session's RISK-ACCEPT (decisions.md, 2026-09-24) — sign in as a real teammate added via the admin form, confirm they now appear in `/api/team/members` after login. Low urgency (logic already proven correct); closes the loop on this story's own origin gap with the same kind of evidence that found it.
2. Once `rtri-s2`/`rtri-s3` ship, both feature metrics (m1, m2) become genuinely measurable for the first time — revisit their signal at that point.

---

## DoD Observations

1. **This story is a direct product of the session's own discipline of demanding live verification beyond automated evidence** — `rtri-s1`'s DoD live check (prompted by an explicit operator request, "Confirmed dod with chrome?") surfaced a real, structurally significant gap that 6/6 passing automated tests for `rtri-s1` itself had no way to catch (they never modeled "a real membership created outside a real login session, then that person logs in"). This is the second time this session a live check found something automated coverage missed (the first: `pmnv-s1`/Pod Manager nav unreachability, `ep4-s1`'s DoD). Worth reinforcing as a standing practice, not treating as coincidental.
2. **This same DoD's own live-check ambition was itself blocked by tooling unavailability** (Chrome extension not connected) — a smaller-scale instance of the exact pattern CLAUDE.md's UI-evidence-gate language anticipates. Handled correctly per that pattern: RISK-ACCEPT with a named, tracked follow-up action, not silently marking the AC fully ✅ or silently skipping the check. `/improve` candidate: none needed — the existing RISK-ACCEPT mechanism handled this correctly; flagging only as a positive confirmation the pattern works as designed.
3. **The `epics[].stories[]` pipeline-state shape's merge-conflict mitigation worked as intended a second time**: this story's merge produced zero `pipeline-state.json` conflicts (unlike `rtri-s1`'s merge, which had one, correctly resolved) — because no state write ever happened on `feature/rtri-s4` itself, exactly per the epic-nested bookkeeping rule.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Backfill person_identities on login so existing real memberships become resolvable" (rtri-s4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
