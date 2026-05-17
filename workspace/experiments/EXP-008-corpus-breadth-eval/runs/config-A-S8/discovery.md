# Discovery: Automated Regulatory Reporting Pipeline — RBNZ and FMA Return Automation

**Status:** Approved (eval-mode — EXP-008-corpus-breadth-eval / Config A / S8)
**Feature slug:** regulatory-reporting-pipeline-automation
**Date:** 2026-05-17
**Skill version:** /discovery
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S8

---

## Step 0 — Context check (eval-mode log)

**Context injection files active:**
- `S8-ea-registry-regulatory-reporting-pipeline.md` — EA registry entry for the proposed Regulatory Reporting Pipeline (PROPOSED status). Interface map: CoreBanking-GL (RRPL-UP-001), TreasuryLedger (RRPL-UP-002), CardPlatform (RRPL-UP-003) as read-only upstream sources; RBNZ Reporting Portal (RRPL-DN-001) and FMA Submission Gateway (RRPL-DN-002) as downstream submission channels. Audit and governance interfaces: PostgreSQL immutable audit log (RRPL-AUD-001), SharePoint analyst review workflow (RRPL-AUD-002). Regulatory obligations table includes BS11 s.4.2 (30-business-day advance notification before implementing a material technology change affecting a return). Risk inventory: RRPL-RISK-002 (single-author normalisation transformation — no independent review on record; severity: HIGH) and RRPL-RISK-003 (RBNZ has not been notified that normalised figures have been submitted in prudential returns; severity: HIGH). Change control requirements: any change to transformation logic must follow Finance Operations Change Control Procedure including independent technical review, compliance sign-off, RBNZ notification, and CAB approval before production deployment.
- `S8-rbnz-fma-policy-doc.md` — Synthetic regulatory paraphrase of: RBNZ Prudential Reporting Standards s.2.1 (prior written notification required before any adjusted methodology is first used in a submitted return; institution may not self-certify materiality exemption), s.2.2 (any transformation, normalisation, or correction applied to source data before populating a return field constitutes a methodology adjustment triggering s.2.1 notification; unapproved adjustments create self-disclosure obligation), s.2.3 (automated system requirements: approved change-controlled derivation logic; transformation log with sufficient detail to reconstruct any figure; 7-year retention; 5-business-day producibility to RBNZ; subject to BS11), s.3.1 (submission deadline: 20th calendar day of following month; failure constitutes reporting default — written notice to CFO, supervisory records, possible unscheduled review after 3 defaults in 12 months), s.4.2 (BS11 material change notification at least 30 business days before implementation; includes automation of a previously manual normalisation step that affects reported figures; both s.2.1 and BS11 notifications required when methodology and technology both change); FMA Regulatory Returns Guide 2022 s.2.1 (complete audit trail: source data log, transformation log with rule ID/version/logic/approver/input-output values, review and approval log, submission confirmation), s.2.2 (automated systems must produce machine-readable immutable logs retained for 7 years), s.3.1 (5-business-day producibility obligation for any return in preceding 7 years), s.4.1 (all derivation logic including Excel-based calculations and macros must be subject to formal change management), s.4.2 (legacy and informal logic being formalised into an automated pipeline must be: documented with precision for independent reproduction, independently technically reviewed, governance sign-off obtained, both FMA and RBNZ notified before formalised logic is used in a submitted return; legacy logic must be retained alongside formalised version for audit completeness).

**Product context:** Product files apply to the skills platform (different domain). Not pre-populated.

**EA registry signals active:**
- RRPL-RISK-002: Normalisation transformation exists only in an Excel macro written by one analyst. No independent review of transformation logic on record. Severity: HIGH.
- RRPL-RISK-003: RBNZ has not been notified that normalised figures have been submitted in prudential returns. Severity: HIGH.
- BS11 s.4.2 obligation: 30 business days advance notification before implementing material technology change (automation of a manual normalisation step affecting regulatory return figures qualifies).
- Change control requirement: any change to transformation logic requires independent technical review, compliance sign-off, RBNZ notification, and CAB approval before production deployment.

---

## Problem Statement

