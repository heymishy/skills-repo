# Definition of Ready: Client org self-service conversion to an independent paying account

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-6-conversion-to-independent.md
**Test plan reference:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-6-conversion-to-independent-test-plan.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-07-31

---

## Contract Proposal

See `story-6-conversion-to-independent-dor-contract.md`. Summary: in-place `org_type` update gated by the role model established in Story 3, redirecting into the existing, unmodified Stripe checkout mechanism.

## Contract Review

Checked against all 4 ACs and the test plan's 13 tests. AC1's role-gate precondition (added 2026-07-31, resolving review [1-H1]) is reflected directly in the contract's test approach (admin-allowed/non-admin-rejected pair). No mismatch found.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As a Client org member..." |
| H2 | ≥3 ACs in G/W/T format | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 13 tests across 4 ACs |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | Indirect linkage to Metric 1, explicitly framed as such — now also reflected in `benefit-metric.md`'s Coverage Matrix (added 2026-07-31, resolves review [1-M1]) |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review run 2 — PASS, 0 HIGH (role-model gap [1-H1] resolved) |
| H8 | Test plan has no uncovered ACs | ✅ | No gaps (1 LOW: AC4 concurrency final-state wording, not blocking) |
| H8-ext | Cross-story schema dependency | ✅ | Upstream: Story 1, Story 3. `schemaDepends: [stage, reviewStatus]` — both present in pipeline-state.schema.json |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-025, ADR-026 + role-model ARCH decision cited; Architecture compliance scored 5 |
| H-E2E | CSS-layout-dependent AC gap | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Present (Story 6 not individually itemised in nfr-profile.md's tables, but the story's own NFR section is fully populated and not "None" — H-NFR-profile only requires the profile document exist, which it does) |
| H-NFR2 | Compliance clause sign-off | ✅ N/A | No compliance framework named |
| H-NFR3 | Data classification not blank | ✅ | "Confidential" (feature-level, applies) |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Approved By | ✅ | "Hamish King — Product/Platform Owner — 2026-07-30" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new injectable adapter — reuses the existing, already-wired `createCheckoutSession` function unmodified |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | Review run 2's [1-M1] (benefit-metric coverage matrix omission) resolved inline — added a row to `benefit-metric.md`'s Metric Coverage Matrix (2026-07-31), per the review's own suggested wording. No RISK-ACCEPT needed. | Claude (agent), 2026-07-31 |
| W4 | Verification script reviewed by domain expert | ✅ | Acknowledged and proceeding — logged as RISK-ACCEPT in `decisions.md` (2026-07-31); script gets its first walkthrough as the post-merge smoke test instead of pre-code | Hamish King — Product/Platform Owner — 2026-07-31 |
| W5 | No UNCERTAIN gap-table items | ✅ | 1-L1 (concurrency final-state wording) is a LOW note, not an UNCERTAIN gap-table entry | — |

---

## Oversight level

**Epic-level oversight: Medium.** This story triggers real billing (Stripe checkout) for a converting org, per the epic's own oversight rationale.

> ⚠️ Medium oversight — share the DoR artefact with the tech lead before assigning.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Client org self-service conversion to an independent paying account — artefacts/2026-07-30-agency-client-organisations/stories/story-6-conversion-to-independent.md
Test plan: artefacts/2026-07-30-agency-client-organisations/test-plans/story-6-conversion-to-independent-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, existing raw http.createServer + pg adapter conventions
- Conversion updates org_type in place on the SAME organisations row (same org_id) — never create a second org or migrate data
- Gate conversion server-side on team_memberships.role === 'admin' for the converting org (AC1) — reuse the existing resolveRoleForPerson/requireAdmin-equivalent pattern, do not build a new permission check
- Redirect into the EXISTING createCheckoutSession Stripe flow (routes/billing.js) unmodified — no new billing/payment code
- AC4's concurrency test must exercise real interleaving (not a sequential call in disguise) between conversion and a concurrent grant-creation call
- Architecture standards: read .github/architecture-guardrails.md before implementing. ADR-025 and ADR-026 apply directly.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium

## Applicable standards
Domain tags: [payments, web-ui]
- .github/standards/payments/payments-standards.md (PCI-DSS, tokenisation, retry limits — note: this story introduces no new payment code, but read for context on the reused checkout mechanism's constraints)
- .github/standards/web-ui/web-ui-patterns.md (injectable adapters, session handling — 373 lines, read in full; referenced by path rather than inlined here for length)
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Hamish King — Product/Platform Owner — 2026-07-31 (acknowledged)
