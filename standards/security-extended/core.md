---
title: Security Engineering Extended Core Standards
discipline: security-extended
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# Security Engineering Extended Core Standards

**Discipline:** security-extended
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These standards extend the core security-engineering discipline with requirements for advanced threat modelling, supply chain security, and runtime monitoring. They apply to systems that handle sensitive data at scale or operate in adversarial environments. Domain and squad extensions may add requirements; they may not relax these baselines.

## Overview

Security-extended standards govern delivery teams that need threat modelling, dependency supply-chain integrity, and runtime anomaly detection beyond the core security-engineering floor. These standards apply in addition to, not instead of, the security-engineering discipline standards.

## Outcomes

- Threat models are produced and reviewed before significant architectural decisions are finalised so that attack surfaces are identified while design changes are still inexpensive.
- Third-party dependencies are verified for supply-chain integrity before they are promoted to production so that compromised packages cannot execute malicious code undetected.
- Runtime anomaly detection is in place so that active attacks are surfaced within agreed response windows.

## Requirements

- MUST produce a threat model for any service that handles sensitive data or exposes an externally reachable interface before that service is promoted to production, so that attack surfaces are documented and reviewed before the design is locked
- MUST pin all third-party dependencies to a verified hash or signature before they are included in a production build so that a compromised upstream package cannot silently replace a verified dependency
- MUST record and review dependency provenance for any direct dependency added to a production system so that unvetted transitive packages cannot reach the production environment undetected
- SHOULD establish runtime anomaly alerts on authentication, authorisation, and data-access paths so that active attacks surface within agreed response windows
- SHOULD rotate all long-lived credentials on a schedule defined in the service runbook so that the blast radius of a compromised credential is bounded by the rotation window
- MAY defer threat model updates for low-risk, internal-only services when a RISK-ACCEPT entry documents the rationale and a review date

## Out of Scope for this standard

- Base security engineering requirements — those are governed by the security-engineering discipline standard
- Penetration testing scope and methodology — defined at the domain or programme level
- Specific [FILL IN: supply-chain security tooling] — any tool that produces verifiable hash or signature attestations satisfies this standard
