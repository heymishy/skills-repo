# Reverse Engineering Report: [System Name]

<!--
  PURPOSE: Structured extraction of business rules, interfaces, regulatory constraints,
  data ownership, and key IP from a legacy codebase or system.

  AUDIENCE (multiple consumers — sections are designed to be extracted independently):
  - Pipeline → feeds /discovery, /benefit-metric, /definition directly
  - Vendor / SaaS partner → Section 3 (Business Rules) + Section 4 (Interfaces)
    as functional requirements input
  - Architecture / EA → Section 4 (Interfaces) + Section 6 (Data Model)
  - Compliance / Legal → Section 5 (Regulatory Rules) extracted as standalone inventory
  - Test team → Section 7 (Parity Test Seeds) as starting point for equivalence test suite

  CONFIDENCE RATINGS (applied to every extracted item):
  ★★★ Verified — rule is explicit in code, tested, has clear business meaning
  ★★☆ Probable — rule is clear in code but business intent inferred, not confirmed
  ★☆☆ Uncertain — rule exists in code but origin, intent, or current validity is unclear

  SENSITIVITY FLAGS (applied where relevant):
  🔴 REGULATORY — maps to a specific regulatory requirement (RBNZ, PCI DSS, AML/CFT, CCCFA, etc.)
  🟡 PROPRIETARY — competitive or commercially sensitive business logic
  🟠 PCI — in scope for PCI DSS, requires controlled handling
  🔵 AUDIT — generates or affects audit trail; must be preserved or equivalent in target

  ALL items flagged ★☆☆ or 🔴 REQUIRE human verification before being used as 
  requirements input. Do not feed unverified items directly to a vendor or coding agent.
-->

**System:** [Name and brief description]
**Language / platform:** [e.g. COBOL on z/OS, Java 8 / WebSphere, Fiserv DNA, etc.]
**Report date:** [YYYY-MM-DD]
**Extracted by:** [Copilot / human / both — note which sections are AI-assisted]
**Modernisation target:** [e.g. E6 card issuing platform, cloud-native Java, SaaS config]
**Scope of extraction:** [e.g. Card authorisation module, full issuing platform, payment routing]

---

## Extraction confidence summary

| Category | Items extracted | ★★★ Verified | ★★☆ Probable | ★☆☆ Uncertain | Requires human review |
|----------|----------------|-------------|-------------|--------------|----------------------|
| Business rules | | | | | |
| Interface contracts | | | | | |
| Regulatory rules | | | | | |
| Data model | | | | | |
| IP / proprietary logic | | | | | |
| **Total** | | | | | |

<!--
  Any item in the ★☆☆ column should be discussed with a domain expert 
  before being treated as a requirement. Uncertain items are hypotheses, 
  not facts.
-->

---

## Section 1: System overview

### What this system does
<!--
  2–3 paragraphs. Written for someone unfamiliar with the legacy system.
  What business capability does it provide? Who calls it? What does it produce?
  Avoid technical implementation detail here — that belongs in Section 4.
-->

### System boundaries
<!--
  What is clearly in scope vs what this system depends on externally.
  Useful for establishing the modernisation perimeter.
-->

**Owned by this system:**
- [Capability or data domain]

**Consumed from external systems:**
- [System name] — [what it provides]

**Provided to external systems:**
- [System name] — [what this system provides]

### Known documentation gaps
<!--
  What is known to be undocumented, poorly documented, or where 
  documentation contradicts the code. These are risk areas.
-->

- [Gap description and why it matters for modernisation]

---

## Section 2: Business rules catalogue

<!--
  The core of the report. Every discrete rule that governs system behaviour.
  
  A business rule is: "Given [condition], the system [does / calculates / 
  rejects / routes / applies]."
  
  Rules are extracted from: conditional logic, validation functions, 
  calculation methods, routing decisions, threshold comparisons, 
  state machine transitions, error handling branches.
  
  For each rule:
  - Give it a stable ID: BR-[sequence]
  - Rate its confidence
  - Flag sensitivity if applicable
  - Note the source (file/function/line reference if available)
  - Note whether the rule is tested (has coverage) or untested
  - Note whether this rule is a PARITY REQUIREMENT (must exist in target)
    or a MIGRATION CANDIDATE (may be handled differently in the target)
-->

### Rule categories

Organise rules into functional categories. Common categories for banking/payments:
- Transaction authorisation
- Limit and threshold management  
- Routing and network selection
- Fee calculation
- Interest and rate application
- Regulatory and compliance gates
- Error and decline handling
- Notification and event triggers
- Data validation and enrichment

