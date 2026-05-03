# Estimation norms — cross-feature actuals

| Date | Feature | Stories | Engagement | OL estimate | OL actual | Delta | IL (human) | Calendar days |
|------|---------|---------|-----------|------------|-----------|-------|------------|---------------|
| 2026-04-12 | 2026-04-09-skills-platform-phase1 | 8 | 28% | — | 11h7m | — | 1h | 2 |
| 2026-04-12 | 2026-04-11-skills-platform-phase2 | 13 | 25% | 30h | 1h | -29h | 1h | 2 |
| 2026-04-20 | 2026-04-19-skills-platform-phase4 | 24 | 25% | 0.75h (E2) | ~6h | +5.25h | 1h | 2 |

```yaml estimation-norms
- date: "2026-04-12"
  feature: "2026-04-09-skills-platform-phase1"
  storyCount: 8
  engagementFraction: 0.28
  totalSessionSpanH: 40
  outerLoopEstimateH: null
  outerLoopActualH: 11.1
  outerLoopDeltaH: null
  innerLoopHumanH: 1
  agentAutonomousH: 14
  calendarDays: 2
  outerLoopSessions: 11
  focusHPerStory: 1.4
  source: "none"
  derivedBy: "parse-session-timing.js --max-gap 15"
  thresholdSensitivity: "11h7m @15min | ~13h @20min | 17h8m @30min — old manual estimate (18h) aligns with @30min"
  premiumRequestsForecast: null
  premiumRequestsActual: "~185 (173 Apr 9–10 + ~12 Apr 11 session 10; gauge 84.4% at close)"
  note: "Phase 1 baseline — no prior estimate; seeds normalisation table. outerLoopActualH revised 2026-04-12 from 18h (manual 50% engagement) to 11.1h using parse-session-timing.js @15min canonical threshold; 11 sessions Apr 9–11 (40h span, 28% engagement). Requests: 94 Sonnet (Apr 9) + 65 Sonnet + 14 Coding Agent (Apr 10) + ~12 Apr 11 session 10 (gauge-inferred; CSV pending). Pre-Phase-1 Apr 1 usage (68) excluded. Gauge 84.4% at session 10 close."
- date: "2026-04-12"
  feature: "2026-04-11-skills-platform-phase2"
  storyCount: 13
  engagementFraction: 0.25
  outerLoopEstimateH: 30
  outerLoopActualH: 1
  outerLoopDeltaH: -29
  innerLoopHumanH: 1
  agentAutonomousH: null
  calendarDays: 2
  outerLoopSessions: null
  focusHPerStory: 0.08
  source: "e2"
  note: "JSONL debug logs unavailable; E3 rerun used manual Apr 11 to Apr 12 calendar override (2 days) plus estimate-skill fallback totalCalendarH = calendarDays × 2. Treat deltas as medium-low confidence until telemetry path is restored."
  premiumRequestsForecast: "~322"
  premiumRequestsActual: 68
- date: "2026-04-20"
  feature: "2026-04-19-skills-platform-phase4"
  storyCount: 24
  engagementFraction: 0.25
  totalSessionSpanH: 25
  outerLoopEstimateH: 0.75
  outerLoopActualH: 6.08
  outerLoopDeltaH: 5.33
  innerLoopHumanH: 1
  agentAutonomousH: null
  calendarDays: 2
  outerLoopSessions: 2
  focusHPerStory: 0.25
  source: "e2"
  derivedBy: "parse-session-timing.js --max-gap 15 (sessions 2026-04-19 to 2026-04-20)"
  e1estimate: 1.0
  e2estimate: 0.75
  complexityDistribution: "1:3, 2:12, 3:9 (heavy — 9 complexity-3 stories)"
  gaugeAtStart: "18.7% (536.1/1500 consumed)"
  premiumRequestsForecast: null
  premiumRequestsActual: null
  outerLoopCharacter: "genuinely-novel-decisions"
  note: "E2 severely underestimated (8x off). Two compounding causes: (1) Volume and complexity — 24 stories (9 at complexity-3) across discovery→benefit-metric→definition→review→test-plan→24×DoR requires substantial operator focus regardless of inner-loop autonomy. Key calibration: for complexity-heavy features (majority complexity-2/3), outer loop floor is ~0.25h/story. The complexity-weighted E2 formula needs a minimum floor: outerLoopFocusH = max(storyCount × 0.25, derivedEstimate). (2) Outer loop character — this run required genuine decision-making, not artefact validation. The 5-spike programme (E1) forced the operator to review feasibility options, weigh trade-offs, and in several cases query a second model for validation before committing to a mechanism. This is qualitatively different from the typical outer loop pattern (Phases 1–3) where the agent proposes artefacts and the operator validates/approves them. When the operator is the primary decision-maker — evaluating novel mechanisms, adjudicating spike verdicts, resolving architectural trade-offs — focus time per story is structurally higher regardless of story count. Calibration rule: features with ≥1 spike epic (E1-type) or novel surface mechanism should add +0.5h flat to E2 outer loop estimate to account for genuine decision time. E2 engagementFraction (0.5) also overestimated — parse-session-timing.js shows actual 15.2% across full session span (heavy agent wait time between spike runs). Inner loop human revised downward from E2 forecast 3h to actual 1h — dispatch and merge only."
```

---

## E3 actuals � 2026-05-02-web-ui-copilot-execution-layer (WUCE)

```yaml
featureSlug: "2026-05-02-web-ui-copilot-execution-layer"
featureTitle: "Web UI + Copilot Execution Layer"
date: "2026-05-03"
phase: "E3"
calendarDays: 1
wallClockH: 22.5
outerLoopFocusH: 5.6
engagementFraction: 0.25
storyCount: 17
focusHPerStory: 0.33
deliveryModel: "agent-wave (4 waves, VS Code subagent-execution)"
e1estimate: null
e2estimate: null
e1delta: null
e2delta: null
acCount: 88
acsAutomated: 82
acsManualVerification: 6
testMethod: "Playwright E2E (41 pass / 21 skip) + Node unit tests (75 pass in wuce.9-12)"
sessionId: "568d554a"
premiumRequestsForecast: null
premiumRequestsActual: null
outerLoopCharacter: "agent-heavy-wave-delivery"
note: "null-path � no E1/E2 recorded; seeds normalisation table only. 25% engagement fraction reflects highly agent-heavy delivery: 4 dispatch waves, full TDD inner loop per story, operator focus concentrated in Wave 1 (OAuth design) and DoD writing. 0.33h focus/story is a floor calibration point for agent-wave features. For comparison: Phase 4 (p4) was 0.89h focus/story for complexity-heavy genuinely-novel stories. WUCE was simpler ACs, well-understood surface patterns, agent did full TDD � hence 0.33 is plausible. Calibration rule proposed: agent-wave delivery with pre-existing surface patterns ? 0.3-0.4h/story outer loop. Novel surface with operator design decisions ? 0.7-1.0h/story."
```
