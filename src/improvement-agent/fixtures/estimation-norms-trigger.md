# Estimation norms — trigger fixture (p3.11 test)
# 3 features all >30% underrun — should trigger calibration proposal

| Date | Feature | OL estimate | OL actual |
|------|---------|-------------|-----------|
| 2026-01-01 | feature-p1 | 4h | 6h (50%) |
| 2026-02-01 | feature-p2 | 8h | 11h (37.5%) |
| 2026-03-01 | feature-p3 | 3h | 4.2h (40%) |

```yaml estimation-norms
- date: "2026-01-01"
  feature: "feature-p1"
  outerLoopEstimateH: 4
  outerLoopActualH: 6
- date: "2026-02-01"
  feature: "feature-p2"
  outerLoopEstimateH: 8
  outerLoopActualH: 11
- date: "2026-03-01"
  feature: "feature-p3"
  outerLoopEstimateH: 3
  outerLoopActualH: 4.2
```
