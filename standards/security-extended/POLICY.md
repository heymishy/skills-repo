---
title: Security Engineering Extended Policy Floor
discipline: security-extended
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# Security Engineering Extended Policy Floor

**Discipline:** security-extended
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These floors are binary. A delivery either meets them or it does not. No domain or squad override may relax these floors.

## Overview

These binary floors define the minimum delivery bar for security-extended work. They apply in addition to the security-engineering policy floor. No domain, squad, or surface variant may relax these requirements.

## Outcomes

- Threat models exist for all services that handle sensitive data or expose external interfaces, so that attack surfaces are documented before production deployment.
- Dependencies are pinned to verified hashes so that a compromised upstream package cannot silently replace a vetted build artefact.

## Requirements

- MUST produce and store a threat model before any service that handles sensitive data or exposes an externally reachable interface is promoted to production so that attack surfaces are reviewed before the design is locked
- MUST pin all third-party dependencies to a verified hash or cryptographic signature before they are included in a production build so that compromised upstream packages cannot reach production undetected
- MUST record and review dependency provenance for every direct dependency added to a production system so that unvetted packages cannot reach the production environment unaudited

## Out of Scope for this standard

- Base security engineering floors (governed by security-engineering POLICY.md)
- Penetration testing scope and methodology
- Specific supply-chain tooling selection