The finance operations team produces RBNZ monthly prudential returns and quarterly FMA regulatory reports through a manual process: three senior analysts extract data from three separate source systems — core banking, treasury, and card platforms — reconcile the figures in Excel, and upload completed returns via the RBNZ Reporting Portal and FMA Submission Gateway. This process consumes 6–8 business days per monthly cycle. The team misses its internal sign-off deadline on average once per quarter, and informal extension requests have been submitted to the RBNZ relationship manager twice. Senior analysts estimate 40% of their time is spent on extraction and reconciliation steps they believe could be automated.

The automation opportunity is genuine and technically tractable. However, the path to go-live is substantially constrained by a set of regulatory disclosure and governance obligations that must be resolved before any automated pipeline produces figures that enter a regulatory submission.

The most consequential constraint — and one requiring immediate governance attention before build scope is committed — concerns the normalisation step the team proposes to automate. This step currently exists as an Excel macro written by one analyst during the 2019 source system migration. The macro has never been independently reviewed, has no change control history, and the analyst who wrote it is the only person who fully understands its correction rules. Critically, this normalisation has been applied to every prudential return submitted since 2019. RBNZ has been receiving normalised figures without any notification that a transformation has been applied to raw source data. Under RBNZ Prudential Reporting Standards s.2.2, any transformation applied to source data before populating a return field constitutes a methodology adjustment requiring prior written RBNZ notification (s.2.1). That notification has never been filed. The institution is also exposed to the s.2.2 self-disclosure obligation: institutions that discover they have been applying unapproved adjustments to submitted returns are required to self-disclose to RBNZ's prudential reporting team.

Additionally, the FMA Regulatory Returns Guide 2022 s.4.2 is unambiguous: where an institution has been using informal or undocumented logic (including an analyst-maintained spreadsheet calculation) to derive a regulatory return figure, and that logic is now being incorporated into an automated pipeline, the institution must document the logic, subject it to independent technical review, obtain governance sign-off, and notify both FMA and RBNZ before the formalised logic is used in any submitted return.

Encoding an unreviewed, single-author Excel macro directly into a regulated return pipeline — without independent review, change control, or regulatory notification — would create an indefensible governance position in any supervisory review or FMA examination.

The problem is therefore two-layered:

1. **Operational efficiency gap:** The manual process is slow and error-prone. Automation is the correct strategic direction.
2. **Pre-existing regulatory disclosure and governance gap:** The normalisation logic being proposed for automation has never been disclosed to RBNZ, has never been independently reviewed, and has no change control history. This gap must be resolved through a formal governance process before the normalisation layer can be encoded into any regulated return pipeline.

---

## Who It Affects

**Finance operations analysts (primary users):** Responsible for the monthly and quarterly return cycle. The proposed pipeline changes their role from manual extraction and reconciliation to review and approval of pre-populated returns. They retain sign-off authority — analyst approval is mandatory before any return is submitted to a regulator.

**Compliance officer:** Owns the regulatory relationship with RBNZ and FMA. Responsible for filing the RBNZ s.2.1 methodology notification, the BS11 technology change notification, and the FMA methodology formalisation notification before the pipeline goes live. Also responsible for managing the self-disclosure obligation arising from RRPL-RISK-003 (historical unapproved normalisation in submitted returns).

**RBNZ relationship manager:** Receives the BS11 technology change notification and the s.2.1 methodology notification. The self-disclosure of historical unapproved normalisation must be managed carefully with this relationship.

**CFO / designated finance officer:** Signs off regulatory returns before submission. The pipeline must produce an auditable record of the CFO's sign-off for every return period. The RBNZ s.3.1 reporting default (missed deadline) results in a written notice addressed to the CFO — the go-live of the pipeline directly affects the CFO's regulatory exposure.

**Head of finance / Finance Operations Manager:** Business owner for the pipeline. Responsible for ensuring all compliance pre-conditions are resolved before committing engineering resources to the transformation layer. Specifically responsible for resolving the governance status of the normalisation logic (B2 blocker) before build scope is committed.

---

## MVP Scope

The minimum deliverable that achieves the operational efficiency objective while satisfying all mandatory compliance pre-conditions:

