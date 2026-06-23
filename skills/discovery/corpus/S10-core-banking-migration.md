# Corpus Case S10 — Core Banking Loan Migration (RBNZ BS11 Notification Timing)

## Case metadata

```json
{
  "case_id": "S10",
  "label": "Legacy loan ledger decommission — RBNZ BS11 notification not filed",
  "difficulty": "very-high",
  "domain": "RBNZ BS11 / CCCFA",
  "regulated_constraint_count": 3,
  "hidden_constraint": "RBNZ BS11 30-business-day notification not filed — window already open at project initiation",
  "source": "workspace/handoffs/pipeline-corpus-S8-S13.md"
}
```

## Operator input

> /discovery — We are decommissioning the enterprise's legacy loan ledger system, which has been in production for 18 years. Approximately 280,000 active loan accounts — personal loans, home loans, and commercial lending — are currently managed by this system. We have been running a new core banking platform for deposit accounts for 14 months and it is working well. We want to migrate all loan accounts to the same platform so we can retire the legacy system and operate a single core.
>
> The legacy system vendor has confirmed that their support contract ends in 12 months. After that date, the system receives no patches, no security updates, and no vendor support. Extending the contract is not an option — the vendor is withdrawing the product from the market. The 12-month window is our hard cutover deadline.
>
> Our migration plan calls for a 6-month parallel operation period. During this period both systems will run simultaneously: new loan originations go onto the new platform from day one, while existing accounts run on the legacy system in shadow mode with all transactions mirrored to the new platform. At the 6-month mark we will validate data integrity, run a reconciliation pass, and if the results are satisfactory, cut over remaining legacy accounts in a staged weekend migration. We have 6 months from cutover to decommission and formally retire the legacy infrastructure.
>
> Data integrity is the primary technical risk. We must migrate all 280,000 loan records with full history — original loan terms, drawdown history, repayment schedules, arrears status, and any associated security registrations. No loan record can be lost or corrupted in migration. Our legal team has confirmed that credit contract records must be retained for 7 years under applicable consumer finance legislation, so even records for closed loans that were migrated need to be preserved.
>
> We will need to ensure the new platform produces all RBNZ regulatory reports that the legacy system currently generates. The format and field definitions of these reports are prescribed. Our RBNZ relationship team will need to be involved in confirming the reports produced by the new platform meet RBNZ requirements.
>
> The project will be run in-house with the new platform vendor providing a migration toolset. We anticipate the project team will be six engineers, one data architect, and a project manager.

## Expected discovery artefact characteristics

A high-quality output from this input should:

- **Problem statement** — frame the problem as a forced migration under a hard vendor deadline with a regulatory data integrity and reporting obligation; the forcing function is the vendor contract end-date; the risk is data loss, regulatory reporting continuity, and unacknowledged RBNZ notification obligations
- **Personas** — loan account holders (affected by migration-induced service disruption), retail lending operations (own the loan portfolio), RBNZ relationship team (must confirm report equivalence and manage notification), new platform vendor migration team (own the toolset), CTO/CRO (accountable for migration risk and RBNZ relationship)
- **MVP scope** — bounded to: data migration toolchain + parallel validation framework + regulatory report equivalence confirmation + RBNZ notification and sign-off; explicitly NOT new loan origination features on the new platform
- **Constraints** — C1 (RBNZ BS11 — material changes to core banking require 30-business-day advance notification before implementation), C2 (CCCFA — zero data loss for all 280,000 loan records, 7-year credit contract retention), C3 (vendor support deadline — 12-month hard cutover, no extension), C4 (RBNZ parallel operation expectation — shadow run with sign-off criteria)
- **Assumptions** — must flag: RBNZ BS11 notification status unknown — must be confirmed before project activity proceeds; notification window may already be open; 3 of 14 RBNZ report types not yet available on new platform; PPSR security registration transfer requires legal opinion
- **Success indicators** — 100% loan accounts migrated with zero record loss, RBNZ reports produced equivalently on new platform, legacy decommissioned within 12-month deadline, RBNZ BS11 notification filed and acknowledged before project start

## Known failure modes for this case

- **RBNZ notification as validation step**: model treats RBNZ involvement as a month-10 validation step rather than a pre-project obligation
- **BS11 not named**: model notes "RBNZ relationship team involvement" without identifying the specific BS11 notification requirement and its 30-business-day lead time
- **PPSR transfer gap ignored**: model migrates security registrations without noting the potential PPSR re-registration legal question
- **Report gap not surfaced**: model assumes 14/14 report types available without noting the 3-type gap that requires configuration/development
