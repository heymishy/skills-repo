# Vendor Q&A Tracker: [System Name] → [Target Platform]

<!--
  PURPOSE: Structured questions for the target SaaS platform vendor covering
  all items marked ⚠️ UNKNOWN in the reverse engineering report's SaaS fit
  assessment. Each question maps to a business rule or interface that could
  not be assessed with available information.

  HOW TO USE:
  1. Send this document to the vendor solution architect or pre-sales team
  2. Request written responses for each question
  3. Record responses in the "Vendor response" fields
  4. Update the reverse engineering report SaaS fit column based on responses:
     ⚠️ UNKNOWN → ✅ NATIVE / ⚙️ CONFIG / 🔧 CUSTOM / ❌ GAP
  5. Escalate ❌ GAP responses to the programme team immediately

  OWNER: [Programme team contact]
  SENT TO: [Vendor contact name / team]
  DATE SENT: 
  RESPONSE DEADLINE: 
  STATUS: Draft / Sent / Partially answered / Complete

  DO NOT INCLUDE in vendor copy:
  - Confidence ratings (★★★ / ★★☆ / ★☆☆) — internal
  - Code references or source file locations — internal
  - Internal risk register references — internal
  This template is designed to be sent as-is after removing this comment block.
-->

**Programme:** [Programme name, e.g. Card Issuing Platform Replacement]
**Legacy system:** [e.g. Fiserv, legacy COBOL authorisation module]
**Target platform:** [e.g. Episode Six, Temenos, Mambu]
**Prepared by:** [Name / team]
**Date:** [YYYY-MM-DD]

---

## How to respond

For each question below, please provide:

1. **Platform disposition** — one of:
   - ✅ NATIVE — the platform supports this through standard functionality, no customisation required
   - ⚙️ CONFIG — the platform supports this through configuration (describe the configuration mechanism)
   - 🔧 CUSTOM — the platform requires custom development or extension (describe scope and implications)
   - ❌ GAP — the platform cannot support this behaviour (describe the gap and any workaround options)

2. **Evidence / reference** — documentation reference, demo, or technical specification
   that confirms the response. We cannot rely on verbal assurance alone for items in
   this tracker — each response requires a verifiable basis.

3. **Caveats / conditions** — any edge cases, limitations, or version dependencies
   that affect the response.

4. **Estimated effort** (for ⚙️ CONFIG and 🔧 CUSTOM) — indicative days/weeks of
   configuration or development work required.

---

## Questions

---

### VQ-001: [Plain language title of the behaviour]

**Source rule:** BR-[xxx] — [brief rule description]

**Context:**
[1–2 sentences explaining what the legacy system does and why this matters
for the modernisation. Written for the vendor — no internal jargon.]

**Specific question:**
[The precise question the vendor needs to answer. Be specific about the behaviour,
not just the concept. If there is a threshold, name it. If there is an edge case,
describe it.]

**Why this matters for the programme:**
[What happens if this is a GAP — what would need to change in the programme plan,
what is the cost/impact of a custom implementation.]

**Vendor response:**

Disposition: [ ] ✅ NATIVE  [ ] ⚙️ CONFIG  [ ] 🔧 CUSTOM  [ ] ❌ GAP

Evidence / reference:

Caveats / conditions:

Estimated effort (if CONFIG or CUSTOM):

Responded by: | Date:

---

### VQ-002: [Next question]

**Source rule / interface:** [ID and description]

**Context:**

**Specific question:**

**Why this matters for the programme:**

**Vendor response:**

Disposition: [ ] ✅ NATIVE  [ ] ⚙️ CONFIG  [ ] 🔧 CUSTOM  [ ] ❌ GAP

Evidence / reference:

Caveats / conditions:

Estimated effort (if CONFIG or CUSTOM):

Responded by: | Date:

---

<!-- Add VQ-00n for each ⚠️ UNKNOWN item from the fit assessment -->

---

## Response summary

*Complete this table as vendor responses are received.*

| ID | Question | Disposition | Evidence received | Risk action required |
|----|----------|-------------|-------------------|---------------------|
| VQ-001 | | ⚠️ Pending | | |
| VQ-002 | | ⚠️ Pending | | |

**Total questions:** [n]
**Responses received:** [n]
**Items confirmed NATIVE or CONFIG:** [n]
**Items requiring CUSTOM development:** [n] — [total estimated effort]
**GAPs identified:** [n] — [escalation status]

---

## GAP escalation log

*Complete immediately when a GAP is confirmed.*

| ID | Gap description | Programme impact | Options considered | Decision | Decision date | Decision by |
|----|----------------|-----------------|-------------------|----------|---------------|-------------|
| VQ-00n | | HIGH / MED / LOW | | Accept gap / Custom build / Scope change / Alternative vendor | | |

---

## Tracker status

| Status | Date | Notes |
|--------|------|-------|
| Drafted | | |
| Sent to vendor | | |
| First responses received | | |
| All responses received | | |
| Fit assessment updated in report | | |
| GAPs escalated to programme team | | |
| Tracker closed | | |
