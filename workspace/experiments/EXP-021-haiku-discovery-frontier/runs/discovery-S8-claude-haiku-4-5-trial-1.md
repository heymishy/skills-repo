# /discovery Pipeline Analysis: Regulatory Reporting Automation

## Executive Summary

This is a **high-value, well-scoped automation opportunity** with significant compliance and operational risk dimensions. The business case is strong, but success depends entirely on solving the audit trail and data transformation governance requirements correctly. This is not a "build and deploy" project—it requires careful design upfront.

---

## Opportunity Assessment

### Clear Value Drivers

| Dimension | Current State | Target State | Impact |
|-----------|--------------|-------------|--------|
| **Cycle time** | 6–8 days | 2–3 days (estimated) | Removes deadline pressure; creates buffer for review |
| **Analyst capacity** | 40% on extraction/reconciliation | ~24% (freed for higher-value work) | 3–4 FTE days/month recovered |
| **Deadline risk** | 1 miss/quarter + informal extensions | Near-elimination (deadline missed only if logic breaks or source data corrupted) | Removes formal notice risk |
| **Error surface** | Manual reconciliation + Excel + normalization | Deterministic logic + versioned transformations | Reduces analyst error in adjustments |

**Regulatory benefit:** You move from reactive (missing deadlines, requesting extensions) to predictable (consistent early delivery).

---

## Critical Design Requirements

### 1. Audit Trail Architecture (Non-negotiable)

The audit trail is your compliance control and your defence against regulator scrutiny. It cannot be an afterthought.

**Minimum audit trail scope:**
- **Source data snapshot:** Timestamp, record count, hash of raw extract from each system (core banking, treasury, card platforms)
- **Transformation log:** Every transformation step applied, with:
  - Transformation ID and version
  - Input and output values (for every field modified)
  - Timestamp and user/system that triggered it
  - Business justification (e.g., "Legacy rounding correction applied per 2019 migration mapping")
- **Reconciliation results:** Which figures matched, which required adjustment, and why
- **Return population:** Which source values mapped to which return fields
- **Approval checkpoint:** Who approved the return, when, and whether they reviewed specific adjustments

**Implementation approach:**
- Store audit trail in a separate, immutable data layer (e.g., append-only database table, event log, or ledger)
- Each transformation step writes to the audit trail *before* modifying data, with rollback capability
- Generate a human-readable audit report that analysts review alongside the return—they should be able to see "Field X was adjusted by Y because of Z"
- Retain full audit trail for at least 7 years (typical regulatory retention) with access controls

**Why this matters for RBNZ/FMA:**
- When a regulator asks "How did you arrive at this figure?" you produce the audit trail, not an analyst's memory
- If an adjustment turns out to be incorrect, you have evidence of *who decided* and *why*, protecting the firm from allegations of intentional misstatement
- Demonstrates control environment maturity

---

### 2. Normalization Logic Governance

Formalizing legacy corrections is dangerous if not done carefully. You're moving from "analyst judgment" to "hardcoded rule"—that requires explicit ownership and change control.

**Required steps:**

1. **Document all current normalization rules:**
   - Identify every manual correction the team currently makes
   - Quantify the impact (total amount adjusted, frequency, fields affected)
   - Document the origin (e.g., "2019 migration introduced 0.01% rounding error in treasury interest rate reporting")
   - Get sign-off from the senior analyst who currently performs this step

2. **Map each rule to source:**
   - Link to the 2019 migration documentation or system defect log
   - Confirm the rule is still required (legacy systems may have been patched)
   - Identify any conditions that would make the rule inapplicable (e.g., "applies only to GBP transactions" or "only if core banking field XXX is non-zero")

3. **Implement with explicit versioning:**
   - Store normalization rules in a versioned configuration table, not hardcoded in pipeline logic
   - Each rule has: name, description, condition, transformation, effective date, owner, approval date
   - Any change to a rule requires review and revalidation of historical returns

4. **Validate with regulators (optional but recommended):**
   - RBNZ relationship manager should be made aware that you're automating legacy corrections
   - Describe the rules and the audit trail you'll maintain
   - This is not asking permission—it's demonstrating governance
   - If rules later get questioned, you have evidence of transparency

