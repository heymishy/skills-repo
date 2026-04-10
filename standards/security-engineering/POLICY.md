---
title: Security Engineering Policy Floor
discipline: security-engineering
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-10
---

# Security Engineering Policy Floor

**Discipline:** security-engineering
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-10

These floors are binary. A delivery either meets them or it does not. No domain or squad override may relax these floors.

## Floor Requirements

- MUST have no high or critical OWASP findings without an accepted RISK-ACCEPT entry at the point of merge
- MUST never commit secrets to source control
- MUST validate all external inputs before processing
