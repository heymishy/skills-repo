Below is the /discovery output for the proposed consent management API in the enterprise’s open banking programme.

---

## 1) Executive summary

The enterprise wants to launch a consent-driven API that enables accredited third parties to access customer financial data, with customer permission, as part of its open banking programme. The proposition includes both raw banking data and a higher-value enriched insights tier generated internally. Customers grant granular, time-limited consent through the member portal, and only accredited third parties may access data. Accreditation is checked on every API call, and revocation must immediately stop future sharing.

This is a strong candidate for discovery because it combines:
- regulated and privacy-sensitive data sharing,
- third-party ecosystem participation,
- fine-grained consent and revocation controls,
- policy and legal interpretation questions,
- operational dependence on external accreditation status,
- launch-time pressure,
- and a potentially important distinction between raw customer data and derived/enriched analytics outputs.

The enriched insights element is likely the most material area needing policy, legal, risk, and architectural clarification before launch scope is confirmed.

---

## 2) Problem statement

The enterprise needs a secure, privacy-compliant, customer-centric mechanism for sharing financial data with accredited third parties. The API must:
- allow customers to grant and revoke consent,
- support granular data-sharing choices,
- enforce sharing only to the approved third party,
- ensure accreditation is valid continuously,
- and launch quickly to an initial partner cohort.

The business also wants to include enriched insights at launch because they are believed to be more valuable than raw data alone. However, these insights are derived data products rather than direct records from core systems, which may affect:
- whether they can be shared under the same consent basis,
- whether they fit within open banking scope,
- whether they require additional disclosures or controls,
- and whether downstream deletion and lifecycle requirements are practical.

---

## 3) In-scope capability understood from the brief

### Customer-consent model
- Consent collected via member portal.
- Consent is granular by:
  - data type,
  - third party.
- Consent duration is time-limited up to 12 months.
- Customers can revoke at any time.

### Data types proposed for sharing
- Transaction history, up to 12 months.
- Current account balances and available credit.
- Credit card summaries:
  - statement balances,
  - payment due dates,
  - utilisation.
- Enriched insights:
  - spending category breakdowns,
  - estimated monthly income,
  - 90-day projected balance.

### Third-party controls
- Third parties must be accredited by a designated authority.
- Accreditation validated on each API call.
- Loss of accreditation results in immediate blocking of new data access.

### Privacy and compliance intent
- Explicit consent required for each data type and third party.
- No over-sharing beyond consented scope.
- Privacy team is comfortable with the overall consent model.

### Delivery goal
- Launch within 6 months.
- Initial cohort of 10 accredited partners.
- Enriched insights available from day one.

---

## 4) Key discovery themes

### A. Consent domain design
The proposition depends on a robust consent domain model. Discovery should test:
- how consent objects are structured,
- how data types are represented,
- whether enriched insights are separate consent items or a bundle,
- how expiry is enforced,
- how revocation propagates across all serving layers and caches,
- what evidence of consent is retained for audit,
- and what happens when a customer changes account relationships or product holdings.

### B. Accreditation dependency
Validating accreditation on every call is a strong control, but introduces runtime dependency questions:
- availability and latency of the accreditation authority,
- caching and time-to-live strategy,
- fail-open vs fail-closed behaviour,
- evidence logging,
- treatment of temporary authority outages,
- and how accreditation changes are propagated in near real time.

### C. Derived/enriched data policy treatment
The enriched insights are not raw banking records; they are internally derived analytics. Discovery must clarify:
- whether these insights are legally and policy-wise shareable under the same open banking framework,
- whether they are “customer data,” “derived data,” or a separate product,
- whether consent language must distinguish inferred/probabilistic outputs,
- and whether accuracy, explainability, contestability, or disclaimer requirements apply.

This is likely the biggest launch-scope uncertainty.

### D. Revocation and deletion obligations
The brief states that on revocation the third party must delete all data received under that consent. Discovery should validate:
- whether this is a contractual requirement or technically enforceable requirement,
- whether the API ecosystem needs deletion attestations,
- how revocation events are communicated to third parties,
- whether downstream copies, backups, and derivative models are in scope,
- and how the enterprise demonstrates compliance if challenged.

### E. Data minimisation and boundary enforcement
The enterprise intends to share only the consented data types. Discovery should ensure:
- field-level scoping is precise,
- APIs do not accidentally reveal adjacent information,
- aggregation endpoints do not expose hidden attributes,
- enriched insights do not leak unsupported inferences,
- and product/account relationships are limited to those actually covered by customer consent.

