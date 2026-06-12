# Definition of Done — Evaluation Report

**Story:** prf.3 — Read-only user profile view
**PR:** #227 (merged 2026-05-15)
**Evaluated:** 2026-05-15

---

## Verdict: ❌ FAIL — DoD Not Met

PR #227 must not remain in its current merged state without remediation. A scope violation has been introduced into the main branch. Details and required actions follow.

---

## AC Coverage Assessment

| AC | Required Tests | PR Claims | Assessment |
|----|---------------|-----------|------------|
| AC1 | T1, T2 | ✅ Pass | Satisfied |
| AC2 | T3, T4 | ✅ Pass | Satisfied |
| AC3 | T5 | ✅ Pass | Satisfied |

All five tests pass and map cleanly to the test plan. No coverage gaps.

---

## DoD Gate Checks

| Gate | Status | Notes |
|------|--------|-------|
| All ACs implemented | ✅ Pass | ProfileView, ProfileSkeleton, auth guard, route all present |
| Test plan fully executed, 5/5 pass | ✅ Pass | Per PR description |
| No test plan gaps | ✅ Pass | Confirmed in test plan artefact |
| Implementation matches story scope | ❌ **FAIL** | Avatar upload wired in — see below |
| Out-of-scope items excluded | ❌ **FAIL** | Avatar upload is explicitly deferred to prf.4 |
| NFRs | ✅ N/A | Reviewed and confirmed none applicable |
| DoR was PROCEED | ✅ Pass | No outstanding warnings |

---

## Scope Violation — Critical Finding

The PR notes contain the following admission:

> *"I noticed the avatar upload component (AvatarUpload.tsx) was already partially implemented from an earlier spike and just needed to be wired to the profile page. Since it was 3 lines to connect and the file already existed, I added it."*

This is a clear and material scope violation.

**Why this fails DoD, regardless of effort size:**

1. **The story explicitly excludes avatar upload.** The Out of Scope section states: *"Profile photo / avatar upload — deferred to prf.4."* The existence of prior spike work does not change the scope boundary of prf.3.

2. **"3 lines" is not a DoD criterion.** Effort size is irrelevant to whether a change belongs in a story. Low-effort out-of-scope work is still out-of-scope work.

3. **The feature is now live without its own story lifecycle.** prf.4 has not been through DoR, has no acceptance criteria, no test plan, and no explicit product sign-off. Avatar upload behaviour on the profile page is currently untested, unreviewed, and unaccountable.

4. **It touches a live API endpoint.** The PR notes `/api/users/avatar` is in use. Any issues with that endpoint in production now have an untracked UI surface.

5. **It undermines story-level traceability.** Velocity, scope, and audit trails are distorted when work is silently bundled across stories.

---

## Required Remediation Actions

The following actions are required before prf.3 can be marked Done.

### Option A — Revert (Preferred)
1. Raise a revert PR that removes the `AvatarUpload.tsx` wiring from `profile.tsx`.
2. Confirm `AvatarUpload.tsx` itself remains (it is pre-existing spike work and can stay as an unrendered file), but it must not be connected to any live route until prf.4 is played.
3. Re-run the test suite after the revert. All 5 tests for prf.3 must still pass.
4. Merge the revert PR, then mark prf.3 Done.

### Option B — Absorb via prf.4 acceleration (only if PO agrees)
1. Product Owner explicitly accepts avatar upload as in-scope for the current sprint.
2. prf.4 is immediately taken through DoR.
3. Acceptance criteria and a test plan for avatar upload are written and signed off.
4. Tests covering avatar upload behaviour are added to the test suite.
5. Only after steps 2–4 are complete may the combined work be marked Done under prf.4. prf.3 is marked Done separately, with a note that the avatar wiring was folded forward.

Option A is strongly preferred. Option B carries process debt and should not be used as a pattern.

---

## Process Note for the Team

This is a common and well-intentioned mistake — a developer sees adjacent work and acts efficiently. The fix is not to blame the developer but to reinforce the boundary at PR review: **reviewers are responsible for catching out-of-scope additions before merge, not only after.** The PR description disclosed the change transparently, which is good; the reviewer should have flagged it at that point.

Consider adding a checklist item to your PR template: *"Does this PR contain only work described in the linked story? If not, is the additional work explicitly approved?"*

---

## Summary

| | |
|---|---|
| **ACs covered** | ✅ 3/3 |
| **Tests passing** | ✅ 5/5 |
| **Scope clean** | ❌ No — avatar upload wired in from prf.4 |
| **DoD verdict** | ❌ **FAIL** |
| **Blocking issue** | Scope violation must be remediated before Done can be marked |