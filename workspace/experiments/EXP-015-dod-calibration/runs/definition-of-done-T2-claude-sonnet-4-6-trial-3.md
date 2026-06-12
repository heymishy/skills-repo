# Definition of Done — Pipeline Result

**Story:** prf.3 — Read-only user profile view
**PR:** #227 (merged 2026-05-15)
**DoD evaluation date:** 2026-05-15

---

## Verdict

> ## ❌ NOT DONE — DoD Blocked
> PR #227 has been merged, but the story cannot be marked Done. A scope violation was introduced at merge that must be resolved before this story closes.

---

## Checklist Evaluation

### ✅ Passing Items

| # | DoD Item | Status | Notes |
|---|----------|--------|-------|
| 1 | Acceptance criteria defined and unambiguous | ✅ Pass | AC1–AC3 are well-formed, testable, and complete |
| 2 | All ACs have corresponding tests | ✅ Pass | T1–T5 mapped 1:1 against AC1–AC3; no gaps |
| 3 | All tests passing | ✅ Pass | 5/5 per PR description |
| 4 | Test plan reviewed and gap-free | ✅ Pass | Test plan artefact confirms full coverage |
| 5 | DoR was met before development | ✅ Pass | DoR verdict: PROCEED; no unacknowledged warnings |
| 6 | Out-of-scope items documented and deferred | ✅ Pass | Avatar upload, editing, email verification, and notification preferences all explicitly deferred |
| 7 | NFRs reviewed | ✅ Pass | Confirmed none applicable; reviewed 2026-05-11 |
| 8 | No unintended functional changes | ❌ **FAIL** | See critical finding below |

---

## ❌ Critical Finding — Scope Violation

### Avatar upload functionality was added outside scope

The PR description explicitly notes:

> *"I noticed the avatar upload component (AvatarUpload.tsx) was already partially implemented from an earlier spike and just needed to be wired to the profile page. Since it was 3 lines to connect… I added it."*

This directly contradicts the story's own Out of Scope declaration:

> *"Profile photo / avatar upload — deferred to prf.4."*

This is a DoD blocker regardless of implementation size. The reasoning ("it was only 3 lines") is a well-known scope creep rationalisation — effort is not the relevant measure; scope boundaries are.

**Specific concerns raised by this violation:**

| Concern | Detail |
|---------|--------|
| **Untested scope** | No tests exist for the avatar upload path. T1–T5 cover prf.3 ACs only. The upload functionality has no test coverage in this PR |
| **No AC coverage** | Avatar upload has no acceptance criteria in this story; its behaviour is therefore undefined and unverified |
| **Deferred story impacted** | prf.4 (avatar upload) may now land on an inconsistent or partially-wired baseline, creating confusion about what is already shipped |
| **API surface activated** | `/api/users/avatar` is now reachable from the profile page without having passed through a dedicated story, test plan, or DoR review |
| **Merged state** | The PR is already merged; the violation is live in the codebase |

---

## Required Resolution Actions

Because the PR is already merged, the team must take one of the following remediation paths before prf.3 can be marked Done:

### Option A — Remove the avatar wiring (Recommended)
Raise a follow-up PR that removes the `AvatarUpload.tsx` wiring from the profile page. This restores the codebase to the intended prf.3 scope. prf.4 then proceeds normally.

### Option B — Absorb into prf.4 with full treatment
If the team elects to keep the wiring, it must be formally absorbed into prf.4 with:
- AC coverage written and reviewed
- Test plan updated to include avatar upload tests
- DoR re-evaluated for the expanded scope
- prf.3 remains **not done** until that work is complete and verified

> ⚠️ Option B is not a shortcut. It requires the full story lifecycle for the avatar feature, not simply retroactive approval of what was merged.

---

## Advisory Note — Process

This violation reached merge without being caught in review. It is worth the team briefly examining why:

- Was the scope conflict visible in the PR and overlooked during review?
- Is there a gap in the PR review checklist around out-of-scope declarations?

A lightweight addition to the PR template — a checkbox confirming the author has read the story's Out of Scope section — would reduce recurrence cost to near zero.

---

## Summary

| Area | Status |
|------|--------|
| Acceptance criteria | ✅ |
| Test coverage (prf.3 scope) | ✅ |
| Tests passing | ✅ |
| DoR compliance | ✅ |
| Scope integrity | ❌ **Blocked** |
| **Overall DoD verdict** | ❌ **NOT DONE** |

**Assigned action:** Team lead to decide Option A or B and raise the remediation PR. prf.3 story status should remain In Review / Blocked until resolved.