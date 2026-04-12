---
title: Fintech Domain Policy Floor
domain: fintech
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# Fintech Domain Policy Floor

**Domain:** fintech
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These floors are binary. A delivery either meets them or it does not. No discipline or squad override may relax these floors. These requirements extend the applicable discipline floors — they do not replace them.

## Overview

These binary floors define the minimum delivery bar for work in the financial technology domain. They address the regulatory, data-integrity, and fraud-prevention obligations specific to financial services products.

## Outcomes

- Financial transactions are recorded with sufficient integrity that post-incident reconciliation is possible without data loss.
- Sensitive financial data is protected against unauthorised access so that customers are not exposed to fraud from system compromise.
- Regulatory reporting obligations are met so that the organisation can demonstrate compliance to financial regulators on demand.

## Requirements

- MUST record every financial transaction with an immutable, timestamped audit entry so that post-incident reconciliation can be performed without data loss
- MUST apply data-at-rest and data-in-transit encryption to all assets classified as sensitive financial data so that a storage or network compromise does not expose customer financial information in plaintext
- MUST produce regulatory reporting artefacts in the format required by the applicable financial regulator before each reporting deadline so that the organisation can demonstrate compliance on demand
- MUST perform fraud detection screening on all externally initiated financial transactions before they are applied to account balances so that fraudulent transactions are identified before causing financial loss

## Out of Scope for this standard

- Jurisdiction-specific regulatory interpretation beyond the declared applicable regulator
- Financial product design and pricing decisions
- Specific [FILL IN: fraud detection tooling] — any tool that produces verifiable screening records satisfies this standard
