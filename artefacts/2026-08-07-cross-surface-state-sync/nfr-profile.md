# NFR Profile: Cross-Surface State Sync Between pipeline-state.json and Web-UI Journeys

**Feature:** 2026-08-07-cross-surface-state-sync
**Created:** 2026-08-07
**Last updated:** 2026-08-07
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| CLI `gate-advance` sync delay | Bounded, small delay added to command completion — exact budget measured and reported at `/test-plan`, must not turn a sub-second command into a multi-second one | Timed test comparing `gate-advance` with and without a connected web-UI journey | css-s1 |
| Web-UI stage-completion additional latency | No more than 2x the latency already contributed by `das-s1`'s own artefact-commit write alone | Timed integration test comparing stage-completion latency with and without the pipeline-state.json write enabled | css-s2 |
| Conflict-detection overhead | Small, bounded overhead added to either side's normal advance path — no unbounded scan | Timed test on the conflict-detection code path | css-s3 |

**Source:** Story ACs (css-s1 AC1, css-s2 AC2, css-s3's NFR section) — no product-level SLO exists for this internal governance tooling, so targets are self-imposed and relative to already-accepted baselines (`das-s1`'s own overhead) rather than absolute numbers invented without measurement.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication for pipeline-state.json writes | MUST use the authenticated user's own GitHub OAuth token (`req.session.accessToken`) via the GitHub Contents API — never a service account or `GITHUB_TOKEN` | ADR-020 | css-s2 |
| No credential storage for retry | No token or credential is persisted for later background use; retry is bounded to the original authenticated request's lifetime only | Resolved design decision, Step 1.5 of `/definition` (2026-08-07); consistent with `product/constraints.md` #12's "credentials are structural" spirit | css-s2, css-s4 |
| Tenant scoping | Any read/write to the journey's Postgres record remains `tenant_id`-scoped | ADR-025 | css-s1, css-s2, css-s3 |
| Audit logging | Every sync attempt (success, mismatch, conflict, or reconciliation gap) is logged with feature slug and timestamp | Story ACs (css-s1 AC3, css-s2 AC3, css-s3 AC3, css-s4 AC2) | All 4 stories |

**Data classification:**
- [x] Internal — non-public but low sensitivity (feature slugs, gate names, and stage values; no PII, no payment data, no credentials in any logged record)

**Source:** ADR-020, ADR-025, `product/constraints.md` #12

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — this feature is solo-maintainer platform-governance tooling with no regulated data residency requirement (confirmed: `regulated: false`, `complianceProfile: standard` in `pipeline-state.json`).

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | — | This sync mechanism is best-effort by design (per discovery's own async/reconciliation MVP scope) — it deliberately does not commit to a synchronous availability guarantee for the web-UI→CLI direction. |

**Source:** Not defined — best-effort by design, not an omission.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required

**Source:** Not applicable — `regulated: false`, `complianceProfile: standard` confirmed at feature creation; no regulated constraints found in discovery's Constraints section (Step 4a of `/definition` was skipped for this reason).

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance | Exact latency budgets (css-s1, css-s2) are relative to `das-s1`'s own overhead, not absolute numbers — `das-s1`'s own overhead has not yet been measured in production since its PR is still blocked on the GitHub Actions platform outage as of 2026-08-07 | Hamish King | Before `/test-plan` for css-s1/css-s2 |

_All other NFR areas: no gaps identified at 2026-08-07._
