# Estimation norms — cross-feature actuals

| Date | Feature | Stories | Engagement | OL estimate | OL actual | Delta | IL (human) | Calendar days |
|------|---------|---------|-----------|------------|-----------|-------|------------|---------------|
| 2026-04-11 | 2026-04-09-skills-platform-phase1 | 8 | 50% | — | 18h | — | 1h | 2 |
| 2026-04-12 | 2026-04-11-skills-platform-phase2 | 13 | 25% | 30h | 0.47h | -29.53h | 1h | 0.93 |

```yaml estimation-norms
- date: "2026-04-11"
  feature: "2026-04-09-skills-platform-phase1"
  storyCount: 8
  engagementFraction: 0.50
  outerLoopEstimateH: null
  outerLoopActualH: 18
  outerLoopDeltaH: null
  innerLoopHumanH: 1
  agentAutonomousH: 14
  calendarDays: 2
  outerLoopSessions: 10
  focusHPerStory: 2.3
  source: "none"
  premiumRequestsForecast: null
  premiumRequestsActual: "~185 (173 Apr 9–10 + ~12 Apr 11 session 10; gauge 84.4% at close)"
  note: "Phase 1 baseline — no prior estimate; seeds normalisation table. Requests: 94 Sonnet (Apr 9) + 65 Sonnet + 14 Coding Agent (Apr 10) + ~12 Apr 11 session 10 (gauge-inferred; CSV pending). Pre-Phase-1 Apr 1 usage (68) excluded. Gauge 84.4% at session 10 close."
- date: "2026-04-12"
  feature: "2026-04-11-skills-platform-phase2"
  storyCount: 13
  engagementFraction: 0.25
  outerLoopEstimateH: 30
  outerLoopActualH: 0.47
  outerLoopDeltaH: -29.53
  innerLoopHumanH: 1
  agentAutonomousH: null
  calendarDays: 0.93
  outerLoopSessions: null
  focusHPerStory: 0.04
  source: "e2"
  note: "JSONL debug logs unavailable; used conservative fallback totalCalendarH = calendarDays × 2. Treat deltas as low-confidence until telemetry path is restored."
  premiumRequestsForecast: "~322"
  premiumRequestsActual: 68
```