### F. Launch readiness for partner ecosystem
A 6-month launch for 10 partners is achievable only if:
- the consent model is settled early,
- accreditation integration is straightforward,
- legal terms with partners are standardised,
- onboarding and testing environments are ready,
- data schemas are stable,
- and operational support is designed for partner incidents and customer complaints.

---

## 5) Likely stakeholder groups

- Open banking programme / product owner
- Privacy
- Legal / regulatory counsel
- Risk and compliance
- Security / IAM
- API platform engineering
- Core banking data owners
- Analytics / insights engine owners
- Member portal / digital channel team
- Third-party ecosystem / partner onboarding
- Operations / service management
- Data governance / records management

---

## 6) Critical assumptions surfaced from the brief

These appear to be assumed true, but should be explicitly validated:

1. Explicit customer consent is a sufficient basis for sharing each listed data type.
2. Enriched insights can be shared under the same framework as raw financial data.
3. The privacy review already completed is sufficient for launch, including derived insights.
4. The accreditation authority can support per-request validation operationally.
5. Immediate blocking on accreditation loss is technically and contractually straightforward.
6. Revocation can be enforced quickly enough to meet legal and customer expectations.
7. Third parties can and will delete previously received data on revocation.
8. The member portal can present consent choices clearly enough for meaningful customer understanding.
9. The analytics engine can serve enriched insights with sufficient reliability, latency, and explainability for external use.
10. Six months is enough to deliver consent UX, API controls, accreditation integration, partner onboarding, auditability, and launch governance.

---

## 7) Major risks and ambiguities

### 1. Enriched insights may not be clearly in scope for open banking sharing
This is the top discovery risk. Because the insights are generated internally and include inferred outputs like estimated monthly income and projected balance, there may be legal, regulatory, or policy differences from raw transaction or account data.

Questions include:
- Are inferred/derived values covered by the same customer data-sharing rights?
- Are there restrictions on sharing predictions or estimates?
- Are there quality, liability, or disclaimer implications if third parties act on them?
- Is separate customer consent wording required?
- Is this a regulated “insight product” rather than ordinary open banking data?

### 2. Consent granularity may be too coarse unless defined precisely
“Transaction history” and “enriched insights” are broad categories. Discovery should clarify:
- whether all transaction accounts are in scope or selected accounts only,
- whether historical period can be less than 12 months,
- whether all insight subtypes are individually selectable,
- whether future additions to insights require fresh consent.

### 3. Revocation may stop future access but not fully solve downstream retention
The brief says third parties must delete all data on revocation. In practice:
- deletion may be hard to verify,
- data may already have informed third-party models or recommendations,
- contractual enforcement may differ from technical enforcement,
- and customer expectations may exceed what the ecosystem can guarantee.

### 4. Per-call accreditation validation may create resilience issues
If the accreditation service is unavailable:
- do calls fail,
- is there a grace period,
- can status be cached,
- how are false denials or accidental continued access avoided?

### 5. Enriched insights may create explainability and complaints handling burdens
If a customer disputes estimated income or projected balance:
- can the enterprise explain the basis,
- does the third party present it as fact or estimate,
- who owns remediation,
- and how are reputational risks handled?

### 6. Launch in 6 months may be challenged by governance rather than engineering
Even if API development is feasible, timeline pressure may come from:
- legal interpretation,
- consent wording approvals,
- partner contract terms,
- operational runbooks,
- and security/risk sign-off.

---

## 8) Discovery questions to answer

### Customer consent and UX
- How are data types presented so customers understand exactly what they are sharing?
- Are enriched insights clearly labelled as estimates/inferences rather than raw account facts?
- Can customers consent per account, per product, per data type, and per partner?
- What evidence of consent is stored, and how is it audited?
- How are expiry reminders and renewals handled?
- Is revocation immediate in the portal and all downstream enforcement points?

### Legal / policy
- Are all proposed data types shareable under applicable open banking and privacy frameworks?
- Is there any special treatment required for derived/inferred analytics?
- Does estimated monthly income create sensitivity beyond standard financial data sharing?
- What disclosures, disclaimers, or fairness statements are required for projected balances?
- Is third-party deletion on revocation a legal requirement, contractual requirement, or both?
- What records must be maintained to evidence lawful sharing and lawful revocation handling?

### Accreditation
- What interface does the accreditation authority provide?
- What are expected SLAs, error modes, and response semantics?
- What is the policy for temporary inability to validate status?
- How quickly must accreditation revocations take effect?
- Is there a push event mechanism, or only pull validation?

