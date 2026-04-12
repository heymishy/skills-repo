---
title: Data Engineering Policy Floor
discipline: data
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# Data Engineering Policy Floor

**Discipline:** data
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These floors are binary. A delivery either meets them or it does not. No domain or squad override may relax these floors.

## Overview

These binary floors define the minimum delivery bar for data engineering work. No domain, squad, or surface variant may relax these requirements.

## Outcomes

- Schema contracts are verifiable by any consumer without access to squad-internal tooling.
- Sensitive data assets are classified and access-controlled before any consumer reads them.
- Data lineage evidence is present and auditable for all production transformations.

## Requirements

- MUST declare a schema for every production dataset before it is consumed so that schema drift cannot cause undetected data corruption downstream
- MUST record data lineage for every transformation that modifies source data before writing to a target store so that the origin of any production value is traceable
- MUST classify all production datasets by sensitivity tier before first write so that access controls can be applied and independently verified

## Out of Scope for this standard

- Storage technology selection
- Data quality tooling choice
- Domain-specific retention periods
