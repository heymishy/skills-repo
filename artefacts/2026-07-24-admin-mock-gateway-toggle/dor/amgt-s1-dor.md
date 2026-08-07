## Definition of Ready: Let an admin toggle the mock LLM gateway on/off from an in-app admin page

**Story reference:** artefacts/2026-07-24-admin-mock-gateway-toggle/stories/amgt-s1.md
**Test plan reference:** artefacts/2026-07-24-admin-mock-gateway-toggle/test-plans/amgt-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-24

---

## Contract Review

Contract aligns with all 5 ACs — the production hard-override (AC4) is explicitly preserved as evaluated first in the proposed logic. **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | Hamish King |
| H2 | ≥3 ACs Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named metric | ✅ | Short-track exemption — benefit stated directly (no benefit-metric artefact for short-track) |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Short-track — review skipped per CLAUDE.md's short-track path |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies is "None" — not applicable |
| H9 | Architecture Constraints populated | ✅ | Explicitly protects the production hard-override |
| H-E2E | CSS-layout-dependent gate | ✅ | No CSS-layout-dependent ACs — not applicable |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated — short-track exemption, no feature-level `nfr-profile.md` required (mirrors `acps-s1`'s precedent) |
| H-NFR2/H-NFR3 | Compliance/classification | ✅ | Not applicable / Internal |
| H-GOV | Discovery `Approved By` | ✅ | Short-track exemption: no discovery artefact exists, per `kfd1`/`acps-s1` precedent |
| H-ADAPTER | Adapter wiring check | ✅ | The new runtime-override setter is an injectable-style function but not a D37 "adapter" in the sense of an external dependency stub — it's a simple in-memory flag with a default (unset/null), not a throwing stub; not applicable |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1-W2 | NFRs / scope stability | ✅ | — | — |
| W3 | MEDIUM findings | ✅ | None (short-track, no review) | — |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed by operator | Pending |
| W5 | No UNCERTAIN gaps | ✅ | — | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Let an admin toggle the mock LLM gateway on/off from an in-app admin page — artefacts/2026-07-24-admin-mock-gateway-toggle/stories/amgt-s1.md
Test plan: artefacts/2026-07-24-admin-mock-gateway-toggle/test-plans/amgt-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- The production hard-override in isMockGatewayEnabled() (NODE_ENV === 'production' -> false)
  MUST remain the first check, evaluated before the new runtime toggle. AC4's test is the
  binding proof of this -- do not let it regress.
- In-memory only for this story (AC3) -- do not build database persistence.
- Reuse requireAdmin + renderShell + csrfField/csrfGuard exactly as admin-credits.js does --
  do not invent a new admin-auth or CSRF mechanism.
- Log every toggle flip (admin identity + new state) via the existing console.info/
  structured-log pattern.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment
  describing the ambiguity and do not mark ready for review.

Oversight level: Medium -- share this DoR artefact with the operator before assigning
(touches a security-relevant hard-override and has real-cost implications if misused).
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Yes
**Signed off by:** [Pending — see closing summary]
