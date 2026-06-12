# Corpus Case Designs — /definition-of-done
**Skill:** `/definition-of-done`
**Generated:** 2026-06-12
**Purpose:** Proposed corpus cases for the first DoD sweep. Cases are proposal-only — do not create actual corpus files.

Note: The existing corpus has 4 cases (T1–T4). This document designs 8 additional cases using S-series scenarios as source material, bringing the total to 12. The S-series cases use realistic pipeline artefact bundles (story + PR description) derived from what a /definition run on that scenario would produce.

---

## Case Design Principles

1. Each case provides: a story artefact (with ACs, NFRs, out-of-scope section, architecture constraints) and a PR description bundle (implementation summary, test evidence, any deviations).
2. Planted defects follow three categories: (a) AC with no PR evidence — model must produce INCOMPLETE; (b) out-of-scope implementation in PR — model must flag as deviation; (c) NFR gap — model must identify missing evidence.
3. Every regulated constraint from the S-series scenario must appear in the story ACs. The DoD judge verifies whether the model correctly assesses the regulated AC evidence.
4. T4 (genuinely complete) pattern is maintained — at least 2 cases must be genuinely complete with no planted defects, to test false-positive suppression.

---

## Case DOD-S2 — Lending Origination: CCCFA Reasonable Inquiry AC Gap

**Source scenario:** S2 — Lending origination (CCCFA, FMA bias)
**Difficulty:** HIGH

**Input specification:**
Story: "As a customer, I want to submit a digital loan application so that I receive a credit decision without visiting a branch." ACs include: (1) Given I submit transaction history consent, When the application is processed, Then my Centrix credit bureau report is fetched and combined with 12 months of transaction history for the scoring decision; (2) Given the application meets automated criteria, When the decisioning model runs, Then a credit decision is returned within 60 seconds for loan amounts up to $30,000; (3) Given the application is complete and all documentation verified, When the CCCFA reasonable inquiry obligation is met, Then legal sign-off on the automated inquiry approach must be confirmed before the digital flow is activated. NFR: Automated decisions below $30k threshold only; manual review path for $30k+ exists.

PR description: "Implemented digital loan application flow: Centrix API integration, automated decision engine, 60-second timeout. Decision accuracy 94% on holdout dataset. CCCFA checklist completed by legal team — see attached spreadsheet. Feature flag added for controlled rollout."

**Planted defect:** AC3 (CCCFA legal sign-off before activation) — the PR description says "CCCFA checklist completed" but does not provide evidence that the legal team has formally signed off on the automated inquiry approach as satisfying the CCCFA obligation. "Checklist completed" is not "legal sign-off confirmed." The model must mark this AC as ⚠️ (unverifiable) and produce INCOMPLETE.

**Expected output characteristics:** INCOMPLETE verdict; AC1 and AC2 marked ✅ with PR citations; AC3 marked ⚠️ (evidence insufficient — "checklist completed" does not confirm legal sign-off); deviation section: rollout mechanism (feature flag) not in story's out-of-scope.

**Known hard constraints:** CCCFA s.9C reasonable inquiry — "checklist" language is a common obfuscation; model must require explicit sign-off confirmation, not checklist reference.

---

## Case DOD-S3 — RTP Integration: Processing Window NFR Not Evidenced

**Source scenario:** S3 — RTP integration (scheme obligation, AML/CFT)
**Difficulty:** HIGH

**Input specification:**
Story: "As a customer, I want to receive inbound RTP payments credited to my account in real time so that my balance reflects immediately." ACs include: (1) Given an inbound RTP message is received, When processed, Then the payment amount is credited to the recipient account within 60 seconds; (2) Given an inbound payment, When AML/CFT screening runs, Then the screening decision is returned within 8 seconds and does not add more than 10 seconds total to the acknowledgement window; (3) Given any inbound payment, When processing completes, Then the scheme acknowledgement message is sent within 10 seconds of initial receipt. NFR: 99.9% acknowledgement within 10-second window at 40,000 TPS peak.

PR description: "Implemented inbound RTP payment handler: ISO 20022 parsing, account crediting, AML/CFT integration, acknowledgement send. Unit tests passing. Integration tested against Payments NZ sandbox (30 transactions). Performance testing scheduled for next sprint."

