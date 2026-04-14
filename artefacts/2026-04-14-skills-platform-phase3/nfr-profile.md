# NFR Profile: Skills Platform — Phase 3: Governance Hardening, T3M1 Close, and Enterprise Scale

**Feature:** 2026-04-14-skills-platform-phase3
**Created:** 2026-04-14
**Last updated:** 2026-04-14
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| `check-trace-commit.js` execution time | Completes within 5 seconds on any standard CI runner | Measured in CI logs after implementation merge | p3.1a |
| Assurance gate total execution time | Gate completes within 30 seconds end-to-end on a standard GitHub Actions runner | Observed in CI logs after p3.1b merge | p3.1b |
| `validate-trace.ps1 --ci` execution time | Completes within 10 seconds on PowerShell 5.1+ | Measured on Windows CI runner after p3.5 merge | p3.5 |
| `getTraces()` query response | Returns results within 3 seconds for a registry with up to 500 trace entries | Verified in unit tests with fixture data of 500 entries | p3.7 |
| Compliance report generation | Completes within 5 minutes for a monthly period across up to 10 squads | Measured in CI logs after p3.13 merge | p3.13 |

**Source:** Story ACs and product quality baseline. No contractual SLOs apply — these are internal platform targets.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No hardcoded credentials | No PATs, webhook secrets, or OAuth tokens in any committed source file | MC-SEC-01 | p3.8 (channel adapters) |
| Webhook authentication | All incoming webhook payloads authenticated (HMAC or service token) before processing | MC-SEC-01, OWASP A07 | p3.8 |
| Tamper-evidence registry access | Delivery agents have no write access to the external tamper-evidence registry | MC-SEC-02 | p3.2b |
| Gate script download integrity | Gate scripts downloaded via HTTPS with SHA-256 checksum validation; mismatch aborts execution | MC-SEC-02 | p3.3 |
| CI identity separation | Aggregation CI job uses a separate, read-only scoped token — not the delivery pipeline token | ADR-009 | p3.7, p3.13 |
| No personal tokens in adapters | Channel adapters use service credentials (rotating secret or service account) only | MC-SEC-01 | p3.8 |

**Data classification:** Internal — cross-team traces and compliance reports contain delivery metadata (story slugs, pass rates, feature IDs). No customer data. No PII. No regulated data beyond the governance audit records produced by T3M1 compliance.

**Source:** MC-SEC-01, MC-SEC-02, ADR-009, OWASP A07.

---

## Data Residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Trace registry data | Repository-hosted (GitHub or equivalent) — no external data transfer outside the registered delivery organisation boundaries | Internal classification, no cross-border constraint | p3.7, p3.13 |
| Tamper-evidence registry | External to the delivery repo but within the same organisation's GitHub account — no public exposure | MC-SEC-02 | p3.2b |

No cross-jurisdiction data residency requirements apply to Phase 3 governance artefacts.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| `npm test` governance suite | 100% pass on master between story merges | Per-merge | Any failure after merge is an immediate fix item (MM3 metric) |
| Cross-team trace registry aggregation | ≤24-hour propagation from squad commit to platform registry | Per-aggregation-cycle | Daily scheduled trigger |
| Compliance report generation | Monthly cadence — report produced by 5th of each month for the prior month | Monthly | Automated; alerting on missed run recommended in Phase 4 |

**Source:** Story ACs and MM3 governance baseline. No uptime SLA applies to offline scripts.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| MODEL-RISK.md T3M1 | Q1–Q8 audit questions | All 8 questions must be answerable by an independent reviewer from the trace alone | p3.2a, p3.2b (prerequisites); external review (human gate) |
| Gate structural independence | CR2 obligation (discovery artefact §Gate structural independence) | Gate scripts must be in a separate repo; delivery agents must not have write access | p3.3 |
| ADR-006 approval-channel pattern | Adapter interface contract | New channel adapters must conform to the existing interface in `src/approval-channel/` | p3.8 |
| ADR-009 workflow permission separation | Separate trigger and permission scope for aggregation/audit CI | Aggregation and compliance report CI jobs must not share triggers or tokens with delivery pipeline CI | p3.7, p3.13 |

**Named sign-off required?** Yes — CR2 (gate structural independence) and T3M1 independent review both require human-gated confirmations:
- ASSUMPTION-01 (separate platform-infrastructure repository feasibility) must be confirmed at DoR for p3.3.
- ASSUMPTION-02 (tamper-evidence registry type: GitHub Artifact Attestation vs read-only repo) must be confirmed at DoR for p3.2b.
- T3M1 independent review is a human action by a named external reviewer — not a story AC.

---

## NFR AC Blocks

The following blocks are referenced from individual story ACs. Reproduced here for traceability.

**Gate execution time (p3.1b):**
```
Given a standard CI runner
When the assurance gate runs end-to-end
Then completedAt − startedAt > 50ms, confirming substantive checks ran
```

**Webhook authentication (p3.8):**
```
Given an incoming webhook payload from Teams or Jira
When the payload HMAC signature or service token is invalid or absent
Then the handler rejects the request with HTTP 401 and logs the rejection — no dorStatus write occurs
```

**Checksum validation (p3.3):**
```
Given the gate script is downloaded from the platform-infrastructure repo
When the SHA-256 checksum of the downloaded file does not match the pinned expected value
Then the CI job aborts immediately and exits non-zero — the gate script is not executed
```

---

## Gaps and Open Questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Tamper-evidence registry type (p3.2b) | ASSUMPTION-02 unresolved: GitHub Artifact Attestation vs read-only registry repo — security properties differ | Hamish | At DoR for p3.2b |
| Platform-infrastructure repo separation (p3.3) | ASSUMPTION-01 unresolved: separate repository feasibility not confirmed | Hamish | At DoR for p3.3 |
| Enterprise channel adapter end-to-end test | M4 measurement requires a real non-mock Teams or Jira adapter run; no live credentials in CI | Hamish | At DoD for p3.8 |
