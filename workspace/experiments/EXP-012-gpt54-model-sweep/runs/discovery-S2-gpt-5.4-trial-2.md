## Discovery Summary

You want to digitise personal loan origination for existing enterprise customers by replacing a contact-centre-led, manual 3–5 day process with a mobile/web application journey that can deliver same-day automated decisions for loans up to $30,000, and manual analyst review above that threshold.

This is commercially attractive and strategically important, but there are major delivery, compliance, and conduct risks that make this **not just a channel digitisation project**. It is also a **credit decisioning, responsible lending, and model governance initiative**.

---

## 1) Problem Statement

Current state:
- Customer calls contact centre
- Agent manually captures information in Dynamics
- Credit analyst reviews:
  - bureau data
  - internal transaction history
  - internal scorecard
- Decision takes **3–5 days**

Business pain:
- Competitors offer **same-day personal loan decisions**
- Customers are dropping out and choosing ASB / ANZ
- Existing process is operationally expensive and slow

Desired future state:
- Mobile and web application journey for existing customers
- Customer enters:
  - loan purpose
  - amount
  - term
- System retrieves:
  - internal transaction history from core banking
  - Centrix bureau report
  - internal risk scorecard
- Automated decision for loans up to **$30,000**
- Manual analyst review for loans above **$30,000**
- Target go-live: **before end of Q3**

---

## 2) What this initiative actually is

This initiative spans multiple domains:

- **Digital origination**
- **Credit decision automation**
- **Consumer lending compliance**
- **Model risk / bias management**
- **Conduct risk**
- **Operational workflow transformation**

It should not be framed as “build a digital form and decision API.”  
The critical question is:

**Can the bank lawfully, safely, and fairly automate lending decisions using the current model and evidence set?**

Right now, there are strong signals the answer may be **no, not without remediation or controls**.

---

## 3) Key Risks Identified

### A. Responsible lending / CCCFA compliance risk
You explicitly state:
- manual agent interview currently satisfies “reasonable inquiries” obligations
- legal has **not yet confirmed** how automated flow will satisfy the same obligation

This is a **gating risk**, not a downstream detail.

Implications:
- If the digital flow does not gather sufficient information to support affordability/suitability inquiries, automated approvals may breach responsible lending obligations.
- Existing transaction history alone may not be enough.
- A simple form asking purpose, amount, term is likely insufficient unless supplemented with validated affordability inputs, declarations, expense capture, account analysis logic, and legal sign-off.

**Discovery conclusion:**  
There is no confirmed compliant target operating model yet for automated inquiries.

---

### B. Model bias / fairness / conduct risk
You state:
- the model has **not been independently validated for bias**
- an internal review 8 months ago found **statistically different approval rates across demographic groups**
- this was **not escalated**
- it has **not been disclosed to the FMA**

This is the most serious issue in the brief.

Implications:
- You have prior internal knowledge of potential discriminatory or unfair outcomes.
- Automating and scaling decisions with this model may materially amplify harm.
- Governance failure already exists: non-escalation of a potentially material conduct/model issue.
- If discovered later, this could create significant regulatory, legal, audit, and reputational consequences.

**Discovery conclusion:**  
The current model should be treated as **high risk and potentially unsuitable for scaled automated deployment** until independently reviewed and remediated.

---

### C. Regulatory / disclosure / governance risk
The undisclosed internal finding raises questions:
- Was this a material conduct issue?
- Did model risk, compliance, legal, or risk committee review it?
- Is there a breach or potential breach analysis?
- Should regulators have been informed?
- Who accepted continued model use?

This creates a likely need for:
- urgent internal escalation
- legal privilege review
- compliance assessment
- executive risk acceptance or stop/go decision

---

### D. Decision explainability and adverse action handling
An automated lending flow will require:
- reasons for decline or referral
- customer communications
- complaint handling pathway
- analyst override process
- audit trail of inputs, rules, model outputs, and final decision

If these are not designed up front, operational and conduct issues will emerge quickly.

---

### E. Data and integration dependency risk
Required integrations:
- core banking transaction history
- Centrix bureau
- internal scorecard
- Dynamics / CRM likely still needed
- manual review workflow for >$30k and referred applications
- digital channels: mobile and web
- identity/session/customer authentication controls

Potential issues:
- real-time or near-real-time availability of transaction data
- bureau integration latency, resilience, and consent handling
- scorecard implementation parity with current manual process
- case orchestration between digital and analyst workflows

