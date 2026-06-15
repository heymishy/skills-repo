# NFR Profile: Web Server Observability

**Feature:** 2026-06-15-web-observability
**Created:** 2026-06-16
**Last updated:** 2026-06-16
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Log emission latency | pino must not add >5ms to SSE stream open time | Measure SSE time-to-first-byte before and after pino integration in a local test session | obs-1 |

**Source:** Story AC (obs-1 NFR section)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Secrets in logs | No API keys, OAuth tokens, or session secrets may appear in any log line | Product constraint — secrets management | obs-1 |
| Log content at default level | Skill turn content (user inputs) must not be logged at `info` level by default | Product constraint — data minimisation | obs-1 |

**Data classification:**
- [x] Internal — session IDs, turn IDs, timing data, correlation IDs; no PII at default log level

**Source:** Discovery constraints section; product `constraints.md`

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

Log output is stdout only; no persistence, no cross-region transfer at MVP.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not applicable | — | — | Logging is additive; its absence does not affect server availability |

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| PII in log content | Skill turn content (user ideas, workshop topics) may contain personal information. Current MVP logs at `info` level without turn content. If content logging is added in future (e.g. `debug` level), a redaction review is needed before enabling in production. | Hamish King | Before any `debug`-level content logging is enabled |

_All other NFR areas: No gaps identified at 2026-06-16._
