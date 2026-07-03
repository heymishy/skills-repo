## Benefit Metric: Admin Role System and Admin Panel

**Discovery reference:** artefacts/2026-07-03-admin-role-panel/discovery.md
**Date defined:** 2026-07-03
**Metric owner:** Hamish King — Platform operator
**Reviewers:** Hamish King — Platform operator

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a direct operational fix for a live production blocker. No tooling, process, or capability hypothesis is under test.

---

## Tier 1: Product Metrics (Operational Value)

### Metric 1: Admin credits-guard bypass operational

| Field | Value |
|-------|-------|
| **What we measure** | Whether the platform admin can complete skill session turns without receiving HTTP 402 (Payment Required) from the credits guard, regardless of credit balance |
| **Baseline** | 0% — every turn attempt currently returns HTTP 402 for the platform owner (balance = 0, no bypass exists) |
| **Target** | 100% of admin-role session turns succeed regardless of credit balance |
| **Minimum validation signal** | Platform admin completes a 3-turn skill session (e.g. 3 questions answered in /discovery) without any 402 response post-deploy |
| **Measurement method** | Post-deploy smoke test by platform operator; Pino audit logs (`credits_balance_check` events showing `result: 'allowed'` for admin sessions); automated CI test asserting `creditsGuard` calls `next()` when `req.session.role === 'admin'` |
| **Feedback loop** | If admin still receives 402 after deploy, the `user_roles` lookup or credits-guard bypass has a defect — roll back and investigate role loading in auth callback. Owner: Hamish King. Decision window: same deploy cycle. |

---

### Metric 2: Credits top-up time via browser UI

| Field | Value |
|-------|-------|
| **What we measure** | End-to-end time from admin navigating to `/admin/credits` to confirmed balance update visible in the browser — without any SQL or terminal access |
| **Baseline** | 5–10 minutes via `fly postgres connect` + manual SQL (`UPDATE credits SET balance = balance + N WHERE tenant_id = $1`) — requires terminal, Fly CLI, and database credentials |
| **Target** | Under 2 minutes end-to-end (page load → tenant selection → amount entry → form submit → balance confirmation rendered) |
| **Minimum validation signal** | Platform admin successfully tops up at least one tenant's credit balance via the `/admin/credits` UI without any SQL command |
| **Measurement method** | Manual smoke test on Fly.io timed by platform operator post-deploy; automated test asserting POST `/api/admin/credits/adjust` updates balance in DB and responds with redirect to updated credits page |
| **Feedback loop** | If top-up requires more than 2 minutes, investigate page load time, form UX, or redirect chain. If UI is non-functional, revert to SQL workaround and file a defect story. Owner: Hamish King. |

---

### Metric 3: Non-admin credits enforcement not regressed

| Field | Value |
|-------|-------|
| **What we measure** | Whether non-admin users (role = 'user') with a 0 credit balance are still blocked by the credits guard — HTTP 402 returned, turn not processed |
| **Baseline** | 100% — the credits guard currently blocks all users with balance ≤ 0 without exception |
| **Target** | 100% maintained — zero regression in enforcement for user-role sessions after the admin bypass is introduced |
| **Minimum validation signal** | Automated CI test passes on every build asserting credits guard returns HTTP 402 when `req.session.role === 'user'` and `balance = 0` |
| **Measurement method** | Automated CI test in the `npm test` chain; gate fails the build if this assertion does not pass |
| **Feedback loop** | If CI test fails, deployment is blocked — credits enforcement has regressed. The credits-guard bypass condition must be audited. No manual override allowed — build must be green before deploy. Owner: CI gate (automatic). |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Admin credits-guard bypass operational | arl-s1 (role loading into session — precondition); arl-s2 (credits guard bypass check) | Covered — two stories, both required for M1 to be measurable |
| M2 — Credits top-up time via browser UI | arl-s3 (admin credits page + POST adjust handler) | Covered — single story delivers the full measurement workflow |
| M3 — Non-admin enforcement not regressed | arl-s2 (regression test in CI that gates deployment) | Covered — CI gate makes this metric automatic on every build |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is /definition and /test-plan
- Sprint targets or velocity — these metrics are outcome-based, not output-based