---

### F. Time-to-market risk
You want to launch before end of Q3.

Given the unresolved issues around:
- legal interpretation of automated responsible lending inquiries
- model bias validation
- governance escalation
- manual review workflow design
- digital build and integration testing

A full automated production launch by Q3 is **high risk** unless scope is narrowed substantially.

---

## 4) Assumptions that need validation

These appear implicit in the request but are not yet proven:

- Existing customers’ internal transaction history is sufficient to support affordability assessment
- Current scorecard is appropriate for automated production use
- Centrix and internal data can be fetched in real time
- Existing manual policy can be translated into deterministic digital rules
- Bias findings do not prevent continued use of the model
- Legal/compliance approval can be obtained within project timelines
- Analyst review capacity can absorb referrals above $30k and edge cases
- Existing customers can be digitally identified without additional friction
- Adverse decisions can be communicated in a compliant and customer-friendly way

These should be treated as discovery hypotheses, not facts.

---

## 5) Core Discovery Questions

### Business
- What measurable drop-off is occurring today at each stage?
- What volume of existing-customer personal loan applications do you expect digitally?
- What proportion of applications are under $30k vs over $30k?
- Is same-day decision the primary objective, or full straight-through approval/funding?

### Credit policy
- What exact rules govern manual approval today?
- What information does the analyst use beyond transaction history and bureau?
- What conditions trigger decline, refer, or request-more-information?
- Can policy be codified, and where does human judgment remain essential?

### Responsible lending / legal
- What constitutes “reasonable inquiries” for this product and customer segment?
- Can internal account conduct plus declarations satisfy this?
- Are additional questions needed on expenses, employment, dependants, other liabilities, hardship indicators?
- What evidence must be retained?
- Can automated approvals occur before this is settled? Likely no.

### Model risk / fairness
- What demographic disparities were identified?
- Were they explainable by risk-relevant variables or not?
- Was the internal review documented formally?
- Has model risk management reviewed methodology, performance drift, fairness, and feature governance?
- What remediation options exist: recalibration, variable removal, threshold changes, human-in-the-loop?

### Operations
- What is the target review SLA for referred cases?
- How are analysts queued work?
- What override rights exist?
- How are exceptions handled?
- What happens if bureau or core banking data is unavailable mid-journey?

### Technology
- Are APIs available for:
  - transaction history
  - scorecard execution
  - bureau requests
  - case management
- Is there an existing decision engine?
- Is mobile/web authentication already sufficient for a lending application?
- How will consent and disclosures be captured?

---

## 6) Initial Risk Rating

### Overall initiative risk: **High**

Because of:
- unresolved legal basis for automated responsible lending inquiries
- known but unremediated bias concerns
- governance/escalation failure
- compressed timeline
- customer-facing automated decisioning in a regulated domain

### Risk breakdown
- Delivery risk: **Medium-High**
- Compliance risk: **High**
- Conduct risk: **High**
- Model risk: **High**
- Reputational risk: **High**
- Commercial opportunity: **High**

---

## 7) Recommended Positioning to Sponsors

This should be presented as:

> “A phased digital lending programme with gated controls, not a straight digital channel release.”

That framing matters because it justifies:
- compliance and model validation gates
- limited-scope launch if needed
- manual fallbacks
- staged automation

---

## 8) Recommended Phased Approach

### Phase 0: Immediate governance escalation
Before further delivery commitment:
- Escalate model bias findings to:
  - Chief Risk Officer / credit risk
  - compliance
  - legal
  - model risk governance
  - relevant conduct committee
- Review whether the prior internal finding creates:
  - incident / breach obligations
  - regulator engagement requirements
- Decide whether current model use can continue unchanged

This is urgent.

---

### Phase 1: Compliance and policy design
Define the minimum viable compliant digital lending policy:
- what questions must be asked
- what data can be inferred from internal records
- what declarations are needed
- what evidence must be retained
- when applications must refer to human review

Output:
- approved digital responsible lending standard
- product/legal sign-off
- decision policy blueprint

---

### Phase 2: Model validation and control design
Independent assessment of:
- predictive performance
- fairness/bias
- feature set appropriateness
- explainability
- monitoring requirements
- threshold suitability for automation

Output:
- go/no-go for automated decisioning
- required remediation
- human oversight rules
- monitoring dashboard requirements

---

