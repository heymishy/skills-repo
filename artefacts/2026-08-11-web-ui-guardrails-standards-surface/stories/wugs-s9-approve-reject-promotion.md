## Story: Admin approves or rejects a promotion request

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-3-promotion-approval.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui, security-engineering]

## User Story

As an **admin** (per this epic's own scope note — `decisions.md`, gating approval on the existing `admin` role rather than a new "tech lead"/"CoP expert" role for MVP),
I want **to see pending promotion requests and approve or reject each one**,
So that **propagating a product-level guardrail/standard to org level requires real, governed review — not a silent write**.

## Benefit Linkage

**Metric moved:** Product-to-org promotion-approval workflow usage
**How:** This story delivers the "resolved" half of the metric's full target (submitted AND resolved) — approval triggers the actual org-repo PR via `wugs-s6`'s reused write adapter.

## Architecture Constraints

- **Reuses `wugs-s6`'s branch+PR adapter** — approval calls the same adapter Epic 2 built, targeting the tenant's org repo (`tenant_org_repo`) with the request's `content_snapshot` — no second write mechanism.
- **Role gate:** only `admin` (per `decisions.md`'s SCOPE entry) can call the approve/reject endpoint — checked via the same effective-role mechanism (`isEffectivelyAdmin`) already used by `credits-guard.js` and other admin-gated routes in this codebase, not a new ad-hoc role check.
- **Atomic resolution (AC5):** resolution MUST use a single conditional `UPDATE` statement scoped by both `request_id` AND `status = 'pending'` — e.g. `UPDATE guardrail_promotion_requests SET status = $1, resolved_by = $2, resolved_at = NOW() WHERE request_id = $3 AND status = 'pending' RETURNING request_id`. If the query returns zero rows, the request was already resolved by a concurrent call — respond with "already resolved," do not proceed to invoke `wugs-s6`'s write adapter. A read-then-write ("check status, then separately update") pattern is explicitly disallowed — it has a real race window between the check and the write that this single-statement conditional update closes structurally.
- **`content_snapshot` is what gets promoted, not a fresh re-read** — consistent with `wugs-s8`'s design; an admin approves exactly what was requested.

## Dependencies

- **Upstream:** `wugs-s8` (creates the requests this story acts on), `wugs-s6` (the write adapter this story invokes on approval).
- **Downstream:** `wugs-s10` (audit-logs this story's approve/reject actions).

## Acceptance Criteria

**AC1:** Given a `pending` promotion request, When an admin approves it, Then `wugs-s6`'s adapter is invoked with the request's `content_snapshot` targeting the tenant's org repo, and the request's `status` is set to `approved` with the resulting PR number recorded.

**AC2:** Given a `pending` promotion request, When an admin rejects it, Then the request's `status` is set to `rejected` — no PR is created, no write to the org repo occurs.

**AC3:** Given a non-admin user (using the existing `isEffectivelyAdmin` check, matching `credits-guard.js`'s own pattern) attempts to approve or reject a request, When the request is made, Then it is rejected with 403 — the role gate is enforced server-side, not just hidden client-side.

**AC4:** Given a tenant has no designated org repo yet (`tenant_org_repo` has no row), When an admin tries to approve a request, Then the approval is blocked with a clear error directing them to designate an org repo first (reusing `wugs-s3`'s designation flow) — approval cannot silently fail or write to a nonexistent target.

**AC5:** Given two different admins attempt to resolve the same pending request concurrently, When both submit at nearly the same time, Then only the first resolves it (status transitions from `pending` exactly once) — the second gets a clear "already resolved" response, not a duplicate PR.

## Out of Scope

- **A UI for admins to leave review comments on a request** — approve/reject only for MVP; comments could happen on the resulting GitHub PR itself.
- **Bulk approve/reject of multiple requests at once** — one at a time for MVP.

## NFRs

- **Performance:** None specific beyond `wugs-s6`'s own accepted latency.
- **Security:** Server-side role enforcement (AC3) is a hard requirement — this is the epic's core governance mechanism, must be covered by a dedicated test, not implied.
- **Accessibility:** Approve/reject actions are real, keyboard-accessible buttons.
- **Audit:** Approval/rejection is audit-logged — covered fully by `wugs-s10`.

## Complexity Rating

**Rating:** 2 — role-gating plus the concurrency-safety requirement (AC5) are genuine complexity beyond a simple status update.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (High)
