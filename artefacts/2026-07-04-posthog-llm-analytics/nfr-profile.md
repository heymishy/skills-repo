# NFR Profile: PostHog LLM Analytics Instrumentation

**Feature:** 2026-07-04-posthog-llm-analytics
**Created:** 2026-07-04
**Last updated:** 2026-07-04
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| PostHog event emission must not block turn response | Fire-and-forget: PostHog HTTP call is async and errors are swallowed; the SSE stream or non-streaming response must complete regardless of PostHog availability | Test: verify that a PostHog HTTP timeout does not delay the turn response to the client | pla-s1, pla-s2 |
| `$ai_generation` event emission latency | < 5ms overhead per turn (the HTTPS call is queued, not awaited) | Measured via Pino log timestamps if needed; no SLO breach expected given fire-and-forget pattern | pla-s2 |

**Source:** Story NFR sections / Product constraints (zero added latency to request path)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No credentials in logs | `POSTHOG_KEY` must not appear in any Pino log output; PostHog API key is accessed via `process.env` only | CLAUDE.md: "No credentials, tokens, or personal data in committed artefacts" | pla-s1 |
| LLM content privacy | `$ai_input` and `$ai_output_choices` are gated behind `POSTHOG_PRIVACY_MODE=true`; when privacy mode is on, prompt and response content is never sent to PostHog | decisions.md Decision 1 | pla-s2 |
| No user PII in exception events | `captureException` properties must not include raw session data (e.g. `req.session`) — only `skillName`, `sessionId`, `journeyId`, `model`, `tenantId` are permitted | CLAUDE.md security guardrails | pla-s1 |

**Data classification:**
- [x] Internal — PostHog receives `login` (GitHub username), `tenantId` (GitHub org login), `role`, token counts, and cost. No payment data, no passwords, no access tokens. When privacy mode is OFF, prompt content (SKILL.md system prompts and operator answers) may be sent to PostHog's US servers. This is acceptable for an internal operator tool with no end-user PII in prompts.
- [ ] Public
- [ ] Confidential
- [ ] Restricted

**Source:** CLAUDE.md security guardrails / Discovery §Privacy Mode Rules

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| PostHog event data goes to US servers (`us.i.posthog.com`) | United States | Not a regulatory requirement — `meta.regulated: false` in context.yml | pla-s1, pla-s2 |

If EU data residency is required in future, the PostHog API host in `posthog-server.js` must change from `us.i.posthog.com` to `eu.i.posthog.com`. This is a one-line change — no story artefact required if it is configuration-only.

---

## Availability

No availability SLA defined for PostHog instrumentation. PostHog outages result in missing analytics data — not a service disruption. All PostHog calls are fire-and-forget; a PostHog outage has zero impact on skill session availability.

**Source:** Not defined — instrumentation is advisory, not operational.

---

## Compliance

No compliance framework applies. `meta.regulated: false` in context.yml. No named sign-off required.

**Named sign-off required?**
- [x] Not required
- [ ] Yes

---

## NFR AC blocks

These are already incorporated into the story ACs. No additional AC blocks needed.

---

## Gaps and open questions

No NFR gaps identified at 2026-07-04.
