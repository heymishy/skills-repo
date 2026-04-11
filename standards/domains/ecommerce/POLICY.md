---
title: Ecommerce Domain Policy Floor
domain: ecommerce
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# Ecommerce Domain Policy Floor

**Domain:** ecommerce
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These floors are binary. A delivery either meets them or it does not. No discipline or squad override may relax these floors. These requirements extend the applicable discipline floors — they do not replace them.

## Overview

These binary floors define the minimum delivery bar for work in the e-commerce domain. They address transaction integrity, availability, and consumer-protection obligations specific to commercial transaction platforms.

## Outcomes

- Customer transactions are processed with sufficient integrity that orders are not lost or duplicated due to system failures.
- Checkout and payment paths meet declared availability targets so that revenue loss from platform downtime is bounded and measurable.
- Customer order and payment data is protected so that a system compromise does not expose consumer financial information.

## Requirements

- MUST implement idempotent order and payment processing so that customer transactions are not duplicated or silently dropped when retried after a partial failure
- MUST apply data-at-rest and data-in-transit encryption to all assets classified as payment or order data so that a storage or network compromise does not expose consumer financial information in plaintext
- MUST measure and report checkout path availability against a declared availability target so that revenue impact from platform downtime is quantified and visible
- MUST display the total transaction cost including all fees before a customer confirms payment so that consumers have accurate information at the point of purchase

## Out of Scope for this standard

- Product catalogue and pricing strategy
- Fulfilment and logistics process design
- Specific [FILL IN: payment processing integration] — any integration that produces auditable transaction records satisfies this standard
