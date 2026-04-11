---
title: ML and AI Engineering Policy Floor
discipline: ml-ai
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# ML and AI Engineering Policy Floor

**Discipline:** ml-ai
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These floors are binary. A delivery either meets them or it does not. No domain or squad override may relax these floors.

## Overview

These binary floors define the minimum delivery bar for ML and AI engineering work. No domain, squad, or surface variant may relax these requirements.

## Outcomes

- Every production model has an evaluation record so that production behaviour is validated before deployment.
- Model decisions are traceable to model version and training data so that any production output can be audited.
- Production model performance is monitored so that degradation is detected before it affects users at scale.

## Requirements

- MUST evaluate every model against declared performance and fairness metrics on a held-out evaluation dataset before deployment to production so that production behaviour is validated against an objective baseline
- MUST record the training data version, model version, and evaluation results alongside each production deployment so that any production decision can be traced to the model and data that produced it
- MUST monitor model performance metrics in production and trigger a review when any metric breaches a declared threshold so that degradation is detected before it affects users at scale

## Out of Scope for this standard

- Specific model architectures or training methodologies
- ML platform or model registry tooling selection
- Safety frameworks for autonomous systems outside human supervision