---

### [Category name, e.g. Transaction Authorisation]

#### BR-001: [Rule name — plain language title]

| Field | Value |
|-------|-------|
| **Confidence** | ★★★ / ★★☆ / ★☆☆ |
| **Sensitivity** | 🔴 REGULATORY / 🟡 PROPRIETARY / 🟠 PCI / 🔵 AUDIT / None |
| **Source** | [File / function / line reference] |
| **Test coverage** | Covered / Uncovered / Unknown |
| **Modernisation disposition** | PARITY REQUIRED / MIGRATION CANDIDATE / REVIEW |

**Rule:**
> Given [condition], when [trigger], then [outcome].
> 
> [If the rule has thresholds, exceptions, or sub-conditions, list them:]
> - Exception: [condition] → [different outcome]
> - Threshold: [value] — [source of the value: hardcoded / configured / calculated]

**Business intent (inferred or confirmed):**
[Why this rule exists — regulatory basis, risk management, product design, etc.
Mark as INFERRED if not confirmed by documentation or domain expert.]

**Modernisation note:**
[Can the target platform handle this natively? Does it need configuration, 
custom code, or a design decision? Flag if the rule may be a SaaS platform 
fit risk.]

**Verification required:** [ ] Yes — confirm with [domain / compliance / vendor]  [ ] No

---

#### BR-002: [Next rule]

<!-- Continue pattern for each rule in this category -->

---

<!-- Repeat section for each category -->

---

## Section 3: Interface contracts

<!--
  Every integration point — inbound and outbound.
  
  For each interface:
  - What system is on the other side
  - Protocol and message format
  - Trigger (what causes this interface to be called)
  - Data exchanged (fields, types, business meaning)
  - Error handling and retry behaviour
  - SLA / timing constraints if known
  - Whether the interface must be preserved in the target or can be re-designed
  
  Common sources: network calls, file exchanges, database stored proc calls,
  message queue producers/consumers, batch job triggers, API endpoints.
-->

### Interface map

| ID | Interface | Direction | Counterparty | Protocol | Criticality | Modernisation disposition |
|----|-----------|-----------|--------------|----------|-------------|--------------------------|
| IF-001 | [Name] | Inbound / Outbound | [System] | REST / SOAP / File / MQ / DB | Critical / High / Medium / Low | Preserve / Redesign / Retire |

---

### IF-001: [Interface name]

**Direction:** Inbound / Outbound / Bidirectional
**Counterparty:** [System name and team/owner if known]
**Protocol:** [REST, SOAP, ISO 8583, file, MQ, batch, etc.]
**Confidence:** ★★★ / ★★☆ / ★☆☆
**Sensitivity:** [Flags if applicable]

**Trigger:**
[What causes this interface to be invoked — event, schedule, upstream call]

**Data contract:**

| Field | Type | Business meaning | Required | Validation rule |
|-------|------|-----------------|----------|----------------|
| [field] | [type] | [what it means] | Y/N | [rule if any] |

**Error handling:**
[How errors from this interface are handled — retry logic, fallback behaviour,
error codes returned, downstream impact of failure]

**SLA / timing:**
[Response time requirements, batch windows, timeout thresholds if known]

**Modernisation note:**
[Does the counterparty need to change their integration for the target platform?
Is this interface a blocker for cutover? Is there a vendor-standard replacement?]

---

<!-- Repeat for each interface -->

---

## Section 4: Regulatory and compliance rules

<!--
  CRITICAL SECTION — every item here requires human verification by a 
  compliance or legal specialist before being used as a requirement.
  
  Sources: conditionals that reference regulatory thresholds, AML transaction 
  monitoring, PCI data handling, RBNZ reporting obligations, CCCFA affordability 
  checks, scheme rules (Visa/Mastercard), consumer credit obligations.
  
  Do NOT infer regulatory intent from code alone — the code may be wrong, 
  outdated, or implementing a rule differently from what the regulation requires.
  Flag and require human confirmation.
-->

### Regulatory rules inventory

| ID | Rule | Regulation / scheme | Confidence | Verified by | Verification date |
|----|------|-------------------|------------|-------------|------------------|
| RR-001 | [Plain description] | [RBNZ BS11 / PCI DSS / CCCFA / Visa CRS / etc.] | ★★★/★★☆/★☆☆ | [name] | [date] |

---

### RR-001: [Rule name]

🔴 REGULATORY — **⚠️ Human verification required before use as a requirement**

