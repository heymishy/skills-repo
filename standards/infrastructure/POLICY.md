---
title: Infrastructure Engineering Policy Floor
discipline: infrastructure
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# Infrastructure Engineering Policy Floor

**Discipline:** infrastructure
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These floors are binary. A delivery either meets them or it does not. No domain or squad override may relax these floors.

## Overview

These binary floors define the minimum delivery bar for infrastructure engineering work. No domain, squad, or surface variant may relax these requirements.

## Outcomes

- All production infrastructure has a version-controlled configuration so that any environment is reproducible without manual steps.
- Changes to production infrastructure are validated before applying so that misconfigurations do not reach production undetected.
- Production infrastructure write access is restricted so that all changes are auditable and unauthorised modifications are prevented.

## Requirements

- MUST define all production infrastructure in version-controlled configuration files before any production resource is provisioned so that the desired state is reproducible and auditable
- MUST validate infrastructure configuration changes in a non-production environment before applying to production so that misconfigurations are detected before causing production impact
- MUST restrict write access to production infrastructure to approved automation and named human principals so that all production changes are auditable

## Out of Scope for this standard

- Application-level deployment configuration
- Physical data centre management
- Infrastructure-as-code tooling selection
