## Benefit Metric: CI/CD, Observability & Hardening Automation

**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Date defined:** 2026-11-08
**Metric owner:** Hamish King (Platform Owner)
**Reviewers:** [Pending — at least one non-engineering reviewer is required for Tier 1 product metrics by this skill's own completion check; no such role exists in this personal-scope team.]

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This initiative delivers direct capability (notification adapter, CI/CD alerts, vulnerability detection, bounded log-scan) rather than testing a tooling/process hypothesis. No meta-metrics apply.

**Tier 3 applies.** The vulnerability-check story (story 3) exists specifically to reduce a named security risk — the real, currently-unaddressed critical `dompurify` finding, logged as a `RISK-ACCEPT` in this feature's `decisions.md` on 2026-11-08. One Tier 3 metric is defined below, tied directly to that decision's revisit trigger.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: CI/CD chain notification coverage

| Field | Value |
|-------|-------|
| **What we measure** | The percentage of merges to master that trigger a notification at each defined transition (patch-announce, build/test/deploy status, auto-retry visibility). |
| **Baseline** | 0% — confirmed today: no patch/build/test/deploy event generates a chat notification. |
| **Target** | 100% of merges trigger a notification at each defined transition. |
| **Minimum validation signal** | ≥90%. Below this indicates an adapter dispatch-reliability problem, not normal variance. |
| **Measurement method** | Comparing CI run count against adapter dispatch-call count, weekly for the first month post-ship, then monthly. |
| **Feedback loop** | If the minimum signal isn't met, investigate adapter dispatch failures (e.g. webhook errors, rate limits) before re-measuring — the fix is in the adapter, not the notification logic. |

### Metric 2: Manual CI toil reduction for known-flaky patterns

| Field | Value |
|-------|-------|
| **What we measure** | Count of manual `gh run rerun --failed` interventions per month for already-known-flaky patterns (e.g. the `actr-s1/s2/s3` cancellation pattern). |
| **Baseline** | 3 confirmed manual interventions in this session alone for the `actr-s1/s2/s3` pattern, logged in `capture-log.md`. |
| **Target** | Near-zero (0–1) manual reruns per month for already-known-flaky patterns, since auto-retry visibility means a human doesn't need to manually verify whether a retry already happened. |
| **Minimum validation signal** | ≥50% reduction from the baseline rate within month 1 — a directional improvement bar below the full target. |
| **Measurement method** | Count of manual `gh run rerun` invocations per month, before vs. after, cross-referenced against which were for already-known-flaky patterns vs. genuinely novel failures. |
| **Feedback loop** | If the minimum signal isn't met, check whether auto-retry visibility is actually reducing *uncertainty* (the real goal) rather than the raw retry count, which may be driven by unrelated flakiness. |

### Metric 3: Vulnerability-finding visibility

| Field | Value |
|-------|-------|
| **What we measure** | Whether every CI run includes the audit step, and whether each new high/critical finding generates exactly one notification, not a flood of repeats. |
| **Baseline** | 0% — confirmed today: no Dependabot config, no `npm audit` step anywhere in CI. |
| **Target** | 100% of CI runs include the audit step; 100% de-duplication rate (no repeat notification for an already-known, unresolved finding). |
| **Minimum validation signal** | CI-step presence must be 100% from day one (it's a CI config, not a gradual rollout); de-duplication rate ≥90%. |
| **Measurement method** | A CI step-presence check (continuous, every run) plus a de-duplication check on the notification log (monthly rollup). |
| **Feedback loop** | If the de-dup rate falls below the minimum signal, the de-dup logic itself needs fixing before this metric can be trusted at all. |

### Metric 4: Production-defect detection latency

| Field | Value |
|-------|-------|
| **What we measure** | Time between a defect appearing in Fly.io logs and the bounded scan surfacing it. |
| **Baseline** | Not yet established. Today, defects are found only by accident (e.g. the still-unfixed `tenant_admin_bootstrap_failed` bug), with no systematic detection to measure against. |
| **Target** | A real first measurement of detection latency, established once the log-scan has run for a month — this metric's purpose is to get a real number for the first time, not to hit a specific target yet. |
| **Minimum validation signal** | The measurement is actually obtained at least once within month 1 — a known-bad latency is still a win over no measurement at all. |
| **Measurement method** | Once the log-scan has run for a month, compute the gap between confirmed defect timestamps (via log inspection) and scan-detection timestamps. |
| **Feedback loop** | Once a real baseline exists, set a specific target latency in a future benefit-metric revision — premature to target a number now. |

---

## Tier 3: Compliance and Risk-Reduction Metrics

### Tier 3 Metric: `dompurify` critical finding resolution

| Field | Value |
|-------|-------|
| **Obligation source** | `npm audit --audit-level=high` finding (critical, `dompurify`, `fixAvailable: true`), logged as a `RISK-ACCEPT` in `artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md` (2026-11-08). |
| **Metric** | The `dompurify` finding is resolved (dependency upgraded) or the `RISK-ACCEPT` is re-confirmed with fresh rationale. |
| **Target** | Binary — resolved or re-confirmed by the date story 3 (the vulnerability-check CI step) ships, matching the `RISK-ACCEPT`'s own revisit trigger. |
| **Validated by** | [Pending — no named security/compliance owner exists in this personal-scope team.] |
| **Sign-off required at DoR** | Yes — story 3's DoR should confirm this finding's status before sign-off, not defer it silently again. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| CI/CD chain notification coverage | [Populated at /definition] | Gap — stories not yet written |
| Manual CI toil reduction for known-flaky patterns | [Populated at /definition] | Gap — stories not yet written |
| Vulnerability-finding visibility | [Populated at /definition] | Gap — stories not yet written |
| Production-defect detection latency | [Populated at /definition] | Gap — stories not yet written |
| `dompurify` critical finding resolution (Tier 3) | [Populated at /definition] | Gap — stories not yet written |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