**Planted defect:** NFR (10-second acknowledgement at 40,000 TPS) — the PR description says "performance testing scheduled for next sprint." The NFR is not evidenced. Model must identify the NFR as ❌ (not satisfied) and produce INCOMPLETE.

**Expected output characteristics:** INCOMPLETE verdict; ACs 1–3 assessments (likely ⚠️ due to sandbox-only testing); NFR marked ❌ (performance testing not completed, 40,000 TPS load not tested); deviation section: performance testing deferred — creates AC risk.

**Known hard constraints:** Scheme compliance window (10 seconds from Payments NZ) is a binary pass/fail — "scheduled for next sprint" does not satisfy it.

---

## Case DOD-S4 — Experience API: PAN Caching Out-of-Scope Violation

**Source scenario:** S4 — Experience API card services (PCI DSS)
**Difficulty:** VERY-HIGH

**Input specification:**
Story: "As a fintech developer, I want to retrieve transaction history via the Experience API so that I can display spending insights to customers." ACs include: (1) Given a valid OAuth token with transaction_history scope, When GET /v1/cards/{id}/transactions is called, Then the last 90 days of transactions are returned with truncated PAN (last 4 digits only); (2) Given the Experience API caches transaction data, When a cache hit occurs, Then the cached response contains no raw PAN — only truncated PAN and merchant data; (3) Given QSA certification is required, When the Experience API is deployed, Then PCI DSS QSA sign-off must be obtained before the API is exposed to external partners. Out of scope: raw PAN storage, full card numbers in any response.

PR description: "Implemented transaction history endpoint. Redis cache added for performance: caches full transaction object from core banking API response (including PAN for internal processing), strips PAN before returning to client. Cache TTL 5 minutes. QSA assessment scheduled Q3. Load tested at 1,000 RPS."

**Planted defect:** AC2 and out-of-scope violation — the PR description caches "full transaction object including PAN for internal processing" before stripping it. This violates the story's out-of-scope section (no raw PAN storage) and AC2 (cache must contain no raw PAN). AC3 (QSA sign-off) is also ⚠️ — assessment scheduled, not completed.

**Expected output characteristics:** INCOMPLETE verdict; AC2 marked ❌ (cache stores raw PAN before stripping — violates the AC exactly); AC3 marked ⚠️ (QSA scheduled but not complete); deviation: raw PAN in cache violates out-of-scope, citing specific implementation detail from PR; NFR: PCI DSS scope concern raised.

**Known hard constraints:** PCI DSS requires that raw PAN never be held in any cache or intermediate storage, even transiently. "Strips before returning" does not satisfy the constraint. This is the most technically subtle case.

---

## Case DOD-S5 — CRM Transcription: Vulnerability Flag Scope Violation

**Source scenario:** S5 — CRM transcription (Privacy Act, customer vulnerability policy)
**Difficulty:** MEDIUM

**Input specification:**
Story: "As a contact centre agent, I want call transcription pre-populated in the update fields so that I can confirm customer data changes without manual typing." ACs include: (1) Given a call is active, When the transcription engine processes speech, Then updated field values (address, phone, email) are pre-populated in the confirmation panel; (2) Given an agent reviews pre-populated fields, When they click Confirm, Then the update is saved to Dynamics only after explicit agent confirmation; (3) Given any transcription output, When the AI processes the transcript, Then no vulnerability flag, risk indicator, or assessment of customer vulnerability is produced or displayed. Out of scope: automated vulnerability detection, any AI-generated flag about customer vulnerability status.

PR description: "Implemented Azure AI Speech transcription and field extraction. Pre-populate panel working in 280-agent test environment. Agent confirmation required before save. Added 'confidence score' indicator on extracted fields (0-100%) to help agents identify uncertain extractions. Privacy review completed by team. Unit and integration tests passing."

**Planted defect:** Out-of-scope violation — the "confidence score" indicator, while framed as a data extraction confidence measure, introduces an AI-generated assessment indicator adjacent to customer data. The customer vulnerability policy (explicit in the scenario: "no automated vulnerability assessment, even a suggestion") must be interpreted broadly. This case tests whether the model catches a subtle framing evasion: "confidence on extracted field" is not a vulnerability flag, but the story's out-of-scope section prohibits any AI-generated indicator.

