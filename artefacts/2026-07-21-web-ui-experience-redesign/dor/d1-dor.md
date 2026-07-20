## Definition of Ready: Start an impersonation session (search, reason-gated, session swap)

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d1-start-impersonation-session.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d1-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-21

---

**CONTRACT REVIEW:** ✅ Passed, with an explicit caveat carried forward honestly rather than hidden — the contract does not (and cannot yet) commit to concrete session-swap mechanics, because that investigation is this story's own first implementation task. This is named directly in the contract's Assumptions section, matching the story's own Architecture Constraints. Not a mismatch; a genuinely open technical question that DoR is explicitly allowing to proceed as this story's first task (see the SCOPE decision in decisions.md, 2026-07-21).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1–H2 | Story format, ≥3 ACs | ✅ | 6 ACs |
| H3 | Every AC has a test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage | ✅ | |
| H6 | Complexity rated | ✅ | Rating 3 |
| H7 | No unresolved HIGH | ✅ | Review PASS, 1 MEDIUM (risk-accepted per decisions.md) |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | |
| H-E2E | N/A | ✅ | No layout-dependent ACs in this story |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | N/A | ✅ | No named regulatory clause applies |
| H-NFR3 | Data classification | ✅ | Confidential (real identity pairs) |
| H-GOV | Approved By populated | ✅ | |
| H-ADAPTER | New adapter has wiring AC | ✅ | AC6 added at this DoR run (decisions.md ARCH entry) |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability | ✅ | Declared **Unstable** — the session-swap mechanism is undesigned as of this DoR sign-off | Operator aware; this is the story's own stated risk |
| W3 | MEDIUM findings acknowledged | ✅ | Review's 1-M1 (embedded investigation vs. separate spike) already logged as SCOPE decision in decisions.md | Hamish King, per that decision entry |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed; includes 2 🔴 high-risk manual scenarios (AC3, AC4) that specifically require careful human review before implementation | **Operator must review `d1-verification.md` before assigning — not optional given this story's risk level** |
| W5 | No uncertain gaps | ✅ | — | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes -- WITH MANDATORY FIRST STEP
Story: Start an impersonation session (search, reason-gated, session swap) — artefacts/2026-07-21-web-ui-experience-redesign/stories/d1-start-impersonation-session.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d1-test-plan.md

Goal:
Your FIRST task, before any implementation code, is the technical
investigation named in this story's Architecture Constraints: determine
how req.session.tenantId/login/role can be temporarily overridden while
preserving the real admin identity for exit/audit, given this app's
Redis-backed session persistence and requireAdmin's live per-request role
re-check. Document your findings and proposed mechanism in a PR comment
BEFORE writing implementation code. Do not proceed past this investigation
without it being documented.

Constraints:
- This is the highest-risk story in the entire feature. Do not take
  shortcuts on AC3/AC4's atomicity requirements -- a session swap without
  a corresponding audit write must be structurally impossible, not just
  usually-avoided.
- Follow the D37 injectable-adapter pattern for setImpersonationAuditAdapter
  exactly (stub throws, production wiring is a separate task, wiring test
  asserts real behavioural correctness per AC6).
- Use req.session.accessToken -- never .token -- per this repo's canonical rule.
- ADR-025: the impersonated session's tenant scoping must behave identically
  to a real login as that tenant everywhere else in the codebase.
- Open a draft PR when tests pass -- do not mark ready for review.
- This story is followed immediately by D4, a dedicated NFR-security review
  of this exact code. Write with that review in mind -- do not consider this
  story "done" in spirit just because tests pass; D4 will re-examine it.
- If ANY part of the investigation reveals something more complex or risky
  than anticipated, STOP and flag it in a PR comment for human review before
  continuing -- do not resolve ambiguity unilaterally on a security-sensitive
  mechanism.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — named human sign-off required before assigning to a coding agent, per discovery's own flagged highest risk.
**Signed off by:** _[Pending — Hamish King, Founder/Operator, to confirm explicitly before this story is assigned]_
