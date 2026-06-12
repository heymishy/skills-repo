# Definition of Done — Evaluation Report

**Story:** prf.3 — Read-only user profile view
**PR:** #227 (merged 2026-05-15)
**Evaluated:** 2026-05-15

---

## Verdict: ❌ FAIL — PR must be reverted or remediated before this story is marked Done

---

## Summary

The core acceptance criteria for prf.3 appear to be implemented and tested. However, PR #227 contains a material out-of-scope change that directly contradicts the story's documented scope boundary, was not flagged for review, and was merged without a governing story or acceptance criteria. This alone is sufficient to block a Done verdict.

---

## DoD Checklist

### ✅ Acceptance Criteria Coverage

| AC | Tests | PR implements? | Assessment |
|----|-------|----------------|------------|
| AC1 | T1, T2 | ProfileView.tsx + profile.tsx | ✅ Pass |
| AC2 | T3, T4 | ProfileSkeleton.tsx | ✅ Pass |
| AC3 | T5 | Auth guard in profile.tsx | ✅ Pass |

All five tests are reported as passing. Test plan shows full AC coverage with no gaps. AC implementation is consistent with the test plan artefact.

---

### ✅ Test Plan Compliance

- Test plan artefact referenced and present.
- All ACs mapped to tests; no gaps documented.
- 5/5 tests passing per PR description.
- No test plan warnings outstanding.

---

### ✅ DoR Compliance

- DoR verdict was PROCEED.
- No warnings to carry forward.
- Oversight level: Low. No additional sign-off gates triggered.

---

### ✅ NFRs

Explicitly reviewed and waived (2026-05-11). No outstanding NFR obligations.

---

### ❌ Scope Integrity — BLOCKER

The PR description states:

> *"I noticed the avatar upload component (AvatarUpload.tsx) was already partially implemented from an earlier spike and just needed to be wired to the profile page. Since it was 3 lines to connect and the file already existed, I added it."*

This is a direct violation of the story's documented out-of-scope boundary:

> *"Profile photo / avatar upload — deferred to prf.4."*

This is not a minor incidental change. The concerns are:

1. **No governing story.** Avatar upload belongs to prf.4, which has not been started, reviewed, or accepted. The work is live in production with no AC, no test plan, and no DoR process having been run.

2. **No acceptance criteria.** There is nothing to evaluate the avatar upload behaviour against. It cannot be called correct or incorrect — it is simply ungoverned.

3. **No test coverage.** The test plan for prf.3 covers T1–T5. Avatar upload functionality is not covered by any test in scope for this story. It is untested in any governed sense.

4. **"It was easy" is not a scope authority.** The effort required to add a change (3 lines) has no bearing on whether the change is in scope. Scope is defined by the story and its out-of-scope list, not by implementation convenience.

5. **The out-of-scope deferral exists for a reason.** Deferred items are deferred to allow proper definition, acceptance criteria, security review (avatar upload touches file handling and an API endpoint — `/api/users/avatar` — that has not been reviewed in this story's context), and test planning. Bypassing this process creates risk.

6. **The PR was merged.** This compounds the issue. The change is now in the main branch and potentially in production. Remediation is required, not just a conversation.

---

## Required Actions Before Done Verdict

The following must be completed before prf.3 can be marked Done. These actions are listed in order of priority.

**Action 1 — Immediate: Remove or isolate the avatar upload wiring**
The connection of AvatarUpload.tsx to the profile page must be reverted, or the avatar upload functionality must be placed behind a disabled/hidden state that provably does not expose the feature to users. A revert is strongly preferred. A follow-up PR (#228 or similar) should be raised, reviewed, and merged.

**Action 2 — Verify the revert does not break AC coverage**
After the revert PR is merged, confirm that T1–T5 still pass and that no AC for prf.3 was inadvertently coupled to the avatar upload code.

**Action 3 — Raise a scope exception or fast-track prf.4**
If there is a product or business reason to keep the avatar upload live, the correct path is to: (a) fast-track prf.4 through DoR, define its ACs, raise a test plan, and run a proper DoD evaluation; or (b) raise a formal scope exception through whatever change-control process the team operates. Neither has happened here.

**Action 4 — Process note for the team**
This pattern — wiring in deferred functionality because it seemed small — should be raised in the next retrospective. The out-of-scope list is a contract, not a suggestion.

---

## Blocking vs. Non-Blocking Summary

| Area | Status | Blocking? |
|------|--------|-----------|
| AC1 implementation | ✅ Pass | No |
| AC2 implementation | ✅ Pass | No |
| AC3 implementation | ✅ Pass | No |
| Test plan coverage | ✅ Pass | No |
| DoR carried forward | ✅ Pass | No |
| NFRs | ✅ Waived | No |
| Avatar upload added out of scope | ❌ Fail | **Yes** |

---

## Final Verdict

**❌ NOT DONE**

prf.3 cannot be marked Done while ungoverned, untested, out-of-scope functionality is wired into the profile page. The AC implementation itself is sound and would pass on its own merits. Remediate the scope violation, verify tests still pass, and resubmit for DoD evaluation.