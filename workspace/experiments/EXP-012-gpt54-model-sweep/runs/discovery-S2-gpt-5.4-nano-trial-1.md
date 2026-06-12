## /discovery — Findings & recommended next steps (Personal lending digitisation)

### 1) Current state (as-is)
- **Entry channel:** Customer calls contact centre.
- **Agent actions:** Manually captures application data into **Dynamics**.
- **Decision process:** Credit analyst reviews using:
  - **Credit bureau data** (via Centrix)
  - **Internal transaction history** from core banking
  - **Internal risk scorecard / decision model**
- **Time to decision:** **3–5 days** end-to-end.
- **Decision threshold concept today:** Implicitly analyst-led (no automated tiering described for existing flow).

---

### 2) Target state (to-be)
**Digitised application** via **mobile app + web**:
1. Customer enters **loan purpose, amount, term**
2. System pulls **core banking transaction history**
3. System requests **credit bureau report from Centrix**
4. System combines:
   - bureau data
   - transaction history
   - internal risk scorecard
5. System outputs:
   - **Automated decision for loans up to $30,000**
   - **Manual review routing for > $30,000**

**Go-live goal:** before end of **Q3** (winter lending season).

---

### 3) Key gaps/risk themes to resolve now (high priority)

#### A. Responsible lending / “reasonable inquiries” compliance risk
- Current process meets obligations via **manual agent interview**.
- In the automated flow, legal team hasn’t confirmed how we will satisfy:
  - gathering sufficient customer financial information
  - assessing ability to repay
  - documenting inquiries and rationale
- **Risk:** Non-compliance with responsible lending requirements if the automated journey relies only on bureau + internal transactions without appropriate affordability/financial situation inquiry.

**Discovery actions**
- Map the current *agent interview* questions to:
  - affordability inputs
  - expenses / income / dependants
  - employment stability (if relevant)
  - existing commitments
- Decide whether automation will:
  - replicate those data captures via UI (web/app + dynamic questions), and/or
  - infer additional information from bureau + transaction data, and
  - support “reasonable inquiries” audit trails and prompts.

#### B. Fairness / bias validation & FMA disclosure risk
- Credit decision model **has not been independently validated for bias**.
- Prior internal review (~8 months ago) found **statistically different approval rates across demographic groups**.
- This was **not escalated** and **not disclosed to the FMA**.

**Risk:** Material regulatory and reputational risk if the automated system is launched without:
- independent validation,
- governance/controls,
- remediation plan,
- and clarity on FMA expectations.

**Discovery actions**
- Confirm the existence and details of:
  - the statistical review methodology,
  - which groups were impacted,
  - effect sizes and whether bias is persistent.
- Establish an immediate **independent model validation** workstream.
- Determine what needs to be disclosed to FMA *before* launch (legal/compliance sign-off required).

#### C. Automated decision acceptance + fallback process design
- For **> $30,000**, route to analyst review.
- Need to define:
  - how the application is packaged for analysts,
  - what additional info is required,
  - what happens if bureau is unavailable/takes too long,
  - service levels and SLA for analyst review so we still compete.

**Discovery actions**
- Define decision workflow states:
  - “Submitted”
  - “Bureau requested / pending”
  - “Automated decision pending”
  - “Automated declined—eligibility for reconsideration?”
  - “Manual review triggered”
  - “Manual decision—customer notified”
- Define “stop/hold” rules if data quality is insufficient.

#### D. Data integration, consent, and auditability
To meet responsible lending + regulatory defensibility, we need:
- explicit customer consents for:
  - bureau access
  - core banking data access
- a complete **audit trail**:
  - what data was used
  - timestamps (especially bureau)
  - what prompts were shown
  - which version of the model/rules applied

**Discovery actions**
- Confirm consent and disclosure requirements for bureau + internal data usage.
- Confirm how model versioning and decision explanations will be stored.

