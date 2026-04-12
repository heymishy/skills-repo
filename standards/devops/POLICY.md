---
title: DevOps Policy Floor
discipline: devops
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# DevOps Policy Floor

**Discipline:** devops
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These floors are binary. A delivery either meets them or it does not. No domain or squad override may relax these floors.

## Overview

These binary floors define the minimum delivery bar for DevOps work. No domain, squad, or surface variant may relax these requirements.

## Outcomes

- Production deployments are always traceable to a reviewed commit through an automated pipeline.
- Failing tests always block promotion to production.
- Production systems emit observable signals so that incidents are detectable without privileged host access.

## Requirements

- MUST automate the path from merged commit to production deployment through a pipeline that requires no manual file copy or ad-hoc host access so that all production artefacts are traceable to a reviewed commit
- MUST block any deployment pipeline on failing automated tests so that no known-broken build is promoted to production
- MUST emit structured logs and health metrics from all production services so that incidents are detectable and diagnosable from observability tooling without direct host access

## Out of Scope for this standard

- Infrastructure provisioning
- CI/CD platform selection
- Observability tooling selection
