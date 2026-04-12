---
title: Data Engineering Core Standards
discipline: data
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# Data Engineering Core Standards

**Discipline:** data
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These standards define the universal baselines for data engineering delivery across all surfaces and domains. Domain and squad extensions may add requirements; they may not relax these baselines.

## Overview

Data engineering standards govern the authoring, transformation, storage, and lifecycle management of datasets used in production systems. These standards apply to all work that produces, modifies, or consumes structured or semi-structured data assets.

## Outcomes

- Consumers of datasets can verify schema contracts before integrating with a data asset.
- Data lineage can be traced end-to-end so that the origin of any production value is auditable.
- Data quality regressions are detected before reaching downstream consumers.
- Sensitive datasets are identifiable and protected by appropriate access controls.

## Requirements

- MUST declare a schema for every production dataset before it is consumed by any downstream process, so that schema drift cannot cause undetected data corruption in consuming systems
- MUST record data lineage for every transformation that modifies source data before writing to a target store, so that the origin of any value in a production dataset is traceable
- MUST classify all datasets by sensitivity tier at the point of creation so that access controls can be applied and verified independently of the data producer
- SHOULD automate data quality checks on dataset writes so that quality regressions are detected before data reaches downstream consumers
- SHOULD declare data retention and deletion obligations in a manifest at the point a dataset is first created so that compliance reviewers can verify lifecycle management without accessing the dataset directly
- MAY apply statistical sampling in data quality checks when full-dataset scans exceed agreed latency budgets, provided sampling coverage is declared and logged alongside each check run

## Out of Scope for this standard

- Physical storage technology selection — teams may choose any store that satisfies the schema and lineage requirements above
- Specific [FILL IN: data quality tooling] product configuration — any tool that produces verifiable quality check outputs satisfies this standard
- Domain-specific data retention periods — these are set at the domain policy layer