#### E. Operational readiness for “same-day”
Automated decisions must support competitor expectations.
Key latency points:
- bureau report turnaround
- core banking pull performance
- decisioning execution
- notification delivery

**Discovery actions**
- Build latency budgets and monitoring:
  - typical vs worst-case
  - queueing / retry strategy
- Define fallback UX:
  - if bureau is delayed, do we:
    - show “in progress” and notify later
    - or route to manual?

---

### 4) Suggested discovery workplan (to derisk Q3 go-live)

#### Workstream 1 — Regulatory & legal requirements mapping (responsible lending)
**Deliverables**
- A “Responsible lending inquiry map”:
  - what financial information must be collected
  - which fields come from UI vs bureau vs transaction history
  - required disclosures + consent
- A compliance checklist and required sign-offs for launch

**Owner(s):** Legal, Compliance, Product, Risk

---

#### Workstream 2 — Bias/fairness validation & remediation plan
**Deliverables**
- Independent fairness/bias assessment plan (and timeline fast-tracked)
- For any identified issues:
  - mitigation approach (threshold adjustments, model changes, constraints, exclusions, human override logic)
  - governance plan for ongoing monitoring post-launch

**Owner(s):** Risk analytics, Compliance, Legal, Data science

> Given the FMA disclosure sensitivity, this workstream should start immediately.

---

#### Workstream 3 — Target journey design + decision workflow
**Deliverables**
- Screen-by-screen mobile/web journey
- Decisioning logic specification:
  - automated rules for ≤ $30,000
  - manual routing rules for > $30,000
  - data sufficiency checks
- Analyst handover format (what they see, what they can override, audit trail)

**Owner(s):** Product, Risk, Collections/Underwriting operations

---

#### Workstream 4 — Technical architecture & data integration
**Deliverables**
- Integration specs:
  - core banking transaction history API/query design
  - Centrix bureau request/response handling + SLAs
- Data model + audit store for:
  - applicant inputs
  - external bureau data snapshots
  - internal scorecard inputs
  - decision outputs + model version
- Resilience patterns (timeouts, retries, idempotency)

**Owner(s):** Architecture, Engineering, Integration

---

#### Workstream 5 — Monitoring, explainability, and customer outcomes
**Deliverables**
- KPIs and dashboards:
  - straight-through approval rate (≤ $30k)
  - decision latency
  - manual routing rate
  - decline reasons distribution
- Decision explanation strategy:
  - what the customer sees
  - what internal teams see
- Ongoing bias monitoring plan post-launch (even if independent validation is done pre-launch)

**Owner(s):** Risk, Compliance, Data/Engineering

---

### 5) Key questions to answer in discovery (must clarify quickly)
1. **What exactly did the 8-month review find?** (affected groups, metrics, severity, recommended actions)
2. **Do we have a model governance framework today?** (versions, approvals, monitoring cadence)
3. **What are the responsible lending “reasonable inquiry” inputs required by our legal team?**
4. **Will the UI capture income/expenses/commitments explicitly**, or are we relying on inferred affordability from transactions + bureau?
5. **What are our service-level targets** for:
   - bureau retrieval
   - automated decision generation
   - customer notification
6. **What is the manual analyst SLA** for > $30k, and how will the customer experience differ?
7. **Consent and audit requirements**: what data must be stored and for how long?
8. **What happens on edge cases** (no bureau match, bureau errors, insufficient history)?

---

### 6) Recommendation (practical next step)
If you want to hit “before end of Q3,” discovery should be run in parallel with build, but **bias validation + responsible lending inquiry mapping must be treated as launch blockers** (not nice-to-haves) because:
- the bias issue is already known internally (regulatory risk),
- and the responsible lending obligation is structurally different in automation than in the manual interview.

---

If you want, I can convert this into a **structured discovery backlog** (epics + user stories + acceptance criteria) and a **high-level timeline** through end of Q3, but I’ll need: current model/scorecard name, whether you have existing bureau integration, and what fields the current agent interview collects.