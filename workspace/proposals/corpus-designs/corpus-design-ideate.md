# Corpus Case Designs — /ideate
**Skill:** `/ideate`
**Generated:** 2026-06-12
**Purpose:** Proposed corpus cases for the first ideate sweep. Cases are proposal-only — do not create actual corpus files.

---

## Case Design Principles

1. Each case specifies a lens (A–E), an input (scenario brief or partial artefact), and what high-quality output looks like (the "better" reference direction).
2. Cases cover: blank-slate ideation (no artefacts), artefact-informed ideation (discovery exists), adversarial inputs (false urgency, scope creep), and clarification trigger cases (insufficient input for the requested lens).
3. At least 2 cases test regulatory-constrained scenarios where the "obvious" opportunity or solution is ruled out by a regulatory constraint — these validate constraint inheritance (I1).
4. For Lens B (assumption inventory), cases test risk calibration: a statutory obligation assumption must be rated HIGH risk, not MEDIUM.
5. For Lens D (strategy assessment), at least 2 cases where the correct recommendation is REDESIGN or DEFER, not PROCEED — testing whether the model correctly reads negative signals.

---

## Case IDE-S2-LensB — Lending Origination: Assumption Inventory

**Case ID:** IDE-S2-LensB
**Source scenario:** S2 — Lending origination (CCCFA, FMA algorithmic fairness, hidden FMA disclosure gap)
**Lens:** B — Assumption inventory
**Input:** S2 scenario brief (operator input + follow-up context about the demographic disparity finding)
**Difficulty:** HIGH

**Input specification:**
The S2 operator brief is passed directly as the input for ideation. The model is asked to run Lens B (assumption inventory). No discovery artefact exists — this simulates a pre-discovery ideation session where the team wants to surface assumptions before committing to a scope.

