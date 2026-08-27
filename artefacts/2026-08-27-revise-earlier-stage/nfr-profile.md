# NFR Profile: Revise an Earlier Stage Mid-Journey

**Feature:** 2026-08-27-revise-earlier-stage
**Created:** 2026-08-27
**Last updated:** 2026-08-27
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No extra session-creation round-trip on reopen | Reopening a stage with an existing live session creates zero new sessions | Automated test (no-churn assertion, matching `adsr-s1` precedent) | res-s1 |
| Materiality judgment latency | Adds at most one additional model turn to the existing chat response — no separate blocking API call | Automated test | res-s3 |

**Source:** Story AC — no stakeholder-specified SLO; baseline measurement only beyond the two targets above.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authorisation | Reuses existing `getGetHtmlSession()` read-only lookup — no new input surface | Precedent: `kcrs-s1`/`adsr-s1` | res-s1 |
| Path traversal guard | Resolved artefact write path must be validated (`path.resolve` + `startsWith(repoRoot)`) before writing | CLAUDE.md "Path traversal guard for disk writes"; precedent `ougl` (ADR path-traversal guard) | res-s2 |
| Audit logging | Stage reopen, artefact overwrite, materiality suggestion, and flag set/cleared are each logged with journeyId, stage name, and timestamp | Story ACs | res-s1, res-s2, res-s3, res-s4 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (pipeline artefact content; no customer PII, no payment data)

**Source:** `.github/standards/web-ui/web-ui-patterns.md` / CLAUDE.md coding standards

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — discovery Constraints section: "None identified." No regulated data or residency requirement in scope.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | — | Matches existing platform-wide posture — no new SLA introduced by this feature |
| RTO / RPO | Not defined | — | No new persistence mechanism introduced (artefacts already persisted to disk today) |

**Source:** Not defined — consistent with the rest of this repository's features.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required

Discovery Constraints section records "None identified" — no regulated constraint exists for this feature, so Step 4a (Regulated constraint propagation check) was skipped during `/definition`.

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance | No formal SLO for the materiality-judgment model call beyond "one additional turn" — if it proves slow in practice, a numeric target may be needed | Hamish King — Platform Owner | Revisit after first real usage (per benefit-metric M1/M2 measurement cadence) |

No further NFR gaps identified at 2026-08-27.
