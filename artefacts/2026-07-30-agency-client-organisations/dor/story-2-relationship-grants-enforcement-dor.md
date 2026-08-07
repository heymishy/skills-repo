# Definition of Ready: Agency-Client relationships, shared-access grants, and read-only enforcement

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-2-relationship-grants-enforcement.md
**Test plan reference:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-2-relationship-grants-enforcement-test-plan.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-07-31

---

## Contract Proposal

See `story-2-relationship-grants-enforcement-dor-contract.md`. Summary: two new tables + one dedicated grant-check adapter, extending the existing tenant-isolation guard rather than replacing it. No caching layer — revocation is immediate by construction.

## Contract Review

Checked against all 6 ACs and the test plan's 13 tests. AC2's cross-relationship isolation and AC6's regression guard are both explicitly named in the contract, matching this story's own framing as "the single highest-risk story in the epic." No mismatch found.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As a Client org member (read-only)..." |
| H2 | ≥3 ACs in G/W/T format | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | 13 tests across 6 ACs |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | "Agency-led client provisioning" |
| H6 | Complexity rated | ✅ | 3, Unstable — highest in the epic, correctly flagged |
| H7 | No unresolved HIGH findings | ✅ | Review run 1 — PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | No gaps |
| H8-ext | Cross-story schema dependency | ✅ | Upstream: Story 1. `schemaDepends: [stage, reviewStatus]` — both fields present in pipeline-state.schema.json |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-025 + Guardrail + new Caching note (below); Architecture compliance scored 5 |
| H-E2E | CSS-layout-dependent AC gap | ✅ N/A | No layout-dependent ACs — access-control logic, not UI |
| H-NFR | NFR profile exists | ✅ | Present, Story 2 rows populated (Performance, Security, Audit) |
| H-NFR2 | Compliance clause sign-off | ✅ N/A | No compliance framework named |
| H-NFR3 | Data classification not blank | ✅ | "Confidential" |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Approved By | ✅ | "Hamish King — Product/Platform Owner — 2026-07-30" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | The grant-check function is an internal adapter over the existing DB pool (same shape as other in-repo data-access functions), not a swappable external-service integration requiring D37's throw-stub/wiring-AC pattern |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Unstable — correctly reflects this story's genuine novelty | Noted, not a blocker |
| W3 | MEDIUM findings acknowledged | ✅ | Review run 1's [1-M1] (caching/invalidation assumption) resolved inline — added an explicit Caching Architecture Constraint to the story stating "no caching in MVP; grant checks are always a direct query" (2026-07-31), per the review's own suggested resolution. No RISK-ACCEPT needed since this is a direct clarification, not an accepted gap. | Claude (agent), 2026-07-31 |
| W4 | Verification script reviewed by domain expert | ✅ | Acknowledged and proceeding — logged as RISK-ACCEPT in `decisions.md` (2026-07-31); script gets its first walkthrough as the post-merge smoke test instead of pre-code | Hamish King — Product/Platform Owner — 2026-07-31 |
| W5 | No UNCERTAIN gap-table items | ✅ | Gap table states "None" | — |

---

## Oversight level

**Epic-level oversight: Medium**, with an explicit story-level escalation note from both the epic and the NFR profile: this is "the single highest-risk story in the epic" (own Architecture Constraints) and the NFR profile's Gaps table names it for "closer-than-default review at /review and /definition-of-ready" given the `bri-s3.4` precedent. That closer review has now happened: review run 1 scored Traceability/Scope/AC-quality/Completeness/Architecture at 5/5/4/5/5 with 0 HIGH findings, and the DoR contract explicitly names the no-caching design decision that closes the one MEDIUM finding.

> 🔴 Treating this story's oversight as effectively High in practice (not just Medium) given the epic's own explicit escalation — recommend a named human sign-off specifically for this story before assigning to the coding agent, even though the epic default is Medium.

**Signed off by: Hamish King — Product/Platform Owner — 2026-07-31.**

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Agency-Client relationships, shared-access grants, and read-only enforcement — artefacts/2026-07-30-agency-client-organisations/stories/story-2-relationship-grants-enforcement.md
Test plan: artefacts/2026-07-30-agency-client-organisations/test-plans/story-2-relationship-grants-enforcement-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, existing raw http.createServer + pg adapter conventions
- All grant/relationship reads MUST go through one dedicated adapter function — no ad hoc queries in route handlers (story's own Guardrail)
- No caching layer — grant checks are always a direct query (2026-07-31 Architecture Constraint, resolves review [1-M1])
- AC4/AC5 (404-not-403, immediate revocation) are hard requirements — re-run the FULL existing bri-s3.4 tenant-isolation suite unmodified as part of this story's own test run (AC6) and confirm zero regressions before opening a PR
- Architecture standards: read .github/architecture-guardrails.md before implementing. ADR-025 applies directly. Do not introduce anti-patterns.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium (epic default) — treated as effectively High in practice; recommend named human sign-off before assignment given this is the epic's highest-risk story

## Applicable standards
Domain tags: [security, data, auth, web-ui]
- .github/standards/security/security-standards.md (OWASP, input validation, secrets)
- .github/standards/data/data-standards.md (data modelling, validation, residency)
- .github/standards/auth/auth-patterns.md (authentication and authorisation)
- .github/standards/web-ui/web-ui-patterns.md (injectable adapters, session handling — 373 lines, read in full; referenced by path rather than inlined here for length)
```

---

## Sign-off

**Oversight level:** High (self-escalated from Medium epic default, per this story's own Architecture Constraints and the NFR profile's Gaps table)
**Sign-off required:** Yes, named
**Signed off by:** Hamish King — Product/Platform Owner — 2026-07-31
