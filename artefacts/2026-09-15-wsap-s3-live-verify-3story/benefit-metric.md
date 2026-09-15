# Benefit Metric: wsap-s3 Live Verification — Multi-Story Commit Gating

**Status:** Active
**Date:** 2026-09-15
**Feature slug:** 2026-09-15-wsap-s3-live-verify-3story

---

## Metric Owner
Hamish King — Solo Operator

---

## Reviewers
Hamish King

---

## Tier 1: Product Metrics

### M1: Multi-Story Commit Batching
**What we're measuring:** Number of GitHub commits produced when advancing multiple stories (N≥2) through a single session advance operation.

**Baseline:** Pre-fix behaviour — N commits for N stories.

**Target:** 1 commit per batch of stories advanced together.

**Minimum validation signal:** ≤1 commit per advance batch (indicates gating is working).

**Feedback loop:** Measured via GitHub commit history inspection during the live verification session. Operator inspects commit log immediately after advancing all 3 stories. No automated measurement needed — verification is the goal, not ongoing tracking.

---

### M2: Per-Story Review Re-Run Suppression
**What we're measuring:** Number of review re-runs triggered during multi-story advancement through the pipeline.

**Baseline:** Pre-fix behaviour — N review re-runs (one per story).

**Target:** 0 spurious review re-runs during multi-story batch operations.

**Minimum validation signal:** No unexpected review re-run jobs fired in GitHub Actions logs during the advancement session.

**Feedback loop:** Measured via GitHub Actions job history and browser network tab observation during the session.

---

## Meta-Benefit
None — this is a verification feature, not a production learning vehicle.

---

## Notes
This is a throwaway feature created solely to verify wsap-s3's fixes before closing that story's DoD. Metrics are qualitative verification gates, not production outcome targets. Feature will be discarded after verification is complete.