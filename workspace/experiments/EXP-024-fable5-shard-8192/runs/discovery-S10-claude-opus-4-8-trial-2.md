# /discovery — Loan Ledger Decommissioning & Migration

Before I help shape this program, I want to surface what's stated, what's assumed, and what's missing. The plan reads as confident, but the timeline math and several silent dependencies deserve scrutiny before commitment.

---

## 1. What you've told me (restated for confirmation)

- **Scope:** ~280,000 active loan accounts (personal, home, commercial) + closed-loan records under 7-year retention.
- **Hard deadline:** 12 months — vendor support ends, no extension possible. This is genuinely hard, not negotiable.
- **Plan:** 6 months parallel/shadow operation → validation + reconciliation → staged weekend cutover → 6 months to decommission.
- **Team:** 6 engineers, 1 data architect, 1 PM, plus vendor migration toolset.
- **Primary stated risk:** data integrity (zero loss/corruption, full history).
- **Regulatory:** RBNZ prescribed reports must be reproduced; RBNZ relationship team confirms.

---

## 2. The timeline doesn't reconcile — this is the first thing to fix

Your phases sum to **18 months** (6 parallel + 6 to cutover-prep + 6 to decommission), but your hard wall is **12 months**.

Let me lay out what I think you mean, because two readings are possible:

- **Reading A:** The 6-month decommission window runs *after* the 12-month support cliff. → **Unacceptable.** You'd be running the legacy system unsupported (no security patches) for up to 6 months while decommissioning it. For a regulated lender holding 280k consumer credit contracts, running an unpatched core banking component is a regulatory and security exposure RBNZ would not look kindly on.
- **Reading B:** Everything must complete inside 12 months. → Then your real cutover deadline is ~month 6, your validation window is razor-thin, and the "6 months to decommission" is happening in parallel — which contradicts "if results are satisfactory, cut over."

**Question 1 (blocking):** Does the entire program — including decommission — complete before the 12-month support cliff, or does decommission extend beyond it? If beyond, what is your security/regulatory posture for running an unsupported core?

I'd recommend the program be structured so that **cutover completes no later than month 8–9**, leaving genuine contingency *before* the cliff — not after it. Migrations of this class routinely slip; you have no room to slip into an unsupported window.

---

## 3. The silent assumption that worries me most: "mirror all transactions to the new platform"

Your shadow-mode plan says existing accounts "run on legacy with all transactions mirrored to the new platform." This single sentence hides the hardest engineering problem in the program, and the plan treats it as a given.

To mirror transactions, the new platform must already be able to **correctly process every transaction type the legacy system handles** — interest accrual methods, fee structures, arrears/default handling, restructures, hardship arrangements, early repayments, redraw, offset interactions with the deposit core, security release. For loans built over 18 years, there are almost certainly behaviors encoded in the legacy system that nobody has documented.

**Questions:**
- **Q2:** Has the new platform been proven to *replicate the financial calculations* of the legacy system to the cent, across all three loan types? Personal/home/commercial have materially different mechanics (e.g., commercial facilities, multi-drawdown, covenants).
- **Q3:** What is the source of truth during the 6-month parallel period? If legacy is authoritative and the new platform shadows it, a divergence in calculated interest on day 30 compounds for 150 days before cutover. How are divergences detected *continuously*, not just at the 6-month reconciliation pass?
- **Q4:** Is there documented knowledge of the legacy system's edge-case behaviors, or is it tribal/undocumented? An 18-year-old system usually has undocumented logic that only surfaces under specific account states.

The reconciliation pass at month 6 is described as a gate. But if mirroring has been silently diverging, you discover that at month 6 with almost no time to remediate. **Reconciliation must be continuous from day one, with daily/weekly divergence reports**, not a single end-of-period event.

---

## 4. Team capacity vs. scope — this looks thin

Six engineers + one data architect for a regulated 280k-account core migration with parallel running, continuous reconciliation, regulatory report rebuild, and a 12-month cliff.

**Q5:** Is this team net-new, or are these people *also* maintaining the legacy system and supporting the existing deposit core during the migration? You cannot run legacy in production AND build the new loan capability AND do reconciliation with one team unless these are dedicated.

**Q6:** A single data architect is a key-person risk on the highest-risk workstream. What's the bus-factor mitigation?

