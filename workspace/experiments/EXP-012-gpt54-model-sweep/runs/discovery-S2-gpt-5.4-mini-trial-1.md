## Discovery summary: digital personal loan origination

### What you’re trying to do
Digitise the personal loan application journey for existing enterprise customers via mobile app and web, replacing the current call-centre/manual process.

### Current state
- Customer calls contact centre
- Agent manually enters application into Dynamics
- Credit analyst reviews using:
  - bureau data
  - internal transaction history
- Decision time: **3–5 days end to end**

### Desired future state
- Customer applies digitally in app/web
- Inputs:
  - loan purpose
  - amount
  - term
- System pulls:
  - internal transaction history from core banking
  - credit bureau report from Centrix
  - internal risk scorecard
- Decisioning:
  - **automated decision for loans up to $30,000**
  - **manual credit analyst review above $30,000**

### Business problem
- Competitors are offering same-day decisions on loans up to $50,000
- Customers are dropping out at application stage to **ASB** and **ANZ**
- Goal is to improve conversion and speed to decision

### Key constraints / risks
1. **Responsible lending obligation**
   - Must make reasonable inquiries into customer financial situation under CCCFA
   - Current manual agent interview satisfies this
   - Need a compliant equivalent in digital flow
   - Legal team has not yet confirmed approach

2. **Model governance / fairness**
   - Current decision model has **not been independently validated for bias**
   - Internal review 8 months ago found **statistically different approval rates across demographic groups**
   - This was not escalated outside the reviewing team
   - Not disclosed to the FMA

3. **Delivery deadline**
   - Target go-live: **before end of Q3**
   - Business driver: capture winter lending season

---

## Initial problem statement
Design and launch a compliant digital personal loan origination flow for existing customers that:
- reduces application abandonment and decision time,
- supports automated decisions up to $30,000,
- routes larger loans to manual review,
- satisfies CCCFA responsible lending obligations,
- and addresses model governance/fairness risk before launch.

---

## Key discovery questions to answer next

### Customer / journey
- Who are the target customer segments for phase 1?
- Existing customers only, or also new-to-bank?
- What is the minimum viable digital application journey?
- What drop-off points exist in the current journey?

### Lending / policy
- What are the eligibility rules for automated approval?
- What conditions force manual review besides amount > $30,000?
- What loan types, purposes, terms, and rates are in scope?
- Are there exclusions by employment status, arrears history, hardship, etc.?

### Compliance / legal
- What exact digital process will satisfy “reasonable inquiries” under CCCFA?
- What disclosures, declarations, and consent flows are required?
- Do we need updated legal wording for bureau consent and data use?
- Is there a requirement to provide reasons for decline?

### Risk / model governance
- What is the current model performance by segment?
- What bias metrics were observed in the internal review?
- Has the model been validated independently at all?
- What monitoring and override controls will be required?
- What is the remediation plan for the fairness issue?

### Data / integration
- What data is available in core banking and how fresh is it?
- Can transaction history be accessed in real time?
- What bureau data fields does Centrix provide?
- Is the internal scorecard already production-ready for API use?
- What systems will store application state and audit trail?

### Operations
- What happens when Centrix is unavailable?
- What happens if core banking data cannot be retrieved?
- What is the manual review workflow above $30,000?
- How will analysts receive cases and capture decisions?
- What customer communications are needed post-decision?

### Delivery / timeline
- What scope can be delivered by end of Q3?
- What dependencies are on legal, compliance, risk, and model validation?
- What decisions are needed in the next 2 weeks to stay on track?

---

## Immediate red flags
These should be treated as high priority:
1. **Unvalidated model with known demographic disparities**
2. **Possible regulatory exposure due to non-disclosure**
3. **CCCFA responsible lending process not yet designed for digital**
4. **Aggressive timeline relative to compliance and model remediation**

---

## Recommended next step
Run a structured discovery workshop across:
- Product
- Lending policy
- Legal / compliance
- Risk / model governance
- Operations / contact centre
- Engineering / data architecture

Focus first on:
1. compliant digital inquiry design,
2. model validation and fairness remediation,
3. end-to-end decisioning and manual fallback,
4. launch scope for Q3.

If you want, I can turn this into a **one-page discovery brief**, **risk register**, or **requirements list**.