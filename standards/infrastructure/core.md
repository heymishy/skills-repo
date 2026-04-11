---
title: Infrastructure Engineering Core Standards
discipline: infrastructure
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# Infrastructure Engineering Core Standards

**Discipline:** infrastructure
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These standards define the universal baselines for infrastructure engineering delivery across all surfaces and domains. Domain and squad extensions may add requirements; they may not relax these baselines.

## Overview

Infrastructure standards govern the design, provisioning, and lifecycle management of compute, network, and storage resources. These standards apply to any delivery that creates or modifies infrastructure components used by production systems.

## Outcomes

- Infrastructure configurations are reproducible from version-controlled source so that any environment can be rebuilt without manual intervention.
- Infrastructure changes are reviewed and tested before they affect production so that misconfigurations do not cause unplanned outages.
- Resource access is controlled and auditable so that unauthorised changes to production infrastructure are detectable.

## Requirements

- MUST define all production infrastructure in version-controlled configuration files before any resource is provisioned so that the desired state is reproducible and auditable
- MUST validate infrastructure configuration changes in a non-production environment before applying them to production so that misconfigurations are detected before they cause production impact
- MUST restrict write access to production infrastructure to approved automation and named human principals so that unauthorised modifications are prevented and all changes are auditable
- SHOULD apply the principle of least privilege to all infrastructure service identities so that a compromised identity cannot affect resources beyond its declared scope
- SHOULD tag all production resources with owner, environment, and cost-centre labels so that resource attribution and cost accountability are verifiable without manual inventory
- MAY provision short-lived environments for development or testing purposes without full change approval, provided those environments are isolated from production networks and data

## Out of Scope for this standard

- Application-level deployment configuration — that is governed by the devops discipline standard
- Physical data centre management
- Specific [FILL IN: infrastructure-as-code tooling] — any tool that produces version-controlled, reviewable infrastructure configuration satisfies this standard
