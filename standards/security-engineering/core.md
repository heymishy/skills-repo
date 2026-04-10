---
title: Security Engineering Core Standards
discipline: security-engineering
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-10
---

# Security Engineering Core Standards

**Discipline:** security-engineering
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-10

These standards define the universal baselines for security engineering across all surfaces and domains. Domain and squad extensions may add requirements; they may not relax these baselines.

## Requirements

- MUST have no OWASP high or critical severity findings without an accepted RISK-ACCEPT entry at the point of merge
- MUST never commit secrets to source control
- MUST validate and sanitise all external inputs at the point of entry before processing
- MUST authenticate and authorise every request to a protected resource using an approved pattern
- SHOULD apply the principle of least privilege to all service identities and human access grants
- MAY defer remediation of low-severity findings when a time-bounded RISK-ACCEPT entry is recorded
