## Definition of Ready: NFR-security review and hardening pass for Admin User Impersonation

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d4-nfr-security-review-and-hardening.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d4-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-21

---

**CONTRACT REVIEW:** ✅ Passed — all 5 ACs have a matching (review/checklist-style) verification approach appropriate to a review story.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1–H2 | Story format, ≥3 ACs | ✅ | 5 ACs |
| H3 | Every AC has a test | ✅ | Checklist-style tests, appropriate for a review story |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage | ✅ | Directly IS the risk metric's verification |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH | ✅ | Review PASS, 0 findings |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints | ✅ N/A appropriately noted (review story, not a new implementation) | |
| H-E2E | N/A | ✅ | |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | N/A | ✅ | |
| H-NFR3 | Data classification | ✅ | Confidential |
| H-GOV | Approved By | ✅ | |
| H-ADAPTER | N/A | ✅ | Pure review activity, no new adapter |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability | ✅ | — | Stable (review scope is fixed; only the hardening volume from AC5 is open-ended, bounded by "fix what's found") |
| W3 | MEDIUM findings | ✅ N/A | — | 0 findings |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed; all 5 scenarios marked 🔴 | **Operator must review `d4-verification.md` before this story executes** |
| W5 | No uncertain gaps | ✅ | — | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes -- BUT ONLY ONCE D1, D2, AND D3 ARE MERGED (hard dependency)
Story: NFR-security review and hardening pass for Admin User Impersonation — artefacts/2026-07-21-web-ui-experience-redesign/stories/d4-nfr-security-review-and-hardening.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d4-test-plan.md

Goal:
This is a review-and-fix story, not a build-from-scratch story. Do not
begin until D1, D2, and D3 are implemented and reviewable. Run the
exhaustive requireAdmin-surface audit (AC1), the session-state diff (AC2),
the concurrent-request test (AC3), and the audit-implementation check
(AC4). Any gap found must be fixed in the relevant D1/D2/D3 code directly
(AC5) -- this story is not complete with open findings, however minor.

Constraints:
- This review is human-led by design (no separate security team exists on
  this platform) -- the operator should be directly involved in reviewing
  this story's findings, not just the coding agent working alone.
- Do not expand scope beyond what AC1-AC4 name -- no new hardening (e.g.
  session time-limiting) beyond what discovery committed to.
- Record every finding and its resolution in decisions.md, per this repo's
  own established practice.
- Open a draft PR when the review is complete and any fixes are applied --
  do not mark ready for review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — named human sign-off required. Given this story IS the security gate for the whole epic, the operator's direct involvement in reviewing its findings (not just its existence) is expected, not optional.
**Signed off by:** Hamish King — Founder/Operator — 2026-07-21
