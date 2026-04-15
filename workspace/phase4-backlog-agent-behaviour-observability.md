# Agent Behaviour Observability

**Status:** NOT STARTED — Phase 4

## Problem Statement

The platform currently has no mechanism for observing or auditing what actions a coding agent took during a session — which tools it called, which files it modified, and whether its actions were consistent with the implementation plan. This gap was identified in the Phase 2 adversarial audit and carried forward as a known governance hole. Without observability, it is not possible to detect agent scope drift, unplanned file changes, or deviations from the agreed implementation plan after the fact.

## Candidates

Three candidate approaches are documented in `docs/agent-behaviour-observability.md`. No approach has been selected. Approach selection, design, and implementation are Phase 4 decisions.

## Reference

docs/agent-behaviour-observability.md
