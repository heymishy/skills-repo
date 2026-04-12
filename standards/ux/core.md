---
title: User Experience Core Standards
discipline: ux
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# User Experience Core Standards

**Discipline:** ux
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These standards define the universal baselines for user experience design and delivery across all surfaces and domains. Domain and squad extensions may add requirements; they may not relax these baselines.

## Overview

UX standards govern the design, validation, and delivery of interfaces that humans interact with directly. These standards apply to any surface that presents information or accepts input from a non-technical end user.

## Outcomes

- Users can complete primary tasks without requiring external guidance or support intervention.
- Interfaces are accessible to users with varying abilities, so that assistive technology users receive equivalent functionality.
- Design decisions are traceable to validated user needs rather than internal assumptions.

## Requirements

- MUST validate key user journeys with representative users before a surface is released to production so that usability failures are identified before they affect the full user population
- MUST meet the accessibility conformance level declared in the project brief so that users relying on assistive technology can complete primary tasks without workarounds
- MUST record the user research evidence that informed each significant design decision so that reviewers can distinguish validated design choices from untested assumptions
- SHOULD apply a consistent interaction vocabulary across all surfaces so that users do not need to re-learn patterns when moving between areas of the product
- SHOULD produce a usability test report before each major release cycle so that regressions in task completion rates are detectable
- MAY defer full accessibility remediation for non-primary surfaces when a time-bounded RISK-ACCEPT entry is recorded and primary surfaces meet the declared conformance level

## Out of Scope for this standard

- Brand identity decisions — visual language and tone are governed by the product or brand standards layer
- Specific [FILL IN: design tooling] product — any tool that produces reviewable design artefacts satisfies this standard
- Back-end API design — that is governed by the software-engineering discipline standards
