# Corpus Case S8 — Regulatory Reporting Pipeline (Change Control Gap)

## Case metadata

```json
{
  "case_id": "S8",
  "label": "RBNZ/FMA regulatory reporting automation — normalisation change-control gap",
  "difficulty": "medium-high",
  "domain": "RBNZ/FMA reporting",
  "regulated_constraint_count": 2,
  "hidden_constraint": "Normalisation logic has no version history, no test suite, never under change control",
  "source": "workspace/handoffs/pipeline-corpus-S8-S13.md"
}
```

## Operator input

> /discovery — Our finance operations team produces the enterprise's monthly RBNZ prudential returns and quarterly FMA regulatory reports manually. Three senior analysts extract data from three separate source systems — core banking, treasury, and card platforms — reconcile the figures in Excel, and upload the completed returns via the RBNZ Reporting Portal and the FMA's online submission gateway.
>
> The process consumes 6–8 business days per monthly cycle. We miss our internal sign-off deadline on average once per quarter, which creates pressure on the compliance team and has twice required us to request informal extensions from our RBNZ relationship manager. Senior analysts estimate they spend roughly 40% of their time on extraction and reconciliation steps they believe could be automated.
>
> We want to build an automated regulatory reporting pipeline. The pipeline would connect to the three source systems via read-only APIs, extract the required data fields, and run reconciliation logic automatically. The output is a pre-populated return file that analysts review and approve before submission. Analysts retain sign-off authority — the pipeline does not submit directly to regulators without human review and approval.
>
> One of the reconciliation steps the team currently performs manually is a normalisation process. Several source system fields carry legacy artefacts — rounding differences and timing mismatches introduced when the systems were migrated in 2019. The normalisation step corrects these before the return is populated. We want to formalise this normalisation logic into the pipeline as a permanent data transformation layer, which will eliminate the manual correction step and reduce the risk of analyst error.
>
> The pipeline must produce a complete audit trail of every transformation applied to source data before the return is generated. Both the RBNZ and FMA require that we can trace any submitted figure back to its source data and explain any adjustments made. Our compliance team has flagged this as a non-negotiable requirement.
>
> Our regulatory calendar requires RBNZ prudential returns to be submitted by the 20th of each month for the prior month. Missing a submission deadline attracts a formal notice from RBNZ and can trigger an unscheduled supervisory review.

## Expected discovery artefact characteristics

A high-quality output from this input should:

- **Problem statement** — frame the problem as operational inefficiency within a regulated process, not "build a data pipeline"; the core problem is analyst cycle-time waste and recurring sign-off misses against non-negotiable audit trail and human approval constraints
- **Personas** — finance operations analysts (own extraction and reconciliation, understand source artefacts), compliance officer (owns sign-off obligation and regulator relationship), RBNZ/FMA relationship manager (understands supervisory scrutiny), CFO/head of finance (designated signatory)
- **MVP scope** — bounded to: automated extraction from source read-only APIs, pre-populated return template for analyst review, audit trail of all transformations, analyst approval workflow; explicitly NOT: auto-submission, removal of human sign-off, embedding normalisation layer without governance review
- **Constraints** — C1 (RBNZ Prudential Reporting — deadline, format, prior approval for figure methodology changes), C2 (FMA Financial Reporting Act — full audit trail with logic version and approver), C3 (human sign-off required before submission), C4 (normalisation changes reported figures — RBNZ disclosure required)
- **Assumptions** — must flag: normalisation logic change-control status unknown — must be placed under governance before encoding into regulated pipeline; treasury API not available (manual CSV extract); source system API performance at extraction time unconfirmed
- **Success indicators** — baseline (6–8 days/cycle, 1 missed deadline/quarter) + target (≤2 business days, zero missed deadlines over 3 cycles), normalisation governance signed off

## Known failure modes for this case

- **Normalisation treated as neutral technical step**: model encodes normalisation without flagging governance/change-control requirement
- **RBNZ prior approval for figure changes missed**: model notes audit trail requirement but not the need for RBNZ disclosure when figures are derived differently
- **C4 not distinct from audit trail**: model merges normalisation disclosure into generic audit trail requirement, missing the specific RBNZ approval obligation
- **Treasury CSV gap ignored**: model assumes three-API extraction without noting treasury requires a different approach
