# Discovery: Web Server Observability

**Status:** Approved
**Created:** 2026-06-15
**Approved by:** Hamish King — 2026-06-16
**Author:** Hamish King + Claude Sonnet 4.6

---

## Problem Statement

The web server has no structured logging. When something goes wrong — a hung SSE connection, a slow LLM API call, a session that never resolves — there is no server-side signal to diagnose it without inserting temporary debug code. The inc4 verification session surfaced this concretely: a turn stayed pending for 5+ minutes and there was no way to determine whether the LLM call was slow, the SSE stream was blocked, or the client had disconnected — without restarting the server with added `console.log` statements.

As the platform moves toward multi-tenancy and commercial use, this gap compounds: per-tenant request tracing becomes mandatory, and debugging in production without structured logs is not viable.

---

## Who It Affects

**Engineer / developer (primary)**
Runs and maintains the web server locally and in staging. When a turn hangs or returns an unexpected response, they currently have no server-side trace to consult — the only signal is what the browser displays.

**DevOps / SRE (future — at multi-tenant)**
Will need to correlate log events across concurrent sessions, identify slow LLM API calls, and set up alerting on error rates. Cannot do this without structured, machine-readable log output.

---

## Why Now

Three triggers converge:

1. **SSE streaming is production-grade** — inc4 added the canvas SSE pipeline. The system is now complex enough that unstructured debugging is no longer fast enough.
2. **A real gap was observed** — the inc4 verification session had a 5+ minute hang with no server-side diagnostic. This is a concrete, observed cost.
3. **Multi-tenant is on the roadmap** — retrofitting structured logging after multi-tenancy is expensive; adding it now costs one story, not a cross-cutting refactor.

---

## MVP Scope

- Add **pino** as a runtime dependency for structured JSON logging (replaces ad-hoc `console.log`)
- Add a **request correlation ID** to every SSE turn (`/skills/:name/sessions/:id/turns`) — generated at request ingress, attached to all log events for that turn
- Log **LLM API call timing**: time from adapter call to first chunk, and total stream duration
- Log **SSE stream lifecycle events**: session opened, chunk count at close, stream ended normally vs errored
- Log **error events** with stack trace and correlation ID at `error` level
- Existing `console.log` / `console.error` calls replaced or wrapped — no new unstructured log lines added

---

## Out of Scope

- **Log aggregation platform setup** (Datadog, Logtail, CloudWatch, etc.) — infra-layer decision; deferred until deployment target is confirmed
- **PII redaction / masking** — skill turn content may contain user-supplied text; a separate privacy review is needed before defining masking scope and rules
- **Metrics, alerting, and dashboards** — follow-on work once log output is established and an aggregation target is chosen
- **Audit logging** — existing pipeline governance (decision traces, hash verification) covers the audit trail; this story is operational observability only
- **Browser / client-side logging** — server logs only for this story

---

## Assumptions and Risks

- **[ASSUMPTION]** pino is an acceptable runtime dependency — no objection to adding a third-party logger. *Risk:* if the project has a constraint against npm runtime dependencies, a structured `console.log` wrapper would be the fallback.
- **[ASSUMPTION]** JSON-to-stdout is the correct output format until a log aggregation target is confirmed. *Risk:* if a specific aggregation target is already chosen, its input format may differ.
- **[ASSUMPTION]** No PII masking is required in the current skill turn content at MVP. *Risk:* if user inputs contain PII that must not appear in logs, this story's scope expands before it can ship to production.
- **Risk — noise vs signal:** Adding logs to every SSE chunk would produce very high volume. Logging chunk *counts* rather than chunk *content* is the intended approach; if debugging requires chunk content, a configurable `DEBUG` flag is the correct mechanism.

---

## Directional Success Indicators

**Diagnosability of hung connections:**
Baseline: Not diagnosable from server logs (no server-side log output for SSE turns).
Target: A hung SSE connection diagnosable within 60 seconds from server logs alone — without restarting the server or adding code.
Measured via: Manual verification during next inc verification session; structured log entry with `sessionId`, `turnId`, `correlationId`, `event: "sse_open"` / `event: "sse_timeout"` visible.

**LLM call timing visibility:**
Baseline: Duration not recorded anywhere (only visible if you measure wall clock time manually).
Target: Each turn's LLM API call duration visible as a log field (ms from adapter invocation to final chunk).
Measured via: Log output during a live /ideate session.

**Correlation trace completeness:**
Baseline: No way to tie log events from the same turn together.
Target: All events from a single turn (SSE open → LLM call → chunks → SSE close) share a `correlationId` field, making `grep correlationId=<id>` sufficient to reconstruct the full turn lifecycle.
Measured via: Log output inspection during a test session.

---

## Constraints

- Must work with the existing Node.js + Express stack (no framework swap)
- pino must be pinned to a specific version in `package.json` (platform lockfile convention)
- No log line may contain raw API keys, session tokens, or access tokens — these must be masked or omitted at the log call site
- Log output must not break existing test suite (tests currently capture stdout in some assertions; pino log lines must not collide)

---

## Attribution

**Contributors:**
- Hamish King — Product Lead — 2026-06-15

**Reviewers:**
- Pending

**Approved By:**
- Hamish King — Product Lead — 2026-06-16

---

**Next step:** Human review and approval → /benefit-metric

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] pino is an acceptable runtime dependency — no objection to adding a third-party logger.
- [ASSUMPTION] JSON-to-stdout is the correct output format until a log aggregation target is confirmed.
- [ASSUMPTION] No PII masking is required in the current skill turn content at MVP.

These assumptions must be confirmed or refuted before scope can be locked.
