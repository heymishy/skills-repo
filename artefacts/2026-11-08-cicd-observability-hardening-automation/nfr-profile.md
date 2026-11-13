# NFR Profile: CI/CD, Observability & Hardening Automation

**Feature:** 2026-11-08-cicd-observability-hardening-automation
**Created:** 2026-11-09
**Last updated:** 2026-11-13
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

---

## Additions 2026-11-13 (coha-s5, coha-s6, coha-s7; coha-s4 superseded)

Added after the production-error-source spike replaced the log scan with PostHog error capture, an alert-to-issue bridge and an incident record. The coha-s4 rows above (log-scan duration, Fly.io API token) no longer apply to a live story.

| Category | NFR | Requirement | Applies to story |
|----------|-----|-------------|-----------------|
| Privacy | No tenant or customer data, and no source code lines, leave the app in an error event | Allow-list scrubbing in the capture hook, fail-closed, tested with generated values on every run | coha-s5 |
| Privacy | Issue content is public | The target GitHub repo is public; coha-s6 (native PostHog destination, revised 2026-11-13) opens issues whose title and body carry the fixed error code, up to 5 `src/` or `node_modules/` frames with no source lines, and a PostHog link, which coha-s5's scrub guarantees; checked on a real issue (coha-s6 AC3, AC4) | coha-s6, coha-s7 |
| Isolation | Test and staging traffic cannot create production issues | `e2e-test-` identities send nothing; every event carries `environment`; the PostHog alert filters on `environment = production` (staging and production share one PostHog key, as stated by the operator on 2026-11-13); the negative is proved by a real staging event (coha-s6 AC5) | coha-s5, coha-s6 |
| Performance | Capture never slows or fails a request | A slow or unreachable PostHog adds at most 200 ms to a failing request and never crashes the process | coha-s5 |
| Reliability | One issue per error, never lost or duplicated | PostHog's "issue created" trigger fires once per error issue; unproven until the first real production error (coha-s6 AC6, production-observed); a failed delivery shows only in PostHog's destination logs | coha-s6 |
| Security | GitHub access scoped to one repo, no credential held by us | The PostHog GitHub App is installed on the single target repo; its permissions are broader than issue write (code, workflows, actions, pull requests, hooks) and cannot be narrowed, accepted as a RISK-ACCEPT on 2026-11-13 (decisions.md); the `master` ruleset blocks direct pushes, force pushes and deletion by the App; no token, secret or route is added to the app (coha-s6 AC1, AC7) | coha-s6 |
| Cost | Within PostHog's free allowance | 100,000 exceptions per month; one event per error is asserted | coha-s5 |

**Data classification (unchanged):** Internal. Raw error text may contain tenant data inside the running app; the stories require it to be removed before anything leaves the app.
