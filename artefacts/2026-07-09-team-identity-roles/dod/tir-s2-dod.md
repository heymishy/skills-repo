# Definition of Done: A logged-in user links a second auth provider to their identity

**PR:** https://github.com/heymishy/skills-repo/pull/464 | **Merged:** 2026-07-12
**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s2.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s2-cross-provider-linking-test-plan.md
**DoR artefact:** artefacts/2026-07-09-team-identity-roles/dor/tir-s2-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Linking Google to a GitHub-authenticated session records both identities as one person | automated test | None |
| AC2 | ✅ | Unauthenticated request to link-settings redirects to login | automated test | None |
| AC3 | ✅ | Two separate signups sharing an email via different providers stay distinct — no auto-merge | automated test | None |
| AC4 | ✅ | Linking an already-linked identity is rejected, no data change | automated test | None |

---

## Scope Deviations

None. PR #464 touched `identity-links.js` (new), `routes/account-linking.js` (new), `server.js` wiring, and the new test file — all within scope. No auto-merge logic was introduced (explicitly forbidden by AC3), no unlink action was built (correctly deferred).

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (test plan named 5 including an NFR-only entry; all substantive tests implemented)
**Tests passing in CI:** 5 / 5 (re-verified directly against current master, 2026-07-13)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (link and cross-provider resolve) | ✅ | ✅ | |
| AC2 (unauthenticated redirect) | ✅ | ✅ | |
| AC3 (no auto-merge) | ✅ | ✅ | |
| AC4 (already-linked rejection) | ✅ | ✅ | |
| Audit NFR (link actions logged, hashed identity, no raw token) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Linking requires proof of ownership of both identities | ✅ | AC1/AC4 tests confirm the ADR-018 auth-bypass fixture simulates a completed second-provider auth step, not a bare claim |
| Audit logging | ✅ | Test confirms person IDs + SHA-256 identity hash + timestamp logged, never a raw identity string or token |
| Accessibility (link control meets WCAG 2.1 AA) | ⚠️ | No automated scan tooling exists in this repo for this — per the story's own NFR section, verified manually via the AC verification script, not automated. Not a gap introduced by this story; matches this repo's existing convention for all accessibility NFRs. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 2 — Cross-provider identity collision resolved | ✅ (not yet established) | Yes — measurable now | The explicit link action exists and is tested end-to-end for one provider pair (GitHub + Google), meeting the metric's stated target |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

None beyond what's already recorded in the story's own review (Run 2, 2026-07-13 — ADR-018 citation added, closing the one MEDIUM finding from Run 1).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "A logged-in user links a second auth provider to their identity" (tir-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