### Data architecture
- Which systems are sources of truth for each data type?
- Are enriched insights precomputed or generated on demand?
- What timestamps and freshness indicators are exposed?
- How is consent enforcement applied consistently across raw and derived data services?
- Are there hidden dependencies where insights rely on data not explicitly consented for sharing?

### Security and operational controls
- How are third parties authenticated and authorised?
- Are partner credentials bound to accreditation identity?
- What audit logs are required for every data disclosure event?
- How are suspicious access patterns detected?
- What support model exists for customer disputes, partner incidents, and accreditation changes?

### Partner ecosystem
- What standard terms govern use, storage, onward disclosure, and deletion?
- Will partners need sandbox access and conformance testing?
- What versioning and change management process applies?
- How are disputes handled if a partner claims valid consent but the enterprise rejects access?

---

## 9) Initial view of requirements shape

### Functional requirements likely needed
- Create, view, update, revoke consent grants.
- Model consent by customer, third party, data type, duration, and possibly account/product.
- Validate partner accreditation on each access request.
- Enforce field/data-type level authorisation.
- Expose raw account/transaction data and enriched insights separately.
- Maintain auditable disclosure records.
- Notify or otherwise signal revocations and expiries to partners.
- Block access immediately on accreditation loss or consent revocation/expiry.

### Non-functional requirements likely needed
- Strong authentication and authorisation.
- High auditability and tamper-evident records.
- Low-latency access checks despite external accreditation validation.
- High availability or clearly defined fail-safe behaviour.
- Privacy-by-design and data minimisation.
- Explainability/freshness metadata for enriched insights.
- Scalable onboarding and support for at least initial partner cohort.

---

## 10) Likely decision points

These are the decisions discovery should drive:

1. **Can enriched insights be included in launch scope at all?**
2. **If yes, do they require separate consent language and separate API tiering?**
3. **What is the exact granularity of customer consent?**
4. **What is the runtime strategy for accreditation validation?**
5. **What constitutes “immediate” revocation and accreditation blocking operationally?**
6. **What deletion obligations and evidence are required from third parties?**
7. **Is a phased launch needed, with raw data first and enriched insights after?**

---

## 11) Recommended discovery framing

### Recommended discovery objective
Determine whether the enterprise can launch a compliant, operable consent management API within 6 months, including whether enriched insights are permissible and practical for day-one release.

### Recommended discovery workstreams
1. **Policy/legal**
   - Confirm treatment of raw vs derived data.
   - Confirm consent wording and disclosure requirements.
   - Confirm revocation/deletion obligations.

2. **Service design / customer experience**
   - Design meaningful consent UX.
   - Validate comprehension of data-sharing choices.

3. **Architecture / integration**
   - Define consent service, authorisation model, accreditation integration, audit model.
   - Assess analytics engine exposure pattern.

4. **Security / risk**
   - Define runtime controls, failure modes, logging, fraud/abuse monitoring.

5. **Partner operating model**
   - Define accreditation handling, onboarding, terms, conformance, revocation communications.

### Suggested early spike
Run an immediate legal/privacy/risk spike specifically on **enriched insights**:
- spending categories,
- estimated monthly income,
- projected balance.

This should be treated as the first gating question, because if unresolved it could significantly alter launch scope and API design.

---

## 12) Preliminary recommendation

Proceed with discovery, but treat the initiative as **policy-sensitive and design-critical**, not just an API delivery exercise.

Most likely path:
- Raw transaction/account/credit-card data appears conceptually aligned to a consent-based open banking model.
- Enriched insights are the highest-value but also highest-uncertainty element.
- The safest approach is to make launch scope for enriched insights explicitly contingent on a fast-track legal/privacy/risk decision.
- In parallel, design consent and authorisation models so enriched insights can be switched on as a distinct data tier if approved.

---

## 13) Discovery output summary

### Opportunity
A differentiated open banking API that gives customers granular control and offers high-value data products to accredited fintechs.

### Core unknown
Whether internally derived enriched insights can be shared at launch under the same consent and compliance model as raw banking data.

### Primary risks
- legal/policy treatment of derived data,
- enforceability of revocation/deletion,
- operational resilience of per-call accreditation checks,
- timeline compression across governance and delivery.

### Immediate next step
Start with a targeted discovery sprint focused on:
1. legal/privacy position on enriched insights,
2. consent granularity and wording,
3. accreditation validation operating model,
4. revocation/deletion control design.

If useful, I can next convert this into a **structured discovery artefact** with sections like:
- goals / non-goals,
- assumptions,
- risks,
- key questions,
- stakeholders,
- and recommended epics.