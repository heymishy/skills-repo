# NFR Profile: CI/CD, Observability & Hardening Automation

**Feature:** 2026-11-08-cicd-observability-hardening-automation
**Created:** 2026-11-09
**Last updated:** 2026-11-09
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Outbound notification timeout | Bounded (e.g. 10s) — a calling CI job must never hang on a down webhook | Story AC / code review at DoR | coha-s1 |
| CI/CD notification latency added to pipeline | Not a hard target — notification steps must not meaningfully slow deploy; no numeric SLO set for MVP | Observed during test-plan execution | coha-s2 |
| Log-scan job duration | Must complete within the scheduled job's own timeout | CI job duration log | coha-s4 |

**Source:** Story AC / `product/constraints.md` #11 (no persistent process)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Credential storage | Teams webhook URL and Fly.io API token live only in GitHub Actions secrets, never in tracked files or agent environment | `product/constraints.md` #12 | coha-s1, coha-s4 |
| Credential exposure in logs/notifications | Neither credential is ever logged or included in a notification payload | `product/constraints.md` #12 | coha-s1, coha-s4 |
| Structural verifiability of dispatch | CI gate asserts the adapter was actually called, not just trusted by instruction | `product/constraints.md` #13 | coha-s1, coha-s2, coha-s3, coha-s4 |
| Named security risk reduction | The `dompurify` critical finding is confirmed resolved or re-confirmed at this story's DoR | Tier 3 metric, `decisions.md` RISK-ACCEPT (2026-11-08) | coha-s3 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (CI/CD status, dependency-finding metadata, log excerpts — no PII, no payment data)
- [ ] Public
- [ ] Confidential
- [ ] Restricted

**Source:** `product/constraints.md` #12, #13 / `.github/architecture-guardrails.md` Mandatory Constraints (Security)

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | `complianceProfile: standard`, `complianceFrameworks: []` for this feature | — |

**Source:** Not applicable

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | No uptime SLA applies — every mechanism in this epic is triggered/bounded, not a standing service with its own availability target. |

**Source:** Not defined

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None (framework-level) | — | — | — |

**Named sign-off required?**
- [ ] Not required
- [x] Yes — the Tier 3 metric (`dompurify` resolution) requires explicit DoR sign-off confirming the finding's current status before coha-s3 proceeds past /definition-of-ready, per benefit-metric.md.

---

## Gaps and open questions

No further NFR gaps identified at 2026-11-09, beyond the Tier 3 sign-off requirement already captured above.
