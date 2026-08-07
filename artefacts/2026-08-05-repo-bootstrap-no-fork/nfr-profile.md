# NFR Profile: No-Fork Repo Bootstrap for the Inner (and Optionally Outer) Loop

**Feature:** 2026-08-05-repo-bootstrap-no-fork
**Created:** 2026-08-05
**Last updated:** 2026-08-05
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Init command total run time (fresh repo) | ≤ 30 seconds, excluding target repo's own `npm install` | Wall-clock timing in CI/manual test | rb-s1 |
| Registry + full skill set materialization overhead | ≤ 5 seconds added to rb-s1's baseline | Wall-clock timing | rb-s2 |
| Instruction-file generation + drift-check overhead | ≤ 2 seconds added | Wall-clock timing | rb-s3 |
| SaaS fetch-and-materialize (existing repo path) | ≤ 15 seconds under normal network conditions | Wall-clock timing, real network | rb-s4 |
| Outer-loop opt-in flag overhead | ≤ 3 seconds added | Wall-clock timing | rb-s5 |

**Source:** Story AC (each target above is drawn directly from the story's own NFR section, not a stakeholder SLA)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Secrets management | Credential used to authenticate to the SaaS API must never be written to a file, environment variable the agent can read, or committed artefact — supplied via secure prompt only | `product/constraints.md` #12 | rb-s4 |
| Secrets management | No credential, token, or secret written to any file the init command creates | Discovery Constraints section | rb-s1 |
| Transport security | SaaS fetch uses HTTPS only | rb-s4 AC/NFR | rb-s4 |
| Audit logging | SaaS-side export endpoint logs each fetch (who, which feature slug, when) | rb-s4 NFR | rb-s4 |
| Input validation | Not applicable at this feature's scope — no user-facing form or freeform input beyond CLI flags | — | — |

**Data classification:**
- [x] Internal — non-public but low sensitivity (pipeline-state and artefact content fetched from the SaaS is the user's own approved work product, not public data, but carries no PII/regulated content)
- [ ] Public — no PII, no sensitive data
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** `product/constraints.md` #11, #12 / Story NFR sections

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — no cross-border data handling introduced; the SaaS fetch (rb-s4) moves data from the SaaS's existing storage to the user's own local machine, with no new residency boundary crossed beyond what the SaaS already operates under.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | CLI tool, not a hosted service — no uptime SLA applies. The SaaS-side export endpoint (rb-s4) inherits the SaaS's existing availability posture; no new SLA is introduced by this feature. |

**Source:** Not defined — CLI tool

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

_Confirmed: `context.yml meta.regulated: false`, no compliance frameworks configured for this repo. No regulatory clause applies to this feature._

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Telemetry / measurement instrumentation | Metric 3 (fork/clone avoidance rate) has a known measurement gap — init-command usage isn't trackable without either a phone-home ping (a privacy decision explicitly out of scope for discovery) or self-reported signal | Hamish King | Before Metric 3 is first reported against real usage |
| SaaS export endpoint feasibility | rb-s4 depends on an endpoint that doesn't exist yet; if building it proves harder than scoped, rb-e2's stories may need re-scoping | Hamish King | Before rb-s4 moves past /definition-of-ready |

