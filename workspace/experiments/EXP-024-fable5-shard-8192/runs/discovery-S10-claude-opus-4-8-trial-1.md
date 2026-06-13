# /discovery Pipeline — Loan Ledger Decommission & Migration

Before I commit to plan structure, I want to surface what's underspecified or risky in this brief. A clean-looking timeline here masks several hard dependencies. Let me work through the discovery rather than just affirming the plan.

## What you've told me clearly

- **Hard deadline:** 12 months to vendor support end. Non-negotiable, non-extendable.
- **Scope:** 280,000 active loan accounts, full history, three loan classes.
- **Approach:** 6-month parallel run → validate/reconcile → staged weekend cutover → 6-month decommission window.
- **Team:** 6 engineers, 1 data architect, 1 PM. In-house, vendor toolset.
- **Constraints:** RBNZ regulatory reporting, 7-year retention, zero data loss/corruption.

## Where the plan has tension I want to challenge

### 1. The timeline arithmetic doesn't close cleanly

You have 12 months to hard cutover. Your plan is 6 months parallel run, then cutover, then 6 months decommission. But:

- The 6-month parallel run **cannot start on day one** of the project. You need to build and validate the migration toolset, map the legacy schema, build the RBNZ reports, and stand up shadow-mode mirroring *first*. That's pre-parallel-run work.
- If parallel run is 6 months and you need (say) 2–3 months of build before it can begin, your parallel run ends at month 8–9, leaving 3–4 months to cutover — **inside** the 12-month deadline, which is fine — but your "6 months to decommission" then runs *past* the support-end date.

**The question this forces:** Is the 12-month deadline the date you must be *off* the legacy system (cutover complete), or the date the legacy system must be *fully decommissioned*? These are very different. If decommission must also complete in 12 months, your parallel run probably can't be a full 6 months. **Which is it?**

### 2. "Shadow mode with all transactions mirrored" is the highest-risk assumption in the brief

Mirroring live transactions from an 18-year-old legacy system to a new platform in real time is a significant engineering undertaking, not a given. I need to know:

- Does the legacy system **emit transaction events** you can subscribe to, or will you be polling/batch-extracting and replaying?
- Is the mirroring **one-way** (legacy → new) during shadow mode, or does the new platform also need to feed anything back?
- What happens to a mirrored transaction that **fails to apply** on the new platform — does it block, queue, drop, or alert? This is where silent corruption enters.

If real-time mirroring proves infeasible, your parallel-run validation strategy changes fundamentally (you'd validate against point-in-time snapshots instead). This is a discovery item that could reshape the whole plan, so it should be **spiked early**, not assumed.

### 3. Data integrity validation needs a definition *now*, not at month 6

You've named data integrity as the primary risk but the plan validates it at the 6-month mark. That's late. By month 6 you've committed the whole parallel run to an approach you haven't proven.

- How do you define a "correct" migration for a single loan? You need a **reconciliation specification** — field-level, with tolerances (e.g., are rounding differences in accrued interest acceptable or not?).
- Some legacy data after 18 years will be **dirty**: nulls, legacy codes, accounts in states the new platform doesn't model, historical loans under superseded product definitions. You will find records that *cannot* migrate cleanly. The plan has no provision for this exception class.

**Recommendation:** A data-profiling / quality-assessment phase belongs *before* parallel run, ideally in the first month. You need to know the shape of the dirt before you build the toolset around it.

### 4. RBNZ reporting is a parallel critical path you've under-resourced in narrative

"We will need to ensure the new platform produces all RBNZ reports" is a large workstream:
- Inventory every report the legacy system produces (do you have a complete list?).
- Confirm prescribed formats/field definitions against current RBNZ requirements (which may have changed in 18 years).
- Build/configure, then run **both systems in parallel and reconcile the reports against each other** during the parallel run — this is a genuine benefit of parallel operation you should exploit.
- RBNZ relationship team sign-off has **external lead time you don't control.** Engage them in month 1.

### 5. Team capacity reality check

6 engineers + 1 data architect is lean for: migration tooling, shadow-mode mirroring, RBNZ reports, reconciliation tooling, *and* running BAU support on a system being decommissioned. The single data architect is a **key-person bottleneck** on the most critical-path activity (schema mapping + reconciliation spec). What's your bus-factor mitigation?

## Open questions I need answered before producing a phased plan

| # | Question | Why it blocks planning |
|---|----------|------------------------|
| 1 | Does the 12-month deadline mean cutover-complete or decommission-complete? | Determines whether 6-month parallel run is even feasible |
| 2 | Can the legacy system emit transaction events for mirroring, or is it batch-extract only? | Reshapes the entire parallel-run validation model |
| 3 | Do you have a complete inventory of the RBNZ reports in scope? | External sign-off is on the critical path |
| 4 | Has any data profiling been done on the 280k records? Known dirty-data volume? | Determines exception-handling scope |
| 5 | What is the migration toolset the vendor provides — does it handle full history, or just current balances? | "Full history" is a much harder migration than current state |
| 6 | Is there a rollback plan if the weekend cutover fails mid-flight? | A staged weekend migration of 280k accounts needs an abort/rollback design |
| 7 | What's the 7-year-retention target — does retained data live on the new platform, or in a separate archive? | Affects migration scope (do closed loans go to the live platform or an archive store?) |

## Proposed discovery output structure (once questions are answered)

I'd recommend phasing it as:

1. **Phase 0 — Discovery & Profiling (Month 1):** schema mapping, data quality assessment, RBNZ report inventory, mirroring feasibility spike, reconciliation spec drafting, RBNZ team engagement.
2. **Phase 1 — Build (Months 2–3):** migration toolset config, shadow-mirroring pipeline, RBNZ reports, reconciliation tooling, exception-handling for dirty data.
3. **Phase 2 — Parallel Run (shortened to fit deadline):** continuous reconciliation (not a single month-6 pass), RBNZ report comparison, dirty-data remediation.
4. **Phase 3 — Cutover:** staged weekend migration with defined rollback gates.
5. **Phase 4 — Decommission:** *only if it fits inside the deadline per Q1.*

---

**My strongest single recommendation:** move data integrity validation from a month-6 milestone to a **continuous activity that starts the day mirroring goes live**, and front-load a profiling spike in month 1. Validating integrity once, near the deadline, with no slack and a hard vendor cutoff behind you, is the failure mode most likely to sink this.

Answer the seven questions above and I'll produce the full phased plan with dependencies, critical path, and risk register.