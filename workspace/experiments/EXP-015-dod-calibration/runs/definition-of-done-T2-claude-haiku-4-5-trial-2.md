# /definition-of-done Pipeline Report

**Story ID:** prf.3 | **Status:** ⚠️ **BLOCKED** | **Date:** 2026-05-15

---

## Summary
PR #227 is **merged but the story does NOT meet Definition of Done**. A scope violation has been detected that requires resolution before this story can be marked complete.

---

## DoD Checklist

| Item | Status | Evidence | Notes |
|------|--------|----------|-------|
| **Acceptance Criteria** | ✅ PASS | Test plan artefact; 5/5 tests passing | All three ACs (AC1, AC2, AC3) verified and covered |
| **Test Coverage** | ✅ PASS | artefacts/user-profile/test-plans/prf.3-test-plan.md | Full coverage; no gaps identified |
| **Code Review** | ✅ PASS | PR #227 merged | Assumed approved via merge |
| **DoR Satisfied** | ✅ PASS | artefacts/user-profile/dor/prf.3-dor.md; verdict=PROCEED | Low oversight; no blocking warnings |
| **Scope Compliance** | ❌ **FAIL** | PR description notes | **Avatar upload feature added** — unplanned scope creep |
| **Documentation** | ⚠️ CONDITIONAL | — | Depends on scope resolution |
| **Ready for Deployment** | ❌ **BLOCKED** | — | Cannot proceed until scope issue resolved |

---

## 🚨 Critical Finding: Scope Violation

### Issue
The PR description states:
> *"While implementing the profile view, I noticed the avatar upload component (AvatarUpload.tsx) was already partially implemented from an earlier spike and just needed to be wired to the profile page. Since it was 3 lines to connect and the file already existed, I added it."*

### Why This Is a Problem
1. **Out of Scope by Design:** Story artefact explicitly defers avatar upload to **prf.4** with rationale "deferred to prf.4"
2. **Unplanned Work:** Feature was not in the original story, test plan, or DoR
3. **Gold-plating Risk:** "Only 3 lines" rationale is a classic scope-creep indicator
4. **Approval Gap:** Avatar upload feature was not reviewed/approved as part of this story
5. **Traceability Loss:** No test plan entry (T6, etc.) for avatar upload functionality

---

## Operator Actions Required

### Option A: **Revert Avatar Upload (Recommended)**
```
1. Remove AvatarUpload.tsx wiring from src/pages/profile.tsx
2. Revert ProfileView.tsx to read-only display only
3. Re-run test suite to confirm AC1–AC3 still pass
4. Re-merge as PR #227-revised
5. Mark prf.3 as DONE
6. Create separate story prf.4-avatar-upload with proper acceptance criteria
```

### Option B: **Accept Scope & Reclassify (If Business-Critical)**
```
1. Update story artefact "Out of Scope" section to move avatar upload TO IN-SCOPE
2. Add test plan entries (T6, T7) for avatar upload functionality
3. Create traceability link: prf.3 → prf.4 (defer profile photo upload refinement only)
4. Document why early implementation was approved
5. Obtain explicit sign-off from Product Owner
6. Re-run full test suite with new test entries
7. Mark prf.3 as DONE with noted scope change
```

---

## Recommendation

**Execute Option A.** The story is tightly scoped and well-defined. Avatar upload (prf.4) warrants its own story with dedicated test plan, acceptance criteria, and API integration testing. The "3 lines" rationale suggests this was not a planned dependency and should be handled separately to maintain clean scope boundaries and traceability.

---

## Next Steps

1. **Operator:** Confirm remediation path (A or B)
2. **Developer:** Execute chosen path
3. **Re-run:** `/definition-of-done` after remediation
4. **Product:** Sign-off if Option B chosen

**Current Status:** 🔴 **CANNOT CLOSE** — awaiting scope decision