**Why this matters:**
- If a normalization rule is later found to be incorrect or no longer necessary, you need to know which historical returns it affected
- Prevents the pipeline from perpetuating a data quality issue that should have been fixed at source
- Creates accountability: someone owns each rule, not "Excel formula from 2021"

---

### 3. Source System Integration

**API requirements:**
- Read-only access confirmed and tested for all three systems
- APIs must return data with timestamps (so you can audit when extraction occurred)
- Establish SLAs: what happens if an API is unavailable on submission day?
- Test failure scenarios: Can the pipeline gracefully halt and alert analysts if data integrity checks fail?

**Reconciliation logic:**
- Cross-system matching (e.g., core banking transaction vs. treasury system record) must have clear logic for exceptions
- Build in reconciliation tolerances where appropriate (e.g., ±$1 for multi-currency rounding), but log every tolerance applied
- If a mandatory reconciliation fails, the pipeline should halt and escalate to analysts—do not auto-adjust

---

## Compliance & Regulatory Risks

### Risks You Must Mitigate

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Audit trail incomplete or lost** | Medium | Critical—regulator can challenge submitted figures | Design audit trail into architecture; test restoration; separate immutable storage |
| **Normalization rule incorrect or stale** | Medium | High—submitted return contains wrong figures | Document and version all rules; annual review; RBNZ awareness |
| **Pipeline bug causes systematic error in all months** | Low | Critical—may affect multiple return cycles; regulatory notice | Comprehensive testing; run pipeline in parallel with manual process for 2–3 cycles; analyst review gates this |
| **Source system data quality degrades** | Low–Medium | High—pipeline outputs garbage | Add data quality checks; alert on anomalies; reconciliation failures halt pipeline |
| **Submission deadline still missed because review process bottlenecks** | Medium | High—defeats main benefit | Deliver output by 18th, not 20th; build in buffer |
| **Change control for normalization logic breaks down** | Medium | High—rules change without approval; audit trail becomes unreliable | Implement formal governance; tie to change control board |

---

## Recommended Approach

### Phase 1: Design & Validation (3–4 weeks)

1. **Audit trail design:** Work with compliance and IT to specify the immutable audit layer. Document what every regulator needs to see.
2. **Normalization rules inventory:** Senior analysts + compliance document every current rule. Assign ownership.
3. **API & data quality assessment:** Confirm APIs, test failure scenarios, design reconciliation logic.
4. **Parallel run plan:** Design how to run pipeline alongside manual process for validation.

### Phase 2: Build & Test (6–8 weeks)

1. Extract layer (APIs → staging tables with audit logging)
2. Transformation layer (normalization rules + reconciliation logic, all versioned)
3. Return population (mapping source data to return fields)
4. Audit trail reporting (human-readable output for analyst review)
5. Comprehensive testing (success paths, failure paths, edge cases)

### Phase 3: Pilot (2–3 monthly cycles)

- Run pipeline in parallel with manual process
- Analysts compare outputs
- Resolve discrepancies
- Refine normalization rules based on edge cases discovered

### Phase 4: Deploy

- Go live for RBNZ prudential returns first (monthly, clearer deadline)
- Then extend to FMA quarterly reporting (similar logic, different fields)

---

## Key Questions for Your Team

Before greenlight:

1. **Audit trail:** Do you have IT infrastructure to support an immutable, append-only audit log? Or do you need to build it?
2. **Normalization rules:** How many manual corrections are there currently? (If >20, this is a bigger data quality problem than pipeline automation will solve.)
3. **Risk appetite:** If the pipeline goes wrong, can analysts quickly fall back to manual process and still meet deadline?
4. **Regulatory relationship:** Would your RBNZ relationship manager welcome a pre-notification that you're automating this? (Builds trust; de-risks any later scrutiny.)

---

## Bottom Line

**This is a go project.** You have strong business drivers (deadline risk, capacity), clear regulatory requirements (audit trail), and a defined scope (three systems, two reporting obligations). 

The success factor is **getting the audit trail and normalization governance right upfront.** If you cut corners here, you'll have a faster pipeline that regulators can't trust—which defeats the purpose.

**Estimated timeline:** 12–16 weeks from approval to full deployment; 4–6 weeks to first delivery (RBNZ returns).