# Definition of Done: Cross-tenant isolation journey spec

**PR:** https://github.com/heymishy/skills-repo/pull/459 | **Merged:** 2026-07-12
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.4-cross-tenant-isolation-journey.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.4-cross-tenant-isolation-journey-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.4-cross-tenant-isolation-journey-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Tenant A reading a tenant B journey/product/standard by ID returns 404, not 403, per the FORBIDDEN-vs-NOT_FOUND policy | automated test (14/14 pass) | None |
| AC2 | ✅ | List endpoints (journeys, products) filtered — zero tenant B resources in tenant A's aggregate views | automated test | None |
| AC3 | ✅ | Tenant A write/mutation against a tenant B resource rejected, no tenant B data modified | automated test | None |
| AC4 | ✅ | 20x `--repeat-each` CI gate configured; a real repeat run found and fixed a genuine rate-limiter collision (see Scope Deviations) — post-fix, 40/40 passing across the repeat run | E2E spec (`@mocked @multi-tenant`) + `decisions.md` (2026-07-12) | None (resolved before merge) |
| AC5 | ✅ | Spec tagged `@mocked @multi-tenant`, uses two independent Playwright request contexts for genuinely separate tenant sessions, driven by bri-s3.1's mock gateway | E2E spec present and correctly tagged | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

**Disclosed and reasoned in `decisions.md` (2026-07-11 and 2026-07-12, SCOPE, bri-s3.4)** — this story grew beyond "write one regression spec" to include real, pre-existing production fixes, exactly as this story's own security-critical framing anticipates:

**Real cross-tenant leaks found and fixed:**
1. `handleGetProductView` (`GET /products/:id`) had no `tenant_id` filter — fixed to 404 on mismatch.
2. `handleGetProductKanban` (`GET /products/:id/kanban`) — same gap, same fix.
3. `standardsList` (`GET /products/:id/standards`) had no `org_id` filter — fixed.
4. `standardsPut` (`PUT /standards/:id`) had zero ownership check before update — fixed.
5. `standardsPost` (`POST /products/:id/standards`) never verified target product belonged to caller's tenant — fixed.

All five fixed to 404, consistent with `middleware/journey-access.js`'s existing policy.

**Infrastructure completions (unwired/broken plumbing, found only because this is the first E2E spec to exercise these paths over real raw HTTP):**
6. `routes/standards.js` had no request-body parsing — added `_readBody` helper.
7. `routes/standards.js` called `res.status(x).json(y)` unconditionally, which only works against the Express-mock-style unit-test `res` object, not this app's real raw-HTTP server — added `_sendJson()`.
8. `GET /journeys`'s `_listJourneys` D37 adapter was only wired inside a `WIRE_SKILL_ADAPTERS`-gated block, never reachable by any `NODE_ENV=test` run — wired it in the existing test-mode block (in-memory only).

**Post-merge, real-CI-run fix (2026-07-12):** a genuine rate-limiter collision was found only by actually running AC4's 20x repeat verification — every repeat signs up 2 fresh tenants from the same IP, tripping `routes/auth-email.js`'s 10-attempts-per-5-minutes limiter (16/20 repeats failed with HTTP 429, not a flake). Fixed with a dedicated `E2E_RATE_LIMIT_BYPASS` flag scoped to `playwright.config.js`'s `webServer.env` only — confirmed the production rate limiter itself is untouched and still fully exercised by its own dedicated test (`check-lab-s2.2-email-password.js`, still 36/36 passing).

**Merge-conflict resolution (2026-07-12):** `handleGetProductKanban` conflicted with bri-s1.5's flag-gate addition — resolved by running the flag check first (per bri-s1.5's own AC2 short-circuit requirement), then the ownership check second. Verified via re-run: `check-bri-s3.4-cross-tenant-isolation.js` 14/14, `check-psh-s6-product-kanban.js` 7/7.

