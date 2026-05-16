# Corpus Case T5 — Customer data platform: competing regulated constraints (GDPR vs AML)

**Case ID:** T5-competing-regulated
**Experiment:** EXP-005-definition-rubric
**C-conflict present:** Yes — GDPR Article 17 (erasure) and AML/CFT Act s.26 (5-year retention) apply to the same records
**Expected D1:** 1.0 (regulated constraint propagation) if model surfaces the conflict; 0.0 if model propagates both independently without noting the conflict
**Expected D2:** 1.0 if conflict is elevated to Architecture Constraints in at least one story
**Expected CPF:** 1.0 if both C1 and C2 propagated; 0.8 if propagated separately without conflict notation
**Pass condition:** Model produces at least one story whose Architecture Constraints explicitly flags that C1 and C2 conflict for transaction records containing personal data, and that legal opinion is required before implementing C1 deletion logic that would also delete C2-scoped records
**Fail condition:** Model decomposes the feature into a "GDPR erasure story" and an "AML retention story" independently, with no Architecture Constraint noting the conflict

---

## Bundle — paste this into the /definition session

```
Discovery artefact: Customer Data Rights and Retention Platform
Status: Approved
Approved By: James Nguyen (Chief Privacy Officer), Sarah Chen (Head of Platform Engineering)
Date: 2026-04-28

PROBLEM
Hamilton bank's customers can currently request data deletion under GDPR Article 17 (right to erasure), but the bank has no automated mechanism to action those requests. A customer submits a request via email; the privacy team manually reviews it; engineers manually execute SQL deletes across four databases. The process takes 4–6 weeks and has a backlog of 140 requests. The GDPR 30-day response window is regularly missed. The bank has received two regulatory notices from the ICO (Information Commissioner's Office) for late responses.

PERSONAS
- Privacy Officer: manages the queue of GDPR erasure requests; currently reviews all requests manually in a spreadsheet; works across 4 systems to action each deletion.
- Customer: has requested data deletion; waiting weeks for confirmation; losing trust in the bank's privacy compliance.
- AML Compliance Manager: ensures that data retention obligations under the AML/CFT Act are respected during any deletion operation; needs to review and sign off on erasure requests that touch transaction records.

CONSTRAINTS
C1: GDPR Article 17 — customers have the right to erasure of personal data. The bank must respond within 30 days.
C2: AML/CFT Act 2009, section 26 — transaction records (including the name and account details of the transacting party) must be retained for 5 years from the date of the transaction. This retention obligation overrides GDPR erasure requests for transaction records within the 5-year window.
C3: The bank's identity verification records (KYC documents) are subject to AML/CFT 7-year retention under a separate provision.
C4: ICO guidance on erasure and retention conflicts — where AML retention obligations apply, the bank must inform the customer in writing that erasure cannot be actioned for those specific records, state the reason (AML Act s.26), and confirm which records ARE being erased.

ASSUMPTIONS
[ASSUMPTION] It is assumed that the bank has legal counsel review of the C1/C2 conflict before implementation begins — the split between erasure-eligible and retention-mandatory records is a legal determination, not a product one.
[ASSUMPTION] The scope of "personal data" under GDPR within transaction records has not been formally determined by legal (e.g., is a sort code + account number "personal data"?). This assumption is HIGH risk — if in-scope, all transaction records for the 5-year window are both erasure-eligible (GDPR) and retention-mandatory (AML).

MVP SCOPE
1. Automated erasure request intake (web form replacing email)
2. Case management workflow for the privacy team (review, approve, action)
3. Automated deletion execution across the four target databases for erasure-eligible records
4. AML/CFT retention hold — automated detection of records within the 5-year AML window; these records are NOT deleted; customer notified of AML hold reason per C4
5. Audit log of every erasure request: requested, reviewed, actioned/declined, AML-held records listed

OUT OF SCOPE
- KYC document deletion (C3 — 7-year retention; deferred to post-MVP phase)
- Erasure of marketing consent data (separate system, separate legal basis)
- GDPR data portability (Article 20) — separate discovery
```

---

## Expected D1 (constraint propagation) scoring

| Constraint | Expected in stories | CPF if propagated | CPF if dropped |
|------------|---------------------|------------------|----------------|
| C1 (GDPR Article 17, 30-day SLA) | Every deletion story Architecture Constraints | 1.0 | 0.0 |
| C2 (AML/CFT 5-year — overrides erasure) | Every story touching deletion logic, with explicit note that C2 overrides C1 for in-window records | 1.0 | 0.0 |
| C3 (KYC 7-year — out of MVP scope) | Out-of-scope note in relevant stories | 0.7 | 0.3 |
| C4 (ICO guidance — written notification of AML hold reason) | AC or Architecture Constraint in the AML hold story | 1.0 | 0.0 |
| C1/C2 conflict notation | Architecture Constraint in deletion execution story: "C1 and C2 conflict for transaction records within 5-year AML window. Legal sign-off required before implementing deletion logic. Precondition: legal opinion defines which fields constitute personal data under GDPR in a transaction record." | 1.0 (full mark) | 0.0 (miss) |

## Calibration guide

**Full credit (D1 = 1.0):** All four constraints propagated AND the model explicitly flags the C1/C2 conflict in at least one story's Architecture Constraints. The conflict notation must state that deletion of transaction records that are also AML-retention-mandatory requires legal sign-off — not that "we should keep both constraints in mind."

**Partial credit (D1 = 0.7):** All four constraints propagated but the C1/C2 conflict is present only as a note or caveat rather than a hard Architecture Constraint with a legal sign-off precondition.

**Partial credit (D1 = 0.4):** C1 and C2 propagated separately (each has their own story/AC) but no conflict is noted — the deletion story and the AML hold story are siloed with no cross-constraint dependency.

**Fail (D1 = 0.0):** Model decomposes the feature without flagging that a deletion request could touch AML-scoped records. Deletion execution story has no AML retention check. AML hold story is a separate concern with no connection to the deletion flow.

## Known failure mode

Model treats C1 and C2 as orthogonal:
- Story 1: "Deletion execution — deletes records per erasure request (C1)" — Architecture Constraints mentions C1
- Story 2: "AML retention hold — identifies AML-scoped records and marks as non-deletable (C2)" — Architecture Constraints mentions C2
- The two stories have no shared Architecture Constraint noting the conflict or the legal opinion precondition
- CPF for C1 = 1.0, CPF for C2 = 1.0, but conflict notation = 0.0 → D1 score = 0.4 (no conflict notation means the stories together are internally inconsistent on the central legal question)
