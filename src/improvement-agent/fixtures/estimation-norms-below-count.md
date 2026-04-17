# Estimation norms — below count fixture (p3.11 test)
# Only 2 features >30% underrun — should NOT trigger calibration

```yaml estimation-norms
- date: "2026-01-01"
  feature: "feature-p1"
  outerLoopEstimateH: 4
  outerLoopActualH: 6
- date: "2026-02-01"
  feature: "feature-p2"
  outerLoopEstimateH: 8
  outerLoopActualH: 11
```