### Phase 3: MVP digital origination
If above gates are passed, launch a constrained MVP:
- existing authenticated customers only
- limited loan amounts/products
- digital application capture
- automated data retrieval
- **refer-first or approve-low-risk-only** strategy
- analyst review for all edge cases
- clear audit trail and customer communications

This may be the safest route to hit Q3 partially.

---

### Phase 4: Expanded automation
Once controls are proven:
- increase straight-through approval rates
- optimise decision thresholds
- improve customer experience
- potentially raise automation ceiling if justified

---

## 9) MVP Options for Q3

Given the timeline, here are realistic options:

### Option A: Full automation up to $30k by Q3
**Not recommended currently**
- blocked by legal and model governance uncertainties
- high regulatory and conduct exposure

### Option B: Digital application intake + automated data gathering + analyst decision
**Most feasible near-term**
- digitises customer journey
- reduces call-centre friction
- improves turnaround without relying on full automation
- lower compliance/model risk
- can still materially reduce cycle time

### Option C: Limited automated approvals for narrowly defined low-risk segment
**Conditionally viable**
- only after urgent legal and model validation
- strict policy thresholds
- all non-clear-cut cases referred
- strongest candidate if business insists on some same-day decisions

### Option D: Soft launch / pilot only
- selected customer cohort
- close monitoring
- manual backstop for every decision
- good if governance concerns take time to resolve

---

## 10) Likely Recommendation

My recommendation from discovery would be:

### Primary recommendation
Proceed with a **phased digital origination MVP**, but **do not commit yet to broad automated approvals up to $30,000** until:
1. legal confirms CCCFA-compliant automated inquiry approach
2. model fairness/validation review is completed
3. bias findings are formally escalated and dispositioned
4. controls, monitoring, and auditability are designed

### Secondary recommendation
Aim Q3 for:
- digital application journey
- integrated data retrieval
- pre-population for existing customers
- automated triage / referral
- potentially limited straight-through approval for a very narrow approved segment, only if governance gates are cleared

This balances speed and risk.

---

## 11) Key Artefacts to Produce in Discovery

- Current-state journey map
- Future-state service blueprint
- Credit decision policy inventory
- Responsible lending obligations assessment
- Model risk and fairness assessment
- Regulatory/compliance issue log
- Data/integration architecture map
- Operating model for analyst referrals and overrides
- MVP scope options with risk-adjusted recommendation
- Delivery roadmap with stage gates
- RAID log
- Executive decision paper

---

## 12) Discovery RAID Log

### Risks
- Automated flow may not satisfy CCCFA reasonable inquiries
- Current model may embed unfair demographic bias
- Prior internal bias finding was not escalated
- Possible regulator exposure if issue later emerges
- Integration latency/failures may break decision flow
- Q3 deadline may force unsafe shortcuts

### Assumptions
- Existing-customer data materially reduces inquiry burden
- Legal will approve digital inquiry design
- Model can be validated/remediated in time
- Core banking and Centrix can support near-real-time requests

### Issues
- No independent bias validation completed
- Internal adverse review exists and was not escalated
- No confirmed legal position on automated responsible lending
- Manual process knowledge may be tacit and not fully documented

### Dependencies
- Legal/compliance sign-off
- Model risk review
- Credit policy codification
- Core banking / Centrix integration
- CRM / workflow integration
- digital channel release capacity

---

## 13) Executive-Level Readout

### Green
- Strong market need
- Clear customer and competitive value
- Existing-customer context makes digital origination attractive
- Opportunity to reduce cost and turnaround time

### Amber
- Data and workflow integration complexity
- Manual review operating model
- Q3 delivery feasibility

### Red
- Unresolved responsible lending compliance design
- Known model bias concern without independent validation
- Potential governance / conduct issue from non-escalated findings

---

## 14) Suggested Sponsor Message

> We have a strong commercial case for digitising personal lending, but the proposed solution introduces material compliance, conduct, and model risk. The biggest blockers are unresolved responsible lending requirements for automated inquiries and a known internal bias concern with the current decision model that has not been independently validated or formally escalated.  
>  
> We recommend a gated, phased approach: urgently resolve governance and model-risk issues, define a compliant digital inquiry standard, and target Q3 for a digital origination MVP with controlled automation rather than broad straight-through lending.

If you want, I can next convert this into one of these formats:
1. **Discovery output pack**
2. **Executive briefing**
3. **Problem statement / scope / risks / next steps**
4. **A product requirements discovery document**
5. **A one-page red flags memo for leadership**