**Post-merge, real-CI-run fix (2026-07-12):** bri-s1.5's flag gate landing meant every E2E spec booting the server started crashing with `Adapter not wired: posthogFlagsAdapter` (the D37 stub correctly throwing when unwired, per bri-s1.1 AC2) — this initially manifested as bri-s3.4's own 20x isolation gate appearing to hang. Fixed by wiring a fake, flags-open adapter in `server.js`'s test-mode branch, leaving the real-PostHog-client branch for staging/production untouched.

None of these items touches this epic's declared out-of-scope list (org-tenancy allowlist model, filesystem/DB-level penetration testing).

---

## Test Plan Coverage

**Tests from plan implemented:** 14 / 14 (unit/integration) + 1 E2E spec
**Tests passing in CI:** 14 / 14 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-bri-s3.4-cross-tenant-isolation.js` | ✅ | ✅ (14/14) | Covers `isSameTenant` correctness, 404-not-403, list filtering, write rejection, tenant-scoped credits/user_roles |
| `tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js` | ✅ | Present, tagged `@mocked @multi-tenant` | 2/2 passing when run directly per `decisions.md` (3.3s, post rate-limit-bypass fix) |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Tenant isolation (cross-tenant reads/writes rejected, 404 not 403) enforced and regression-tested | ✅ | Directly evidenced by the 14/14 passing suite; `pipeline-state.json` guardrail `NFR-tenant-isolation` already marked `met`, citing bri-s3.4 |
| Contributes to shared `@mocked` suite under-10-minute budget | ✅ | No individual per-spec budget violation found |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 4 — Risk-critical journeys have deterministic E2E coverage | ✅ (0 of 5) | Yes — 2 of 5 journeys now covered (with bri-s3.2) | |
| Metric 5 — Cross-tenant isolation suite has zero tolerance for flake or skip | ✅ (not yet established) | Yes — 0% skip, 0% flake confirmed post rate-limit-bypass fix (40/40 across the 20x repeat run) | This is this story's own dedicated metric, directly and fully evidenced |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- **PAT-06 (Pattern 06 — Execution pre-condition gate on runtime artefact existence) cross-reference, genuinely open, not resolved by this story:** bri-s1.2's DoR (Definition of Ready) contract names a distinct, still-outstanding verification — real Playwright traffic against the actual staging vs. production PostHog projects, confirming zero cross-tenant/cross-environment PostHog event contamination — gated on Epic 2 (staging environment) *and* bri-s3.4 both reaching DoD. bri-s3.4's shipped tests verify **application-layer** tenant isolation (Postgres-backed journeys/products/standards/credits/user_roles) — real, passing coverage, but a different concern (analytics-event routing) from what bri-s1.2's gate needs, and one that inherently requires a live staging deploy, not the `@mocked` CI variant. This DoD sweep advances bri-s3.4 (and all of Epic 2) to `dodStatus: complete`, formally satisfying PAT-06's stage precondition for the first time — but the live PostHog cross-contamination check itself has still never been run against real infrastructure. See bri-s1.2-dod.md for the tracked action.

---

## DoD Observations

1. **This is the most consequential story in the epic from a security standpoint** — five real, pre-existing cross-tenant data leaks were found and fixed as a direct result of actually driving this spec end-to-end rather than trusting `routes/standards.js`'s and `routes/products.js`'s existing unit tests (which never exercised the real raw-HTTP `res` object shape and therefore never caught the missing tenant/org filters). **Tag: /improve candidate** — the general pattern ("build the first real E2E spec to exercise a route file, and treat what it finds as a first-class security review, not just spec-writing") is worth promoting into `.github/architecture-guardrails.md` or the epic-3 slicing guidance for any future epic that adds the first E2E coverage over an existing route file.
2. The post-merge rate-limit collision and the PostHog-adapter-not-wired collision were both only caught because a coding agent ran the *actual* CI gate this story was building (20x repeat, real GitHub Actions), not just a local pass. Reinforces the same "verify-completion passed locally is not equivalent to this pipeline works" lesson already logged in bri-s2.5's decisions.md entry.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Cross-tenant isolation journey spec" (bri-s3.4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is the PAT-06/bri-s1.2 cross-reference genuinely still open, or has it since been resolved elsewhere?
Report findings as HIGH / MEDIUM / LOW.
```
