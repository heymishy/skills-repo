---
title: ML and AI Engineering Core Standards
discipline: ml-ai
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# ML and AI Engineering Core Standards

**Discipline:** ml-ai
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These standards define the universal baselines for machine learning and AI engineering delivery across all surfaces and domains. Domain and squad extensions may add requirements; they may not relax these baselines.

## Overview

ML and AI engineering standards govern the training, evaluation, deployment, and monitoring of models and automated decision systems. These standards apply to any delivery that introduces or modifies a model used to inform or automate decisions in a production system.

## Outcomes

- Models are evaluated against declared performance and fairness criteria before deployment so that production behaviour is predictable and auditable.
- Model decisions are traceable so that the inputs and version of the model that produced a given output can be identified after the fact.
- Model performance is monitored in production so that degradation is detected before it affects users at scale.

## Requirements

- MUST evaluate every model against declared performance and fairness metrics on a held-out evaluation dataset before it is deployed to production so that production behaviour is validated against an objective baseline
- MUST record the training data version, model version, and evaluation results alongside each production deployment so that any production decision can be traced to the model and data that produced it
- MUST monitor model performance metrics in production and trigger a review when any metric breaches a declared threshold so that degradation is detected before it affects users at scale
- SHOULD document the intended use, known limitations, and out-of-scope applications of each model before deployment so that consumers can make informed decisions about where the model output is appropriate
- SHOULD establish a data drift detection mechanism so that changes in the distribution of production inputs are detected before model performance degrades
- MAY use shadow deployment to evaluate a new model version against live traffic before switching production traffic, provided shadow results are reviewed before the switch

## Out of Scope for this standard

- Specific model architectures or training methodologies — these are implementation choices that do not affect the compliance standard
- Specific [FILL IN: ML platform or model registry tooling] — any tool that produces auditable version records and evaluation reports satisfies this standard
- Safety frameworks for autonomous systems operating outside human supervision — those require domain-specific standards beyond this baseline