**Expected output characteristics (better reference direction):**
- Assumptions include all of: CCCFA reasonable inquiry (viability, high risk, unknown-unknown), FMA demographic disparity disclosure (ethical, high risk, known-unknown — team knows the finding exists but does not know FMA's view), FMA algorithmic fairness methodology (viability, high risk, unknown-unknown), automated decision approval rate parity (desirability, high risk, known-unknown), Q3 deadline achievability given regulatory gates (feasibility, high risk, known-unknown)
- Risk ratings: the CCCFA assumption must be rated HIGH (statutory obligation — violation blocks go-live). The demographic disparity assumption must be rated HIGH-ETHICAL (FMA enforcement risk).
- Assumption card markers: one `---ASSUMPTION-JSON:` marker per named assumption, with correct type/risk/knowness fields
- Non-obvious insight: the team's CCCFA "legal is reviewing it" framing does not constitute satisfaction of the reasonable inquiry obligation — a model that surfaces "the assumption that legal review resolves the CCCFA obligation" as a distinct HIGH-risk assumption (rather than treating legal review as in progress) has demonstrated above-average insight

**Known hard constraints for judge evaluation:**
- The demographic disparity finding (12% approval rate difference) is a hidden regulatory risk — a surface-level model lists "credit model fairness" generically; a deep model surfaces the specific FMA enforcement exposure from operating with a known disparity without disclosure
- If the model rates CCCFA as MEDIUM risk because "legal is working on it," this is a risk miscalibration (D3 penalty)
- The knowness distinction: the CCCFA issue is `unknown-unknown` (the team does not know what they do not know about FMA's automated inquiry interpretation); the demographic disparity is `known-unknown` (the team knows the finding exists, does not know FMA's view)

**Difficulty rating:** HIGH

---

## Case IDE-S9-LensD — KiwiSaver Switching: Strategy Assessment with False Urgency

**Case ID:** IDE-S9-LensD
**Source scenario:** S9 — KiwiSaver fund switching (FMA SEN, false urgency, hardship fee waiver)
**Lens:** D — Product strategy framing (Cagan 10-question assessment)
**Input:** S9 scenario brief
**Difficulty:** HIGH

**Expected output characteristics (better reference direction):**
- Q6 (Why now): correctly identifies that the March 31 EOFY deadline is a fund administration processing window, not a legal requirement for the feature to be live. The model must challenge the urgency framing, not accept it.
- Q9 (Critical risk factors): names at minimum: (1) FMA Significant Event Notice — 30-day member notification period means the feature cannot go live until 30 days after filing; (2) KiwiSaver Act s.45 processing obligation — current 10-15 day paper process may already be in breach; (3) hardship fee waiver statutory obligation — $15 fee must be waived for hardship members per the Act.
- Final recommendation: REDESIGN (timeline is not feasible given the 30-day FMA SEN; scope needs to account for hardship waiver) rather than PROCEED
- Rationale: names the FMA SEN timeline as the specific reason for REDESIGN, calculates that 30 days back from March 31 is January 31 (already past if the brief is current-date February)

**Known hard constraints for judge evaluation:**
- A model that accepts the March 31 deadline without questioning it has been captured by the false urgency framing — this is a categorical I1 failure (constraint not inherited)
- A PROCEED recommendation is incorrect here — the FMA SEN requirement makes the stated timeline impossible; a model that says PROCEED with a caveat about FMA notifications has underweighted the constraint
- The hardship fee waiver must appear as a distinct risk factor, not folded into "regulatory compliance"

**Difficulty rating:** HIGH

---

## Case IDE-S11-LensA — CDR Consent API: Opportunity Mapping with Consent Boundary Constraint

**Case ID:** IDE-S11-LensA
**Source scenario:** S11 — CDR consent API (Privacy Act, derived-data consent boundary)
**Lens:** A — Opportunity mapping
**Input:** S11 scenario brief
**Difficulty:** HIGH

**Expected output characteristics (better reference direction):**
- Desired outcome: enabling compliant third-party data access that grows the open banking ecosystem without Privacy Act exposure
- Top opportunity cluster: "customer control of data sharing" — with sub-opportunities correctly noting that enriched insights require separate consent disclosure from raw transaction data (this is the non-obvious opportunity: framing consent granularity as a product differentiator, not just a compliance obligation)
- Out-of-scope opportunity: "enriched insights" must be explicitly deferred to a separate ideation session or flagged as requiring Privacy Act advice — a model that includes enriched insights as an opportunity without the Privacy Act caveat has missed C5
- Non-obvious insight: the consent granularity design (per data type, per third party) is an opportunity to build trust and differentiation, not just a compliance checkbox; strong models surface this as a product strategy advantage

**Known hard constraints for judge evaluation:**
- Enriched insights appearing as an opportunity without Privacy Act caveats = I1 penalty (constraint not inherited from brief's C5 signal)
- The opportunity map should distinguish between "raw transaction data" opportunities (clearly in scope) and "derived insights" opportunities (require Privacy Act advice) — models that conflate these under "data sharing" have not inherited the consent boundary constraint

**Difficulty rating:** HIGH

---

## Case IDE-S7-LensA — Event Registration: Low-Regulation Calibration Anchor

**Case ID:** IDE-S7-LensA
**Source scenario:** S7 — Event registration (low regulation)
**Lens:** A — Opportunity mapping
**Input:** S7 scenario brief
**Difficulty:** LOW

**Expected output characteristics (better reference direction):**
- Desired outcome: community banking engagement through frictionless event access
- Opportunities: customer friction in current email/phone process; staff efficiency in managing registrations; data quality from digital form vs manual agent transcription
- No fabricated regulatory risk clusters — a model that adds "Privacy Act compliance" as a high-priority opportunity cluster when the brief says privacy is already covered has over-engineered the compliance framing
- Simple, bounded opportunity map — 2-3 clusters, each with 2-3 opportunities; no attempt to expand scope beyond the stated feature

**Purpose:** This is the false-positive-suppression calibration case — a well-performing model produces a clean, appropriately-scoped opportunity map without inventing regulatory risk. A model that over-engineers compliance concerns on a low-regulation brief has poor specificity (I1 = 0.4 for generic regulatory framing where none is warranted).

**Difficulty rating:** LOW

---

## Case IDE-S12-LensB — AI Credit Model: Assumption Inventory with Governance Gap

**Case ID:** IDE-S12-LensB
**Source scenario:** S12 — AI credit model retraining (FMA fairness, MRM policy version mismatch)
**Lens:** B — Assumption inventory
**Input:** S12 scenario brief + S12 follow-up context (MRM policy version details)
**Difficulty:** VERY-HIGH

**Expected output characteristics (better reference direction):**
- Assumptions include: "the pre-2023 MRM process applies to this retrain" (feasibility, HIGH risk, known-unknown — team knows the MRM process exists but has not confirmed the 2023 update applies); "the internal disparity metric satisfies FMA's prescribed fairness methodology" (viability, HIGH risk, known-unknown — team assumes their metric is equivalent); "12-week timeline is achievable given current MRM process" (feasibility, HIGH risk, known-unknown — timeline assumes old process)
- Non-obvious insight: the team's confidence in the MRM process being a "one-meeting cycle" is itself an assumption — a model that surfaces this as a distinct HIGH-risk assumption (not just "MRM approval required") has identified the policy version mismatch risk even without knowing the 2023 update details
- Ethical assumption: "retraining on 24-month data corrects the demographic disparity pattern" — this is an unknown (the retrained model may have different disparity characteristics on the new data); if the model surfaces this as an ethical assumption with HIGH risk, it has demonstrated exceptional insight

**Known hard constraints for judge evaluation:**
- The 12-week timeline assumption must be rated HIGH risk (if the 2023 MRM policy requires independent validation, the timeline is already impossible)
- The FMA fairness methodology assumption must be rated HIGH risk (statutory enforcement risk if the prescribed methodology is not used)
- A model that treats both of these as MEDIUM risk has miscalibrated the regulatory consequence (D3/I3 penalty)

**Difficulty rating:** VERY-HIGH

---

## Case IDE-S3-LensE — RTP Integration: JTBD Reframe

**Case ID:** IDE-S3-LensE
**Source scenario:** S3 — RTP integration (scheme obligation, AML/CFT)
**Lens:** E — Jobs-to-be-Done
**Input:** S3 scenario brief
**Difficulty:** MEDIUM

**Expected output characteristics (better reference direction):**
- Job identification: "When our RTP scheme participation is required, I want to receive and process inbound payments within scheme rules, so that we maintain our scheme membership and customer accounts reflect immediately." — the functional job is scheme compliance + customer credit, the social job is maintaining correspondent relationships, the emotional job is confidence that no penalty will be triggered
- Current hire: manual batch processing + scheme relationship manager escalation for edge cases
- Four Forces: Push = $50k/day penalty + scheme suspension risk; Pull = real-time crediting capability, customer trust; Anxiety = AML latency at 40,000 TPS (the 8-second P99 at 10,000 TPS, unknown at 40,000 TPS); Habit = engineering team is comfortable with batch architecture
- Non-obvious insight: the "real competition" is not a technology choice but scheme non-participation — the pull force is not "better customer experience" but "maintaining scheme membership." A model that frames the JTBD as a customer experience problem has missed the institutional forcing function.

**Difficulty rating:** MEDIUM

---

## Case IDE-THIN-CLARIFY — Clarification Trigger: Insufficient Lens D Input

**Case ID:** IDE-THIN-CLARIFY
**Source scenario:** None — synthetic
**Lens:** D — Product strategy assessment
**Input:** "We should build a savings goal feature."
**Difficulty:** LOW

**Expected output characteristics:**
- Clarification response (not a full Lens D output): model asks for target user, desired outcome (what metric would this move?), and the platform context (mobile app? web? both?) before attempting Q1–Q10
- Model does NOT attempt to answer Q1–Q10 from "we should build a savings goal feature" alone — this is insufficient input for a strategy assessment
- response_type: `clarification`
- If the model attempts to run Lens D with invented context, this is an I1 failure (score 0.0 — output is not grounded in provided input)

**Purpose:** Tests the clarification trigger condition. A model that fabricates a full 10-question strategy assessment from a 7-word input is doing discovery work, not ideation.

**Difficulty rating:** LOW

---

## Case IDE-S8-LensB — Regulatory Reporting: Governance Assumption Surface

**Case ID:** IDE-S8-LensB
**Source scenario:** S8 — Regulatory reporting pipeline (RBNZ, FMA audit trail, normalisation change-control gap)
**Lens:** B — Assumption inventory
**Input:** S8 scenario brief
**Difficulty:** MEDIUM-HIGH

**Expected output characteristics (better reference direction):**
- Key assumption surfaced: "the existing Excel macro normalisation logic is correct and can be embedded in the pipeline without independent review" — type: feasibility; risk: HIGH; knowness: known-unknown (team knows the macro exists, does not know if it is correct or governed)
- Assumption: "the normalisation transformation is neutral and does not materially change the reported figures in a way RBNZ would require disclosure of" — type: viability; risk: HIGH; knowness: unknown-unknown (team does not know RBNZ's position)
- Non-obvious insight: the normalisation transformation being governed by a single analyst with no version history is not just a technical risk — it is a governance gap that RBNZ could treat as a material control failure. A model that surfaces the "single analyst knowledge risk" as a viability/ethical assumption (not just a technical one) has demonstrated above-average insight.

**Difficulty rating:** MEDIUM-HIGH