<!--
  CRITICAL FORMAT: Always capture BOTH fields below separately.
  
  "What the code does" is a neutral observation — no interpretation.
  "What regulation this appears to implement" is a SUGGESTION, not a fact.
  
  This separation allows a compliance specialist to assess the code behaviour
  directly against the current regulation, without trusting the extraction's
  interpretation. The code may be wrong. The regulation may have changed.
  The implementation may be stricter or looser than required.
-->

**WHAT THE CODE DOES:**
> [Neutral, literal description. What values, conditions, outcomes.
>  No assumed intent. No regulatory framing.
>  Example: "When transaction amount exceeds 10000, a flag is set on the transaction
>  record and a record is written to the RegulatoryEvent table with type='THRESHOLD'."]

**WHAT REGULATION THIS APPEARS TO IMPLEMENT (SUGGESTED):**
> [Suggested regulatory basis — mark explicitly as SUGGESTED, not confirmed.
>  Example: "SUGGESTED: AML/CFT Act 2009, Section 40 — prescribed transaction reporting.
>  Basis: threshold value 10000 matches the prescribed transaction threshold."
>  If unknown: "Regulatory basis UNKNOWN — appears to be a compliance gate.
>  Verify with compliance team before use as a requirement."]

**IMPLEMENTATION GAP RISK:**
> [Specific reason to believe the code may not correctly implement the regulation.
>  If none identified: "No specific gap risk identified — standard verification still required."
>  Example: "Threshold value has no source comment — may not match current regulation."
>  Example: "Rule has no test coverage — edge case behaviour unconfirmed."
>  Example: "Regulation was amended in [year] — code predates that amendment."]

**Confidence:** ★★★ / ★★☆ / ★☆☆

**Modernisation note:**
[Is this handled natively by the target platform? Requires configuration?
Requires a compliance decision about equivalence? Vendor Q&A tracker item?]

**Verified by:** [Name / role] | **Date:** | **Verification notes:**

---

## Section 5: Data model and ownership

<!--
  What data does this system own, produce, consume, and transform.
  Focus on business data concepts, not table structures.
  
  Particularly important for migrations: data that must be migrated,
  data that drives decisions (and must be accessible at cutover),
  and data that other systems depend on reading from here.
-->

### Data domains

| Domain | Owned by this system | Read by this system | Produced by this system | Migration requirement |
|--------|---------------------|--------------------|-----------------------|----------------------|
| [e.g. Card account] | Y/N | Y/N | Y/N | Migrate / Transform / Retire / Parallel-run |

### Data ownership risks

<!--
  Shared tables, data written by multiple systems, data without a clear owner,
  data that is derived and may diverge between legacy and target.
  These are migration risk items.
-->

- [Risk description and affected data]

### Data migration notes

<!--
  Transformation rules needed, volume estimates, historical data requirements,
  parallel-run period requirements, cutover sequencing dependencies.
-->

---

## Section 6: Proprietary logic and key IP

<!--
  Business logic that is commercially sensitive, differentiating, or 
  the result of significant institutional knowledge investment.
  
  This section answers: "What in this codebase would we lose if the 
  code disappeared tomorrow, that isn't documented anywhere else?"
  
  Common examples: pricing algorithms, risk scoring models, 
  customer segmentation logic, fraud detection heuristics,
  product eligibility rules, relationship pricing tiers.
-->

| ID | IP item | Business value | Modernisation disposition | Risk if lost |
|----|---------|---------------|--------------------------|-------------|
| IP-001 | [Name] | [Why it matters] | Preserve exactly / Redesign / Retire | [Impact] |

---

## Section 7: Parity test seeds

<!--
  Scenarios extracted from the business rules that MUST produce equivalent 
  outcomes in the target system. These are the starting point for an 
  equivalence test suite — not a complete test plan, but the critical cases 
  that prove the migration didn't break core behaviour.
  
  Sourced from: existing tests in the codebase (extract and translate),
  business rules with PARITY REQUIRED disposition,
  regulatory rules (all of them),
  any rule rated ★★★ with a clear expected outcome.
-->

| ID | Scenario | Input conditions | Expected outcome | Source rule | Priority |
|----|----------|-----------------|-----------------|-------------|----------|
| PT-001 | [Plain language scenario] | [Key inputs] | [Expected result] | BR-XXX / RR-XXX | Critical / High / Medium |

---

## Section 8: Modernisation risk register

<!--
  Consolidated risk view for programme management and architecture.
  Sourced from: ★☆☆ confidence items, REGULATORY flags, interface complexity,
  data ownership gaps, proprietary logic disposition decisions.
-->

| ID | Risk | Source | Likelihood | Impact | Mitigation |
|----|------|--------|------------|--------|------------|
| MR-001 | [Description] | [Section + item ID] | High/Med/Low | High/Med/Low | [Action] |

---

## Section 9: Pipeline handoff

<!--
  Pre-populated inputs for the SDLC pipeline skills.
  This section bridges the reverse engineering report to /discovery and /benefit-metric.
  
  Copy these directly as starting context when running the pipeline for 
  the modernisation programme or a specific capability stream.
-->

### Pre-populated /discovery input

```
Problem statement: [Synthesised from findings — what the legacy system does 
that must be preserved, improved, or replaced in the target]

Who it affects: [Internal systems, end customers, operations teams, compliance]

Why now: [Programme driver — regulatory, platform end-of-life, cost, capability gap]

MVP scope: [First capability stream — suggest based on complexity and risk analysis]

Out of scope: [What is explicitly deferred, retired, or handled by other streams]

Constraints: [Regulatory deadlines, scheme compliance dates, data migration windows,
vendor contract milestones]

Key risks from this report:
[Top 3–5 items from Section 8]
```

### Pre-populated /benefit-metric input

```
Tier 1 — Parity metrics (must-achieve):
- [Metric: e.g. 100% of PARITY REQUIRED business rules produce equivalent outcomes]
- [Metric: e.g. All regulatory rules verified as compliant in target platform]
- [Metric: e.g. All interfaces operational within SLA at cutover]

Tier 1 — Improvement metrics (target):
- [Metric: capability or performance improvement over legacy]

Tier 2 — Programme metrics (learning):
- [Metric: e.g. Vendor platform covers X% of PARITY REQUIRED rules natively]
```

### SaaS platform fit assessment (if applicable)

<!--
  For programmes replacing legacy with a SaaS platform (e.g. E6, Temenos, etc.)
  Flag each PARITY REQUIRED business rule against the target platform's known 
  native capability. Three dispositions:
  
  ✅ NATIVE — platform handles this natively or via standard configuration
  ⚙️ CONFIG — platform can handle this with custom configuration  
  🔧 CUSTOM — requires custom development or extension
  ❌ GAP — platform cannot handle this — design decision required
  ⚠️ UNKNOWN — needs vendor confirmation before disposition can be assigned
-->

| Rule / Interface | Disposition | Notes | Confirmed by vendor |
|-----------------|-------------|-------|-------------------|
| BR-001 | ✅ / ⚙️ / 🔧 / ❌ / ⚠️ | | Y/N |

---

## Section 10: Dead and disabled rules

<!--
  Rules that exist in the codebase but are not currently active:
  commented-out code, code behind disabled feature flags, unreachable branches,
  or superseded logic left in place.

  These are NOT safe to ignore. They may represent:
  (a) Rules that need to be re-enabled in the target (disabled for legacy reasons)
  (b) Rules that were intentionally retired (confirm before excluding)
  (c) Workarounds for legacy platform limitations (must be re-evaluated for target)
  (d) Institutional knowledge that has been silently lost

  Every item requires human review. Do not assume any of these are safe to discard.

  Disposition options:
  CONFIRM RETIRED — business confirms this rule no longer applies
  RE-ENABLE IN TARGET — rule was disabled for a legacy reason; must be in the target
  INVESTIGATE — origin unknown; needs domain expert input before disposition
-->

| ID | Description | How found | Likely origin | Disposition |
|----|-------------|-----------|--------------|-------------|
| DD-001 | [Description] | Commented-out / Feature flag / Dead branch | [Legacy workaround / Deprecated / Unknown] | CONFIRM RETIRED / RE-ENABLE / INVESTIGATE |

---

### DD-001: [Rule name]

**How found:** [e.g. Commented out lines 234–267 / Behind feature flag `FLAG_NAME=false` / Dead else branch in method X]

**What it did:**
> [Description of the rule behaviour if it were active — based on the code as written]

**Likely origin (inferred):**
[Why this may have been disabled:
- Legacy platform limitation (e.g. "appears to be a workaround for a Fiserv behaviour")
- Product change (e.g. "product appears to have retired this fee type")
- Superseded by another rule (e.g. "a later version of this logic exists in function Y")
- Unknown — no comment or commit context available]

**Risk if excluded from target:**
[What would happen if this rule were never implemented in the new system]

**Disposition:** CONFIRM RETIRED / RE-ENABLE IN TARGET / INVESTIGATE
**Confirmed by:** [Name] | **Date:** | **Notes:**