However — this is a judgment case. The model may correctly assess the confidence score as WITHIN scope (it is about field confidence, not vulnerability). The expected outcome is that the model flags this as a potential deviation worth reviewing, not a clear ❌.

**Expected output characteristics:** COMPLETE WITH DEVIATIONS; all ACs ✅; deviation flag on confidence score indicator — "confidence score may conflict with out-of-scope prohibition on AI-generated indicators adjacent to customer data; recommend legal review before rollout."

**Known hard constraints:** Customer vulnerability policy is a firm internal constraint ("no automated vulnerability assessment — even a suggestion"). Agents interpret AI confidence scores as implicit quality signals about the data.

---

## Case DOD-S8 — Regulatory Reporting: Normalisation Logic Governance AC Not Evidenced

**Source scenario:** S8 — Regulatory reporting pipeline (RBNZ, FMA audit trail)
**Difficulty:** HIGH

**Input specification:**
Story: "As a finance analyst, I want the normalisation transformation layer to be governed and auditable so that RBNZ can verify the logic applied to reported figures." ACs include: (1) Given the normalisation transformation is implemented, When RBNZ requests the transformation logic, Then a version-controlled specification document is producible within 5 business days; (2) Given the normalisation logic is under change control, When any rule is modified, Then the change is recorded in the change log with the approver and effective date; (3) Given the normalisation transformation exists, When the governance review is completed, Then sign-off from a finance operations lead and compliance officer is recorded before the transformation is included in any submitted return.

PR description: "Implemented normalisation transformation layer based on existing Excel macro rules. All 14 transformation rules are now in code. Transformation spec document created (docs/normalisation-spec.md). Tests pass. Unit tests cover all 14 rules against sample data."

**Planted defect:** AC3 (governance sign-off before use in submitted return) — the PR description does not provide evidence that the finance operations lead and compliance officer sign-off has been obtained. The transformation is implemented but the governance gate has not been cleared. Model must mark AC3 as ❌.

**Expected output characteristics:** INCOMPLETE verdict; AC1 ✅ (spec document in PR); AC2 ⚠️ (change control mechanism exists but no evidence it has been used beyond initial creation); AC3 ❌ (no sign-off evidence); NFR: audit trail requirement — transformation spec exists but governance sign-off missing.

---

## Case DOD-S9 — KiwiSaver: Hardship Fee Waiver AC Absent

**Source scenario:** S9 — KiwiSaver fund switching (FMA SEN, hardship fee waiver)
**Difficulty:** VERY-HIGH

**Input specification:**
Story: "As a KiwiSaver member, I want to switch funds online so that I can change my investment allocation without calling or posting a paper form." ACs include: (1) Given a member submits a fund switch instruction, When the instruction is processed, Then the switch is committed to the unit registry on the same business day for eligible members; (2) Given a member has submitted more than 2 fund switches in the current calendar year, When a third switch is attempted, Then a $15 switching fee is applied and disclosed before confirmation; (3) Given a member has an active financial hardship application or approved hardship withdrawal, When they attempt to switch funds, Then the $15 switching fee is waived automatically and no fee is charged. NFR: KiwiSaver Act s.45 — switch processing within next available processing date.

PR description: "Implemented online fund switching flow: unit registry API integration, same-business-day processing, $15 fee logic for >2 switches per year. Member portal UI tested with 50 UAT participants. FMA SEN filed and 30-day period completed. All unit tests passing."

**Planted defect:** AC3 (hardship fee waiver) — the PR description makes no mention of hardship member handling. The fee logic is described only for the >2-switches-per-year case. The hardship fee waiver is a statutory obligation (KiwiSaver Act) and its absence from the PR makes AC3 unverifiable. Model must mark AC3 as ❌ and produce INCOMPLETE.

**Expected output characteristics:** INCOMPLETE verdict; AC1 ✅ (unit registry integration + same-day processing evidenced); AC2 ✅ (fee logic described); AC3 ❌ (hardship waiver not mentioned; statutory obligation unverified); NFR: KiwiSaver Act s.45 noted as not independently verified.

**Known hard constraints:** This is a statutory breach if deployed without the hardship waiver. The model must flag this as a hard blocker, not a "consider adding" suggestion.

---

## Case DOD-S11 — CDR Consent API: Enriched Insights Deployed Despite Deferral

**Source scenario:** S11 — CDR consent API (Privacy Act, derived-data consent boundary)
**Difficulty:** HIGH

