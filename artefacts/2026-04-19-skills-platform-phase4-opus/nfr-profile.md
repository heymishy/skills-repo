# NFR Profile: Skills Platform — Phase 4: Distribution, Structural Enforcement, and Non-Technical Access

**Feature:** 2026-04-19-skills-platform-phase4
**Created:** 2026-04-19
**Last updated:** 2026-04-19
**Status:** Draft

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Install command time | < 30 seconds on typical consumer repo | Manual timing during E2E validation | implement-zero-commit-install, validate-install-sync-e2e |
| Sync command time | < 30 seconds per sync cycle | Manual timing during E2E validation | implement-sync-command, validate-install-sync-e2e |
| Audit export time | < 10 seconds for a typical 5-10 story feature | Manual timing during E2E validation | implement-second-line-audit-export |
| Teams bot turn latency | < 5 seconds from operator answer to bot advance | Manual timing during test session | validate-teams-e2e-session |

**Source:** Story ACs and discovery constraints. No formal SLOs — baseline measurement only.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Secrets management | Audit export must strip credentials and tokens | MC-SEC-02 | implement-second-line-audit-export |
| Secrets management | Teams bot must not surface API keys or tokens in chat | MC-SEC-02 | implement-teams-bot-scaffold, implement-teams-dor-approval |
| Input validation | Hash verification on sync must reject tampered files | C5 (hash verification) | implement-lockfile-hash-verification |
| Audit logging | Enforcement mechanism must log verdicts for auditability | Spike B1/B2 scope | synthesise-enforcement-recommendation |

**Data classification:**
- [x] Internal — non-public but low sensitivity

No PII is processed. Pipeline artefacts contain project metadata, not personal data. Teams bot interactions may contain operator names but these are within the same organisation boundary.

**Source:** MC-SEC-02 from `.github/architecture-guardrails.md`

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|

Not applicable — all artefacts are stored in the consumer's own repository. No external data storage. Teams bot prototype operates within the consumer's Microsoft 365 tenant. ADR C11 (no persistent hosted runtime) ensures no external hosting dependency.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | N/A | N/A | All tooling is CLI-based and runs locally — no hosted service to measure uptime against |

**Source:** C11 (no persistent hosted runtime) — the platform does not host services, so traditional availability NFRs do not apply. If a consumer's local environment is down, the tooling is unavailable — this is by design.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|

**Named sign-off required?**
- [x] Not required

No Tier 3 compliance metrics apply. The 5 named constraints (C1, C4, C5, C7, C11) are platform design constraints, not regulatory obligations. No regulatory framework applies to this feature scope.

---

## NFR AC blocks

**Hash verification (C5):**
```
Given the skills package has been installed with a lockfile
When the sync command runs and detects a hash mismatch
Then the sync aborts with a clear error message naming the mismatched file(s) and does not overwrite the local copy
```

**Credential stripping (MC-SEC-02):**
```
Given a feature artefact chain contains references to file paths or environment variables
When the audit export is generated
Then internal file system paths are replaced with relative references and no credentials, tokens, or API keys appear in the output
```

**C7 fidelity (one question at a time):**
```
Given the Teams bot is presenting a pipeline step to the operator
When the bot renders a question
Then exactly one question is visible and the operator cannot advance to the next question without answering the current one
```

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance | Exact latency targets for Teams bot are estimates — actual targets depend on Spike D prototype findings | heymishy | Spike D close |
| Security | Teams bot authentication model (Entra ID vs token) deferred to Spike D — may introduce additional security NFRs | heymishy | Spike D close |

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-opus-4-6 |
| cost_tier | high |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/nfr-profile.md |
| run_timestamp | 2026-04-19T18:58:00Z |
