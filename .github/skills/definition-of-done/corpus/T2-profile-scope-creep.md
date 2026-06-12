# Corpus Case T2 — User profile view: out-of-scope implementation in PR

## Case metadata

```json
{
  "case_id": "T2",
  "label": "User profile read-only view — out-of-scope avatar upload added in PR",
  "difficulty": "adversarial",
  "expected_verdict": "COMPLETE WITH DEVIATIONS",
  "expected_gap": "Scope deviation: avatar photo upload implemented — explicitly listed in story out-of-scope section",
  "adversarial_pattern": "All 3 ACs are satisfied with test evidence. The PR description buries the scope deviation in a 'Notes' paragraph: 'While implementing, I noticed the avatar upload component was already partially in the codebase — I wired it up since it was 3 lines.' The out-of-scope section of the story explicitly says 'Profile photo / avatar upload — deferred to prf.4.' A model that only reads AC coverage and misses the out-of-scope check will call this COMPLETE.",
  "failure_modes_to_watch": [
    "AC-only check: ACs verified, verdict COMPLETE without reading out-of-scope section",
    "Buried deviation missed: deviation is in PR Notes paragraph, not a headline item",
    "Incorrect verdict: COMPLETE instead of COMPLETE WITH DEVIATIONS"
  ]
}
```

---

## Operator input

> **Operator instruction:** Please run /definition-of-done for the story and supporting artefacts below. PR #227 has been merged.

---

### Story artefact

**Story ID:** prf.3
**Feature:** User Profile Management
**Epic:** Profile and Account Settings

---

## Story: Read-only user profile view

**As a** registered platform user,
**I want** to view my profile information (name, email, role, account created date) on a dedicated profile page,
**So that** I can confirm my account details without having to navigate to account settings.

## Acceptance Criteria

**AC1:** Given I am authenticated, when I navigate to `/profile`, then I see a read-only display of my name, email address, role label, and account creation date. No edit controls are visible.

**AC2:** Given my profile data is loading, when the API call is in flight, then a loading skeleton is displayed; when the call resolves, the skeleton is replaced with my profile data within 300ms of the response.

**AC3:** Given I am not authenticated, when I navigate to `/profile`, then I am redirected to `/login` with `?returnTo=/profile` as a query parameter.

## Out of Scope

- Profile photo / avatar upload — deferred to prf.4.
- Profile editing (name, email change) — deferred to prf.5.
- Email verification flow for changed addresses — out of scope for this feature entirely.
- Notification preferences section — separate story under account settings epic.

## NFRs

NFRs: None — reviewed 2026-05-11

## Complexity

Complexity: 1 (well understood; simple display component with auth guard)

---

### Test plan summary

**Test plan artefact:** artefacts/user-profile/test-plans/prf.3-test-plan.md

| AC | Tests | Coverage | Notes |
|----|-------|----------|-------|
| AC1 | T1: profile page renders name/email/role/created-date; T2: no edit input elements visible | Full | — |
| AC2 | T3: loading skeleton renders during fetch; T4: data replaces skeleton after response | Full | — |
| AC3 | T5: unauthenticated request redirects to /login?returnTo=/profile | Full | — |

No test plan gaps.

---

### DoR artefact summary

**DoR artefact:** artefacts/user-profile/dor/prf.3-dor.md
**DoR verdict:** PROCEED
**Warnings acknowledged:** None
**Oversight level:** Low

---

### PR description — PR #227 (merged 2026-05-15)

```
## Summary
Implements the read-only user profile page (prf.3).

## Changes
- src/components/ProfileView.tsx — new component; displays name, email, role, created-date
- src/pages/profile.tsx — new page route at /profile with auth guard
- src/components/ProfileSkeleton.tsx — loading skeleton for profile data
- tests/ProfileView.test.tsx — unit tests (T1–T5 all passing)

## Test results
5/5 tests pass. All AC coverage verified per test plan.

## Notes
While implementing the profile view, I noticed the avatar upload component (AvatarUpload.tsx) was already partially implemented from an earlier spike and just needed to be wired to the profile page. Since it was 3 lines to connect and the file already existed, I added it. The avatar upload uses the existing /api/users/avatar endpoint. No new API changes needed.
```

---

## Expected verdict

**Verdict:** COMPLETE WITH DEVIATIONS

**Gap that fires:** Scope deviation — avatar upload (prf.4 scope) was implemented and is now visible on the profile page. The story's out-of-scope section explicitly defers "Profile photo / avatar upload" to prf.4.

**Reason:** AC1–AC3 are all verified by named tests (T1–T5). There are no AC gaps. However, the PR description explicitly says "I added [avatar upload]" — this is an out-of-scope implementation that must be recorded as a deviation. The out-of-scope section names "Profile photo / avatar upload — deferred to prf.4." The scope violation is self-reported in the PR notes and is unambiguous.

**What a correct model output looks like:**
> ✅ AC1 — Read-only profile display: T1+T2 pass
> ✅ AC2 — Loading skeleton: T3+T4 pass
> ✅ AC3 — Auth redirect: T5 pass
>
> ⚠️ **Scope deviation — avatar upload implemented**
> The story's out-of-scope section defers "Profile photo / avatar upload" to prf.4. The PR description states the AvatarUpload component was wired to the profile page. This is a scope deviation — implementation went beyond the story boundary. Recorded for /trace.
>
> **Verdict: COMPLETE WITH DEVIATIONS**
> Deviation: Avatar upload (prf.4 scope) implemented in prf.3. Follow-up: confirm prf.4 story scope is adjusted or the avatar upload is removed.

**What a failing model output looks like (false positive):**
> AC1 ✅ — T1+T2 pass
> AC2 ✅ — T3+T4 pass
> AC3 ✅ — T5 pass
> All 5 tests pass. No scope issues noted.
> **Verdict: COMPLETE**

## Adversarial signal

The scope deviation is buried in the "Notes" paragraph of the PR, after the test results section. A model that reads the PR description top-to-bottom and stops at "5/5 tests pass" will likely call this COMPLETE without reading the notes. The trap is that the deviation is self-reported and unambiguous — it is not a subtle edge case. A model that follows the DoD process (AC check → out-of-scope check) will catch it. A model that treats "tests pass" as a sufficient DoD signal will miss it entirely.
