# Decisions — Session-Origin Badge

## Decision: Tri-state counts all completed stages, not only outer-loop stages

**Date:** 2026-09-08

**Context:** The badge's tri-state (fully session-backed / mixed / no session) is derived by comparing a feature's completed stages against which of them carry a real `sessionId`. This pipeline splits stages into an outer loop (discovery through definition-of-ready — currently the only stages a live chat session can produce) and an inner loop (branch-setup through definition-of-done — currently always CLI/agent-driven, never expected to have a session). Counting all stages means most fully-implemented features will show "mixed" or "no session" once inner-loop stages complete, since those stages never carry a `sessionId` in today's build.

**Decision:** Count every completed stage, outer-loop and inner-loop alike. Do not special-case inner-loop stages out of the calculation.

**Rationale:** A future managed-agent inner loop driven from the web UI is plausible, at which point inner-loop stages could carry real sessions too. Hard-coding an outer-loop-only calculation would bake today's CLI-driven inner loop in as a permanent assumption, requiring a follow-up change if that changes. Counting all stages keeps the indicator a direct, literal reflection of real session presence rather than an assumption about which stages are "supposed to" have one — accepting that most finished features will read as "mixed" today as a known, expected consequence, not a defect.
