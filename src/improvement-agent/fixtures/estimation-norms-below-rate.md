# Estimation norms — below rate fixture (p3.11 test)
# 3 features but max underrun is 28% — should NOT trigger calibration

```yaml estimation-norms
- date: "2026-01-01"
  feature: "feature-p1"
  outerLoopEstimateH: 10
  outerLoopActualH: 12.8
- date: "2026-02-01"
  feature: "feature-p2"
  outerLoopEstimateH: 10
  outerLoopActualH: 12.5
- date: "2026-03-01"
  feature: "feature-p3"
  outerLoopEstimateH: 10
  outerLoopActualH: 12.6
```
