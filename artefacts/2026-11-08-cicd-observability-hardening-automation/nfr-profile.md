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
| Privacy | Issue content is public | The target GitHub repo is public; the bridge writes only the fixed error code, first-seen time, environment, a PostHog link and a marker line (no message beyond the code, no stack) (coha-s6 AC1) | coha-s6, coha-s7 |
| Isolation | Test and staging traffic cannot create production issues | `e2e-test-` identities send nothing; every event carries `environment`; the PostHog alert filters on it and the bridge acts only on production, with a distinct log line when the environment is missing (coha-s6 AC4); staging and production share one PostHog project (confirmed 2026-11-13 by identical key digests) | coha-s5, coha-s6 |
| Performance | Capture never slows or fails a request | A slow or unreachable PostHog adds at most 200 ms to a failing request and never crashes the process | coha-s5 |
| Reliability | One issue per error, never lost or duplicated | Unique-key table with a claim window and a take-over rule; retry-safe on GitHub failure (coha-s6 AC2, AC5); a real first production error is checked after merge (AC9, production-observed) | coha-s6 |
| Security | Bridge authenticated and bounded; GitHub token limited to issues on one repo | Shared secret compared in constant time, 16 KB body limit, own verification because the route is exempt from the CSRF guard; the token can only read and write issues on the single target repo, held as a Fly secret with a recorded expiry; PostHog's own GitHub App is not used (permissions cannot be narrowed, decisions.md 2026-11-13) | coha-s6 |
| Cost | Within PostHog's free allowance | 100,000 exceptions per month; one event per error is asserted | coha-s5 |

**Data classification (unchanged):** Internal. Raw error text may contain tenant data inside the running app; the stories require it to be removed before anything leaves the app.

## Additions 2026-11-14 (coha-s7, after the pull-request delivery design and its test plan)

| Category | NFR | Requirement | Applies to story |
|----------|-----|-------------|-----------------|
| Security | Only a bridge-opened production error issue can create a record | Recognised only when the issue carries the `production-error` label at opening, its author equals the bridge account (exact match, an unset variable recognises nothing) and its body holds a whole-line `PostHog issue id: <lowercase uuid>` marker; title or body text alone never counts; tested by U6 to U12 | coha-s7 |
| Security | No untrusted issue text is executed, and nothing can be pushed to or merged into `master` | Issue text reaches the script as data from a file, never in a shell command or workflow expression; the pull request shows the code only in inline code; every push targets a validated `incident/posthog-` branch; no merge, approve or ready step; tested by U13, U18, W4, W5 | coha-s7 |
| Security | Least privilege and no outside code | The recognise job has contents read, issues read and pull-requests read only, the record job contents write and pull-requests write only; only `actions/checkout`; no credential in a tracked file (W2, W8, W12) | coha-s7 |
| Audit | Every attempt is visible in the run log without echoing issue text | One result line per attempt (opened, skipped with one of three reasons, declined with a reason, dry run) carrying a fixed reason and the issue number only (N1) | coha-s7 |
| Reliability | One record pull request per error, never lost, never duplicated | Idempotent on the PostHog id (a record on master, an existing branch or an open pull request skips); one concurrency group per issue number so a simultaneous error is never cancelled; a conflicted record is rebuilt by a hand start with the rebuild switch; a failed run leaves nothing half done (AC2, AC7, N2) | coha-s7 |
| Compliance | Audit records reach `main` only through the operator's merge | The record exists only on its pull request until the operator merges it with the admin bypass (decisions.md 2026-11-14); one-file workflow accepted as a RISK-ACCEPT against ADR-009 | coha-s7 |

**Data classification (coha-s7):** Internal. The record holds the fixed error code, first-seen time, environment and PostHog link already published in a public issue by coha-s6; no tenant data, message text or stack.
