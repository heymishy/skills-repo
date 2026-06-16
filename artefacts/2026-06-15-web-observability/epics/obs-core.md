## Epic: Engineers can diagnose web server SSE issues from structured logs alone

**Discovery reference:** artefacts/2026-06-15-web-observability/discovery.md
**Benefit-metric reference:** artefacts/2026-06-15-web-observability/benefit-metric.md
**Slicing strategy:** Vertical slice — the complete observability capability ships in one story; the MVP scope items are tightly coupled and cannot be independently demoed

## Goal

When this epic is complete, an engineer can grep a single `correlationId` to reconstruct the full lifecycle of any SSE turn — from request arrival through LLM call timing to stream close or error. Hung connections, slow models, and dropped clients are diagnosable in under 60 seconds from structured JSON log output, without adding debug code or restarting the server.

## Out of Scope

- Log aggregation platform setup (Datadog, Logtail, CloudWatch, etc.) — deferred until deployment target is confirmed
- PII redaction and masking rules — requires separate privacy review; not in this epic
- Alerting, dashboards, and SLA monitoring — follow-on work once baseline log data is established
- Browser / client-side logging — server-side only
- Audit logging for compliance — existing pipeline governance covers this separately

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Time to diagnose hung SSE connection | Not established (estimated 15+ min) | ≤60s from logs alone | SSE lifecycle events + correlationId make root cause visible without code changes |
| M2 — LLM call duration recorded per turn | 0% of turns | 100% of completing turns | `llm_duration_ms` field logged at LLM call completion in the SSE handler |
| M3 — Correlation trace completeness | 0% | 100% of SSE turns: open/call/close share correlationId | correlationId generated at request ingress and attached to all events for that turn |

## Stories in This Epic

- [ ] obs-1 — Add pino structured logging with turn correlation IDs and timing to the web server

## Human Oversight Level

**Oversight:** Low
**Rationale:** Pure server-side instrumentation. No customer-facing behaviour changes. No auth, session, or data handling changes. Additive only — no existing code paths removed.

## Complexity Rating

**Rating:** 2
**Reason:** pino integration is well-understood, but wiring the correlation ID through the async SSE stream handler requires careful placement to avoid changing observable behaviour or breaking existing tests.

## Scope Stability

**Stability:** Stable