**Input specification:**
Story: "As an accredited third-party developer, I want to retrieve transaction history data via the consent API so that I can build spending analysis features with customer permission." ACs include: (1) Given a customer has granted transaction_history consent for a specific third party, When GET /v1/consent/{id}/transactions is called, Then transaction records are returned with only consented fields; (2) Given a customer has not granted enriched_insights consent, When any API call is made, Then no enriched insights (spending categories, income estimate, projected balance) are returned; (3) Given a consent is revoked, When the revocation is processed, Then the third party receives a deletion notification within 1 hour. Out of scope: enriched insights in this release — deferred pending Privacy Act advice on derived-data consent scope.

PR description: "Implemented transaction history endpoint and consent enforcement. Added enriched insights as a bonus field in the transaction response: spending_category field derived from merchant category code — lightweight, doesn't require the full analytics engine, so included to provide immediate value to partners. Revocation notification working. All tests passing."

**Planted defect:** AC2 and out-of-scope violation — the PR adds `spending_category` to the transaction response, framed as "lightweight." This violates the story's explicit out-of-scope deferral (enriched insights pending Privacy Act advice) and AC2 (no enriched insights when consent not granted). The "lightweight" framing is an attempt to minimise the scope violation.

**Expected output characteristics:** INCOMPLETE verdict; AC2 ❌ (spending_category is an enriched insight, violating the AC and out-of-scope deferral regardless of how it is framed); deviation: "spending_category field constitutes an enriched insight (derived from transaction data) — this is explicitly out of scope pending Privacy Act advice; must be removed before this story can be COMPLETE"; AC3 ✅.

**Known hard constraints:** The Privacy Act derived-data consent boundary applies to any analytical inference from transaction data. "Lightweight" does not change the legal characterisation.

---

## Case DOD-S7 — Event Registration: Genuinely Complete (Calibration Anchor)

**Source scenario:** S7 — Event registration (Privacy Act partial, data residency)
**Difficulty:** LOW

**Input specification:**
Story: "As a customer, I want to register for a financial literacy event so that I can attend without calling or emailing." ACs include: (1) Given an event is listed, When I complete the registration form, Then I receive a confirmation email within 5 minutes; (2) Given I provide my details, When the form is submitted, Then my registration is saved to Azure SQL in the Australia East region; (3) Given I want to cancel, When I click the cancellation link, Then my registration is marked cancelled and I receive a cancellation confirmation. NFR: Azure SQL data residency — Australia East or Australia Southeast only.

PR description: "Implemented event registration: form, Azure SQL persistence (Australia East region confirmed in Terraform config), SendGrid confirmation email (average latency 45 seconds in testing), cancellation flow with email confirmation. All ACs tested manually and via automated integration tests. Azure region: confirmed as australiaeast in deployment config."

**Expected output characteristics:** COMPLETE verdict; all ACs ✅ with specific PR evidence cited; NFR ✅ (Australia East region confirmed in Terraform config — specific citation); no deviations noted. This case establishes the false-positive-suppression baseline — a model that produces INCOMPLETE or COMPLETE WITH DEVIATIONS on T-DOD-S7 has false-positive detection failure.

---

## Case DOD-T5 — Minimal PR Description: Unverifiable ACs

**Source scenario:** Generic — not S-series based
**Difficulty:** MEDIUM

**Input specification:**
Story: "As a customer, I want to reset my password via email so that I can regain access without calling support." ACs include: (1) Given I request a password reset, When I enter my email, Then a reset link is sent within 2 minutes; (2) Given I click the reset link, When it is more than 24 hours old, Then the link is expired and an error is shown; (3) Given I submit a new password, When the change is confirmed, Then the old password no longer works and I am redirected to login.

PR description: "Password reset implemented. Tests pass."

**Expected output characteristics:** INCOMPLETE verdict; all ACs marked ⚠️ (unverifiable from minimal PR description — no evidence of 2-minute latency, link expiry, old password invalidation); output must not fabricate evidence from a 2-sentence PR description; output explains what evidence would be needed for each AC to be ✅.

**Known hard constraints:** This case tests that the model does not hallucinate satisfaction of ACs from a thin PR description. The correct behaviour is ⚠️ on all three ACs, not ✅ based on "PR says tests pass."
