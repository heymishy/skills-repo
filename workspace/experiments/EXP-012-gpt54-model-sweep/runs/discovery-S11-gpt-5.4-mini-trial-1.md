## Discovery summary

You are proposing an open banking consent management API that lets **accredited third parties** access **customer financial data** with **explicit, granular, time-limited consent** given via the member portal.

### Proposed shared data types
Customers may consent to any combination of:

1. **Transaction history** — up to 12 months  
2. **Current account balances and available credit**  
3. **Credit card summaries** — statement balances, payment due dates, utilisation  
4. **Enriched insights** — spending category breakdowns, estimated monthly income, 90-day projected balance

### Consent model
- Consent is given **by the customer**
- Consent is **granular** by:
  - data type
  - third party
- Consent is **time-limited** — up to 12 months
- Customer can **revoke at any time**
- On revocation, the third party must **delete all data received under that consent**

### Third-party access controls
- Third parties must be **accredited** by a designated authority
- Accreditation status will be checked **on every API call**
- If accreditation is lost, new data access is **blocked immediately**

### Privacy position
- Data will only be shared where:
  - customer has given **explicit consent**
  - for the **specific data type**
  - to the **specific third party**
- No more data than consented will be shared
- Privacy team has reviewed and is comfortable with the model

### Launch intent
- Initial cohort: **10 accredited partners**
- Launch timeline: **within 6 months**
- Enriched insights tier: **available from day one**

---

## Key issues to confirm

1. **Data classification and legal basis**
   - Are the enriched insights considered personal information, derived information, or a new product category under your privacy framework?
   - Do any of the insights create additional obligations because they are derived rather than directly collected?

2. **Consent scope and recordkeeping**
   - Will consent be recorded at the level of:
     - data type
     - third party
     - account
     - purpose/use case
   - Do you need a consent receipt or audit trail for regulators and dispute handling?

3. **Deletion after revocation**
   - How will deletion by third parties be verified?
   - Will you require contractual attestations, API acknowledgement, or periodic compliance reporting?

4. **Enriched insights generation**
   - Is the analytics engine generating insights in real time, near real time, or batch?
   - Are the insights generated only after consent, or can they be precomputed and then shared upon consent?

5. **Accreditation checks**
   - What system will be the source of truth for accreditation status?
   - How quickly does the accreditation authority update status changes?
   - Do you need token revocation or key rotation when accreditation is withdrawn?

6. **Launch readiness**
   - Is the member portal already capable of granular consent flows?
   - Are the partner onboarding, conformance testing, and monitoring processes ready for 10 partners in 6 months?
   - Is the enriched insights product sufficiently stable and explainable for external release at launch?

---

## Likely product and delivery risks

- **Enriched insights may require additional governance** because they are derived data and may be more sensitive from a product, privacy, and explainability standpoint.
- **Revocation + deletion enforcement** is operationally non-trivial and may need strong contractual and technical controls.
- **Per-call accreditation validation** is sound but adds dependency on the accreditation authority’s availability and timeliness.
- **Granular consent UX** can become complex if customers must choose between multiple data types, multiple partners, and multiple accounts.

---

## Suggested next step

If you want, I can turn this into one of the following:

1. **A discovery artifact** with risks, assumptions, dependencies, and open questions  
2. **A product requirements summary** for the consent API  
3. **A delivery plan** for the 6-month launch to 10 partners  
4. **A compliance-focused assessment** of the consent and data-sharing model