I'd also flag missing roles the plan doesn't mention: **reconciliation/QA lead, regulatory reporting SME, business/operations representation** (the people who actually service these loans and know the edge cases), **security/risk**, and **legal** beyond the one retention confirmation.

---

## 5. Regulatory scope is understated

The plan treats RBNZ as "reproduce the prescribed reports." That's necessary but likely not sufficient.

- **Q7:** Is this migration itself a notifiable/material change to RBNZ under your conditions of registration or outsourcing policy (BS11)? A core system change for a registered bank often requires advance notification or non-objection, not just report sign-off at the end.
- **Q8:** Beyond RBNZ prudential reporting — what about **credit reporting** (to credit bureaus), **CCCFA** disclosure obligations on consumer credit contracts, **AML/CFT** monitoring continuity, and **tax reporting** (RWT/RLWT where relevant)? Loans touch more reporting regimes than RBNZ prudential returns alone.
- **Q9:** When in the timeline does the RBNZ relationship team need report validation complete? If that's a precondition to cutover and it sits in the critical path, it must be pulled forward — regulator review cycles are not fast.

---

## 6. Other gaps the plan is silent on

| Area | Question |
|---|---|
| **Rollback** | Q10: If the weekend cutover fails validation, what is the rollback plan? Once you've cut accounts over and processed transactions on the new platform, can you go back to legacy cleanly? |
| **Staged cutover risk** | Q11: A staged weekend migration implies multiple weekends. During staging, accounts are split across two systems — how is a customer with multiple products (loan + deposit + offset) handled mid-stage? |
| **Security registrations** | Q12: Migrating "security registrations" may involve the PPSR (Personal Property Securities Register) and Land Information NZ for mortgages. Are these external register dependencies in scope, and do they require re-registration or just record migration? This can have legal-validity consequences. |
| **Data quality at source** | Q13: Has the legacy data been profiled? 18-year-old data typically contains nulls, orphaned records, and inconsistencies. "No record lost or corrupted" presumes the source is clean — but you may need a remediation pass *before* migration even starts. |
| **Closed-loan/retention data** | Q14: Does retained closed-loan data go into the live new platform, or to a separate compliant archive? Loading 7 years of closed loans into the live core may be unnecessary and adds risk; an archive may serve the legal retention need better. |
| **Customer & operational impact** | Q15: What's the customer comms and staff-training plan? Operations staff servicing loans need to learn the new platform; statements, payment references, and direct debits may change. |
| **New originations during parallel** | Q16: New loans go onto the new platform from day one. Is the new platform's loan origination capability already live and proven, or is it being built concurrently? If concurrent, that's a second major workstream competing for the same team. |

---

## 7. My read on overall risk posture

The plan is well-intentioned and the phasing instinct (parallel running, validate, staged cutover) is correct. But it currently reads as **optimistic on three fronts**:

1. **Timeline** — phases exceed the hard deadline; no genuine contingency *before* the cliff.
2. **The hardest problem (transaction mirroring + calculation fidelity) is stated as an assumption, not a derisked fact.**
3. **Team and regulatory scope appear under-sized** for a regulated core migration.

None of these are fatal. All are fixable. But they should be resolved in discovery, not discovered in month 5.

---

## 8. Recommended next steps

1. **Resolve the timeline reconciliation (Q1)** — replan so cutover *and* decommission complete with contingency before the support cliff. This may mean compressing parallel running or starting sooner.
2. **De-risk calculation fidelity early** — run the new platform's loan engine against a representative sample of all three loan types and prove cent-level parity *before* committing to mirror-based parallel running.
3. **Profile the legacy data** — quantify data quality issues now; scope a remediation workstream if needed.
4. **Confirm regulatory change obligations with RBNZ** — is this notifiable? Get that answer before deep planning.
5. **Validate team sizing** against the full workstream map, including reconciliation, reporting, origination, and operations.
6. **Define rollback and the source-of-truth model** for the parallel period.

---

**Would you like me to:**
- (a) Build out a full workstream and dependency map with a revised timeline against the 12-month cliff, or
- (b) Drill into the highest-risk area first — the transaction-mirroring / calculation-fidelity problem?

I'd suggest we start by getting answers to **Q1 (timeline)**, **Q2/Q3 (calculation fidelity & source of truth)**, and **Q5 (team dedication)**, since those determine whether the rest of the plan stands.