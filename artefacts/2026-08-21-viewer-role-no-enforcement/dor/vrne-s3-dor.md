# Definition of Ready: Wire the viewer-write-block gate to Credits/billing routes

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s3-credits-billing.md`
**Test plan reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s3-test-plan.md`
**Contract proposal:** `artefacts/2026-08-21-viewer-role-no-enforcement/dor/vrne-s3-dor-contract.md`
**Assessed by:** Copilot
**Date:** 2026-08-22

---

## Contract Review

Reviewed the Contract Proposal against all 4 ACs and the test plan. No mismatches — single-route wiring plan plus the explicit webhook-unaffected regression test aligns with AC1–AC4.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 1, AC2: 2, AC3: 1, AC4: 1 |
| H4 | Out-of-scope section is populated | ✅ | 4 items named |
| H5 | Benefit linkage field references a named metric | ✅ | |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH; 1 MEDIUM inherited from `vrne-s1`, tracked |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` — code-level dependency on `vrne-s1`, no field to validate |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ | Condition does not trigger |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ | Condition does not trigger — no named regulatory clause |
| H-NFR3 | Data classification field not blank | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence when story NFRs populated | ✅ | |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank named entry | ✅ | Same as `vrne-s1` |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new adapter |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | Inherited, tracked under `vrne-s1`'s ARCH entry |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged — `decisions.md`, 2026-08-22 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | — |

---

## Oversight level

**Medium** — same basis as the other 3 stories. Operator confirmed awareness, 2026-08-22.

---

## Standards injection

**Domain tags:** `web-ui`, `security`, `auth`, `payments`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/security/security-standards.md`, `.github/standards/auth/auth-patterns.md`, `.github/standards/payments/payments-standards.md`

`web-ui`/`security`/`auth` full text is identical to `vrne-s1-dor.md` — see that file. `payments` is new to this story:

#### `.github/standards/payments/payments-standards.md`

```
# Payments Standards

## PCI-DSS scope

[e.g. This service is in scope for PCI-DSS SAQ A-EP. Card numbers (PANs) are never stored — tokenised via payment gateway before persistence.]

## Tokenisation

[e.g. Raw PANs must never be logged, stored, or passed between services. All card data tokenised at point of capture via gateway SDK. Token stored, never PAN.]

## Retry and idempotency

[e.g. All payment requests include a client-generated idempotency key. Retries use same key. Maximum 3 retries with exponential backoff.]

## Failure handling

[e.g. Payment failures return a structured error with a decline code. No retry on hard declines (do_not_honour, invalid_card). Retry permitted on soft declines (insufficient_funds) with user consent.]

## Audit logging

[e.g. Every payment event (initiated, authorised, settled, refunded, declined) logged with: payment ID, amount, currency, timestamp, masked PAN (last 4), result code. Logs retained for 7 years.]

## Prohibited patterns

- No logging of full PANs, CVVs, or expiry dates
- No storing CVVs under any circumstances
- No client-side payment logic that bypasses gateway
```

Note: this repo's `payments-standards.md` is largely template-placeholder text (not yet filled in with this repo's specific PCI scope). The one directly relevant, non-placeholder fact for this story: Stripe Checkout is hosted, so PANs never touch this app — confirmed at `/definition`, not something this story's own implementation needs to handle.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Wire the viewer-write-block gate to Credits/billing routes — artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s3-credits-billing.md
Test plan: artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Requires vrne-s1 to be DoD-complete first — import requireNonViewer, do not reimplement it
- Wire requireNonViewer into exactly the one call site in routes/billing.js's POST /billing/checkout handler
- Do NOT touch /webhook/stripe — it has no session/role concept; AC4's test must confirm this route is genuinely unaffected
- Node.js built-ins only — no new npm dependencies
- Denial logging: same structured JSON convention as the other 3 stories
- No PCI-scope work required — Stripe Checkout stays hosted, this story only gates who can initiate it
- Architecture standards: read .github/architecture-guardrails.md before implementing. Applicable domain standards (auth-patterns.md, security-standards.md, web-ui-patterns.md, payments-standards.md) — see vrne-s1-dor.md and this file for full text
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech-lead awareness (operator confirmed directly, 2026-08-22)
**Signed off by:** Hamish King, 2026-08-22