1. **Automated source data extraction** — read-only API connections to CoreBanking-GL (RRPL-UP-001) and CardPlatform (RRPL-UP-003) for extraction of prescribed return fields; structured ingestion of treasury data via manual CSV handoff from treasury operations (TreasuryLedger has no regulatory-data API in the vendor's standard offering; manual extract coordination with treasury operations until vendor API is available or commissioned).

2. **Versioned, change-controlled normalisation transformation layer** — apply the formalised normalisation rules (gated: Story 1.2 independent review must be complete, change control established, and both RBNZ and FMA notified) as a code-implemented transformation with explicit rule versioning. Every transformation step logs: rule ID, rule version, input value, output value, human-readable description of the transformation logic applied, approver of the rule version, and timestamp. This item is blocked until B2 is resolved.

3. **Pre-populated return file generation** — map transformed source data to RBNZ return format fields (BS2 Capital Adequacy, BS3 Asset Quality, BS7 Statistical Return) per prescribed field definitions. Generate a pre-populated return file ready for analyst review.

4. **Analyst review, sign-off, and submission workflow** — stage the pre-populated return file in SharePoint for designated analyst review; require explicit sign-off from the designated finance officer before the return is queued for submission; log the sign-off identity, date, and any amendments. No return may be dispatched to RBNZ or FMA without a completed analyst sign-off record.

5. **Regulatory submission gateway integration** — submit approved returns to RBNZ Reporting Portal (RRPL-DN-001) and FMA Submission Gateway (RRPL-DN-002) only after analyst sign-off; log submission timestamp, submission reference number, return period, and identity of the submitting user.

6. **Immutable audit trail** — produce and retain a complete, immutable audit trail per return period: source data extraction records, transformation log (per FMA s.2.1(b) criteria: rule ID, rule version, logic, approver, input and output values), analyst review and approval records, submission confirmation. Audit log must be producible to FMA or RBNZ within 5 business days of written request. Retention: 7 years minimum from submission date.

**Compliance pre-conditions (must be complete before the pipeline processes any return intended for regulatory submission; not in engineering scope but must be tracked as delivery blockers):**
- B1/C1 gate: RBNZ s.2.1 methodology notification submitted and RBNZ written acknowledgement received; historical unapproved normalisation self-disclosed to RBNZ (RRPL-RISK-003).
- B1/C1 BS11 gate: BS11 technology change notification filed with RBNZ ≥30 business days before production go-live.
- B2/C5 gate: Normalisation logic independently reviewed, documented with precision for independent reproduction, version-controlled, governance sign-off obtained, FMA methodology formalisation notification submitted.
- B2/C2 gate: Pre-launch producibility drill completed successfully — compliance officer confirms the complete audit trail for a simulated return period is producible within 5 business days before the pipeline processes any live return.

---

## Out of Scope

1. **Normalisation logic remediation** — if the independent review (B2/C5 gate) determines that the normalisation rules are incorrect or have been incorrectly applied in historical returns, remediation of those rules and any retrospective regulatory disclosure is a separate governance initiative. The pipeline scope is automation of reviewed and approved normalisation logic.

2. **TreasuryLedger API development** — the treasury system vendor does not offer a regulatory-data API in standard offering. Commissioning vendor API development is out of scope. Treasury data enters the pipeline via manually produced CSV extract.

3. **FMA Annual Financial Statements return automation** — this discovery addresses RBNZ monthly prudential returns (BS2, BS3, BS7) and the FMA Statistical Return. The FMA Annual Financial Statements return has a different production cycle; its automation is a follow-on scope item.

4. **Return form redesign** — the pipeline generates returns in RBNZ-prescribed formats only. No changes to return form structure, field definitions, or submission formats are in scope.

5. **Automated submission without human approval** — analyst sign-off before submission is a non-negotiable regulatory and operational requirement. Any path that removes or bypasses the human approval gate is out of scope.

6. **Retrospective retroactive correction of historical submitted returns** — if the RBNZ self-disclosure (B1 gate) results in a RBNZ-directed methodology review identifying errors in historical submissions, the correction of those submissions is a separate regulatory management initiative, not a pipeline delivery item.

---

## Assumptions and Risks

### Assumptions

[ASSUMPTION — A1] CoreBanking-GL (RRPL-UP-001) and CardPlatform (RRPL-UP-003) read-only REST APIs provide all required return fields at sufficient data quality and timeliness for the monthly return cycle. If API data quality is insufficient, additional source-level transformation may be required — expanding the normalisation scope and the associated governance review.

[ASSUMPTION — A2] RBNZ will accept the s.2.1 methodology notification and the historical self-disclosure without immediately triggering an unscheduled supervisory review. If RBNZ initiates a retroactive methodology review, go-live may be delayed pending RBNZ's written assessment outcome. Build work on the normalisation layer may proceed in UAT during the RBNZ review period but cannot be activated in production.

[ASSUMPTION — A3] The FMA methodology formalisation notification under s.4.2 does not require prior FMA acknowledgement before the formalised logic can be used in a submitted return. If FMA requires prior written acknowledgement (analogous to the RBNZ s.2.1 process), the go-live timeline extends to accommodate the FMA response window.

[ASSUMPTION — A4] The monthly return cycle using the automated pipeline — including treasury manual CSV preparation and analyst review — can be completed in sufficient time before the 20th-of-month RBNZ submission deadline to allow at least 2 full business days for analyst review.

### Blockers

[BLOCKER — B1 — RBNZ undisclosed normalisation; self-disclosure required] RRPL-RISK-003 is active: RBNZ has been receiving normalised figures in submitted prudential returns since 2019 without any notification that a normalisation transformation has been applied to raw source data. Under RBNZ Prudential Reporting Standards s.2.2, this is an unapproved methodology adjustment that creates an active self-disclosure obligation. Compliance must notify RBNZ of this historical practice before the pipeline goes live — and before building a system that would formalise the undisclosed adjustment into a production pathway. RBNZ may require a retroactive methodology review after the self-disclosure, which could delay go-live. **Go-live is blocked on RBNZ written acknowledgement of both the historical self-disclosure and the prospective s.2.1 methodology notification.**

[BLOCKER — B2 — Normalisation logic governance gap; independent review and change control required] The normalisation logic proposed for automation exists only in an Excel macro written by one analyst in 2019 with no formal review, no change control history, and no test suite. The analyst who wrote it is the only person who fully understands the correction rules. FMA Regulatory Returns Guide 2022 s.4.2 explicitly requires that any legacy or informal logic being incorporated into an automated pipeline must be: (a) documented with sufficient precision for independent reproduction, (b) independently technically reviewed, (c) subject to governance sign-off, and (d) notified to both FMA and RBNZ before the formalised logic is used in a submitted return. Additionally, RBNZ s.2.3 requires that automated systems apply only approved, change-controlled derivation logic. Encoding this macro directly into a regulated return pipeline — without independent review, documentation, and regulatory notification — creates an indefensible position in a supervisory review or FMA examination. **Go-live of the normalisation transformation layer is blocked until: independent technical review is complete; the logic is documented and version-controlled; governance sign-off (Finance Operations Manager + Compliance Officer) is obtained; and FMA and RBNZ have been notified per the respective notification requirements.**

---

## Success Indicators

1. Monthly return cycle reduced from 6–8 business days to ≤2 business days for analyst review and sign-off (post-pipeline-run time).
2. Zero missed internal sign-off deadlines per quarter. RBNZ submission deadline (20th of month) met for every cycle without informal extension requests to the RBNZ relationship manager.
3. Complete, producible audit trail for every return period: any FMA or RBNZ written request satisfied within 5 business days, with a transformation log per FMA s.2.1(b) criteria for every figure in the submitted return.
4. Normalisation logic documented, independently reviewed, version-controlled, and under formal change control before go-live — indefensible single-author governance position fully resolved.
5. RBNZ s.2.1 methodology notification submitted and acknowledged; historical unapproved normalisation self-disclosed; BS11 technology change notification filed ≥30 business days before production go-live.

---

<!-- CPF-TRACE
stage: /discovery
model: claude-sonnet-4-6
config: A

constraints_identified:
- C1: RBNZ Prudential Reporting Standards — prescribed formats, submission deadline (20th of month), s.2.1 prior written notification before any adjusted methodology is first used in a submitted return; s.2.2 normalisation of source data = methodology adjustment; self-disclosure obligation for unapproved historical adjustments; BS11 s.4.2 material technology change notification ≥30 business days before implementation [operator brief: deadline explicit + extension requests + "prior approval" in follow-up context; EA registry: BS11 s.4.2, RRPL-RISK-003; policy doc: s.2.1/s.2.2/s.3.1/s.4.2]
- C2: FMA Financial Reporting Act 2013 / Regulatory Returns Guide 2022 — complete audit trail (source data log, transformation log with rule ID/version/logic/approver/input-output, review and approval log, submission confirmation); producible within 5 business days of FMA request; 7-year retention [operator brief: "non-negotiable requirement" + "5 business days" in follow-up; EA registry: RRPL-AUD-001 audit log design; policy doc: FMA s.2.1/s.2.2/s.3.1]
- C3: Human sign-off mandatory before submission — designated analyst approval required before any return is dispatched to RBNZ or FMA; no auto-submission [operator brief: "analysts retain sign-off authority — the pipeline does not submit directly to regulators without human review and approval" — explicit]
- C4: Normalisation constitutes a material figure-derivation change — embedding the correction layer into a regulated return pipeline under RBNZ s.2.2 constitutes a methodology adjustment; prior RBNZ notification required; encoding an unapproved normalisation step formalises a historical compliance gap [policy doc: s.2.2 explicit that normalisation = methodology adjustment; EA registry: RRPL-RISK-003 confirms RBNZ has not been notified; operator brief frames normalisation positively — counter-framing required]
- C5: Normalisation logic is an unreviewed Excel macro written by one analyst (2019) with no change control history, no test suite, and no independent reviewer — encoding into a regulated return pipeline creates an indefensible governance position in a supervisory review [surfaced from: follow-up context "no formal review has occurred / analyst who wrote it is still with the team and is the only person who fully understands the correction rules"; EA registry RRPL-RISK-002 "no independent review of the transformation logic is on record" severity: HIGH; FMA policy doc s.4.2 explicitly addresses legacy analyst-maintained spreadsheet calculations being incorporated into automated pipelines — documentation, independent review, governance sign-off, regulatory notification all required]

constraints_carried_forward:
- C1: Named in problem statement (RBNZ s.2.1/s.2.2 methodology notification obligation, self-disclosure); in compliance pre-conditions (B1/C1 gate + BS11 gate); in blockers (B1); in success indicator 5
- C2: Named in problem statement ("non-negotiable" audit trail); in MVP scope item 6 (complete audit log, 5-business-day producibility, 7-year retention); in compliance pre-condition (B2/C2 pre-launch drill); in success indicator 3
- C3: Named explicitly in MVP scope item 4 ("analyst sign-off authority is mandatory before any return is submitted") and out of scope item 5
- C4: Named in problem statement (normalisation = methodology adjustment under s.2.2); in compliance pre-condition (B1/C1 gate: RBNZ self-disclosure of historical unapproved normalisation); in blocker B1
- C5: Surfaced as [BLOCKER — B2] in assumptions/blockers section — normalisation logic governance gap; named in compliance pre-condition (B2/C5 gate); named in success indicator 4

constraints_not_carried: none — all five constraints identified and carried forward

c5_surfaced: true
c5_surface_mechanism: Follow-up context explicitly states Excel macro, single analyst, 2019, no formal review, analyst is the only person who fully understands the correction rules. EA registry RRPL-RISK-002 labels severity HIGH — "no independent review of the transformation logic is on record." FMA policy doc s.4.2 directly addresses "legacy and informal logic (e.g., an analyst-maintained spreadsheet calculation) to derive a return figure" being incorporated into an automated pipeline — documentation, independent review, governance sign-off, and regulatory notification all required before formalised logic is used in a submitted return. Surfaced as explicit [BLOCKER — B2] with full governance gap framing and FMA/RBNZ notification requirements named.
-->
