# Benefit Metric: Web Server Observability

**Discovery reference:** artefacts/2026-06-15-web-observability/discovery.md
**Date defined:** 2026-06-16
**Metric owner:** Hamish King — Product Lead
**Reviewers:** Hamish King — Product Lead

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is engineering infrastructure — operational observability for the web server. All three metrics measure operational outcomes (diagnosability, visibility, traceability), not a hypothesis about a tool or approach.

---

## Tier 1: Product Metrics (Operational Value)

### M1: Time to diagnose a hung SSE connection

| Field | Value |
|-------|-------|
| **What we measure** | Time from a developer observing a hung client turn to identifying the server-side root cause (LLM-side slow / network drop / session error), using server logs alone with no code changes |
| **Baseline** | Not yet established. Currently requires inserting `console.log` statements and restarting the server — estimated 15+ minutes per incident from the inc4 verification session observation |
| **Target** | ≤60 seconds to root-cause identification from structured logs alone |
| **Minimum validation signal** | Engineer can distinguish LLM-side hang from network/client disconnect from a single log query — even if total time exceeds 60s |
| **Measurement method** | Engineer observation during the next 3 verification sessions post-implementation; confirmed when a hung or slow connection is diagnosed via logs without restarting |
| **Feedback loop** | If the minimum signal is not met after 2 sessions, the log event schema needs revision — add more lifecycle events before advancing to multi-tenant use |

---

### M2: LLM call duration recorded per turn

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of SSE turns that have an `llm_duration_ms` field (or equivalent) in structured log output — time from adapter invocation to final chunk received |
| **Baseline** | 0% — no call timing is currently recorded anywhere |
| **Target** | 100% of turns where the LLM call completes (including errors) have duration recorded |
| **Minimum validation signal** | ≥80% of turns have duration recorded (allows for edge-case error paths that exit before the log point) |
| **Measurement method** | Log inspection after 5 live /ideate sessions; count turns with and without `llm_duration_ms` field |
| **Feedback loop** | If coverage is below 80%, instrument the remaining error paths before marking the story done |

---

### M3: Correlation trace completeness

| Field | Value |
|-------|-------|
| **What we measure** | Whether all log events for a single SSE turn share a `correlationId` field — making `grep correlationId=<id>` sufficient to reconstruct the full turn lifecycle (SSE open → LLM call → chunks → close/error) |
| **Baseline** | 0% — no correlation IDs exist; no way to tie log events from the same turn together |
| **Target** | 100% of SSE turns: SSE open, LLM call start, LLM call end, and SSE close/error events all carry the same `correlationId` |
| **Minimum validation signal** | At minimum, SSE open + LLM call + SSE close events share a `correlationId` (3-point trace sufficient for hung connection diagnosis) |
| **Measurement method** | Log inspection after implementation: run one full /ideate session, pick any turn's `correlationId`, verify all expected events are returned by a grep/filter on that ID |
| **Feedback loop** | If any of the 3 minimum events is missing the `correlationId`, the instrumentation is incomplete — block story sign-off until resolved |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Hung connection diagnosability | obs-1 (SSE lifecycle events + correlationId) | Covered |
| M2 — LLM call duration per turn | obs-1 (llm_duration_ms field on LLM completion) | Covered |
| M3 — Correlation trace completeness | obs-1 (correlationId at request ingress, all events) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Log aggregation platform or tooling choice — deferred until deployment target confirmed
- PII redaction rules — separate concern, flagged in discovery assumptions
- Alerting thresholds or SLAs — follow-on work once baseline data is established
