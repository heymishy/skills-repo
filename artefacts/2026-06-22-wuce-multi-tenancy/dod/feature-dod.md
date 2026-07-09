# Feature Definition of Done — wuce-multi-tenancy

**Feature:** WUCE Multi-Tenancy — Authorization Guard and Tenant Isolation (ADR-025)
**Operator:** Hamish King | **Date:** 2026-06-29
**Production deployment:** https://skills-framework.fly.dev

---

## Story completion summary

All 17 stories at `definition-of-done`. No stories blocked or incomplete.

| Story | Name | ACs | Verdict |
|-------|------|-----|---------|
| p0.1 | Authorization guard module | 11 | COMPLETE WITH DEVIATIONS (AC11: isOwner not exported, POLICY constant exported instead — functionally superior) |
| p0.2 | Wire guard into all 11 route handlers | AC-set | COMPLETE |
| p1.1 | GitHub org allowlist → tenantId resolution | AC-set | COMPLETE |
| p1.2 | tenantId persistence to session and journey | AC-set | COMPLETE |
| p2.1 | Filesystem + session-store isolation | AC-set | COMPLETE |
| p2.2 | Tenant-isolation test suite | 7 | COMPLETE WITH DEVIATIONS (AC5-excl: handlePostSideTripClarify same-tenant path not in automated test — guard verified by AC1.7) |
| p3.1 | Postgres journey store adapter | AC-set | COMPLETE |
| p3.2 | Redis session store adapter | AC-set | COMPLETE |
| p3.3 | Concurrent isolation + restart-survival tests | AC-set | COMPLETE |
| p4.1 | Per-tenant rate limiting + prompt-cache scoping | AC-set | COMPLETE |
| p5.1 | tenantId validation + adversarial path-traversal audit | 10 | COMPLETE |
| s3.1 | Neon Postgres provisioning | 5 | COMPLETE |
| s3.2 | Upstash Redis provisioning | 5 | COMPLETE |
| s4.1 | Production deployment + smoke test | 6 | COMPLETE |
| s4.2 | Tenant onboarding configuration | 6 | COMPLETE (AC1–AC4 N/A — solo mode; AC5+AC6 PASS) |
| s4.3 | Default executor provider to Anthropic | 4 | COMPLETE (retroactive) |
| s5.1 | Beta monitoring signals | 5 | COMPLETE |

---

## Out-of-scope check

No story implemented anything from its out-of-scope section. Feature-level deferred items (PostHog, Stripe billing, dual-surface authority, self-serve onboarding) remain unimplemented as intended.

**Known accepted gap — journey list not fully tenant-filtered:** `handleGetJourneyResume`'s access guard is live (p0.2) but the list view still shows all feature slugs across tenants. Accepted in p0.2 as defence-in-depth: individual journey access is blocked, slug enumeration risk is low at beta scale. Logged in decisions.md.

---

## NFR check — feature level

| NFR | Status | Evidence |
|-----|--------|---------|
| NFR-sec-no-accesstoken-disk | ✅ met | p2.1 strip-before-write preserved; p2.2 AC4.3 confirms accessToken absent from session files; p3.2 smoke test confirms accessToken absent from Redis |
| NFR-sec-existence-leak | ✅ met | TENANT policy returns 404 not 403 — p2.2 27/27 tests pass; p0.2 guard wiring confirmed |
| NFR-sec-pathtraversal | ✅ met | p5.1 14/14 adversarial traversal tests pass; all 6 disk-write handlers audited |
| NFR-sec-allowlist-disclosure | ✅ met | 403 message confirmed not to expose TENANT_ORG_ALLOWLIST — p1.1 test verified |
| NFR-sec-session-field | ✅ met | grep check at DoR confirmed zero `req.session.token` uses; all routes use `req.session.accessToken` |
| NFR-p1.1-async-fetch | ✅ met | Org fetch is async/await; does not block event loop |
| NFR-p1.1-fetch-timeout | ✅ met | 5s timeout in place; warning logged above 3s |
| NFR-sec-pathtraversal | ✅ met | path.resolve guard in all tenant-derived write paths — p2.1 16/16, p5.1 14/14 |
| NFR-p2.1-getRepoRoot-sync | ✅ met | 1000 calls <1000ms (NFR test in p2.1 suite) |
| NFR-p2.2-suite-perf | ✅ met | 27 tests complete well within 10s (CI confirmed at p2.2 merge) |
| NFR-p2.2-tmpdir-cleanup | ✅ met | try/finally cleanup verified by p2.2 test implementation review at merge |
| NFR-sec-no-credentials-in-output (s5.1) | ✅ met | check-beta-health.sh code inspection — no credential values echoed |
| NFR-PERF-health-check (s5.1) | ✅ met | curl --max-time 10 present at line 29 |
| NFR-PORT-bash3 (s5.1) | ✅ met | No bash 4+ features; POSIX-compatible |

**Updated:** NFR-p2.2-suite-perf and NFR-p2.2-tmpdir-cleanup updated from `not-assessed` to `met` — evidence confirmed by p2.2 DoD (2026-06-24).

---

## Metric signals

### M1 — Authorization coverage rate

**Signal: on-track**
Target: 100% (11/11 handlers). Measured: 11/11 — 100%.
Evidence: Full guard wiring verified by p0.2 test suite on merged commit 1b1d068 (2026-06-23). CI gate runs on every PR touching journey.js.

### M2 — Cross-tenant journey data leakage prevention

**Signal: not-yet-measured**
Target: Zero cross-tenant API responses return journey data for caller from different tenant.
Evidence: Lab verification complete (p2.2, 27/27 automated tests pass; p4.1 inference-layer isolation live). Production deployed (skills-framework.fly.dev) with correct `tenant_id` persisted in Neon per tenant (s4.1 AC4). Running in solo mode (TENANT_ORG_ALLOWLIST empty) — cross-tenant production verification requires a second tenant. M2 transitions to `on-track` when the first org-based beta user is onboarded and cross-tenant access is confirmed to return 404.

### T3-M1 — KNOWN BUG closure: unguarded journey route handlers

**Signal: on-track**
Target: 0 unguarded handlers (binary — OPEN or CLOSED).
Evidence: 9 previously unguarded handlers now guarded via requireJourneyAccess(). KNOWN BUG closed. Verified by 13-test integration suite on merged commit 1b1d068 (2026-06-23).

### T3-M2 — Path-traversal guard validity under variable tenantId-derived repoRoot

**Signal: on-track**
Target: 0 guard failures against adversarial tenantId injection test suite.
Evidence: p5.1 — 14/14 adversarial traversal tests pass. slugifyTenantId() validated against ../../../, URL-encoded variants (%2e%2e%2f), null bytes, 300-char overlong inputs, and Unicode homoglyphs. All 6 disk-write handlers audited. path.resolve + startsWith guard confirmed for all variable-root paths. Merged PR #397 (2026-06-24). Note: pipeline-state T3-M2 signal was stale (not-yet-measured) — corrected here.

---

## Deviations recorded

1. **p0.1 AC11:** `isOwner` not exported; `POLICY` constant exported instead. Functionally superior — callers use `POLICY.TENANT` / `POLICY.OWNER`. Recorded in p0.1-dod.md. No runtime regression.
2. **p2.2 AC5-excl:** `handlePostSideTripClarify` same-tenant positive path not in automated test. Guard verified by AC1.7. Recorded in p2.2-dod.md.
3. **s4.1:** Two `createdAt` Date-object bugs (journey.js:154, journey.js:276) surfaced and fixed during smoke test (commits f5e7477, 66555f7).
4. **s4.3 (production hotfix):** SKILL_EXECUTOR_PROVIDER default changed from `copilot` to `anthropic` (commit 8c21dcd). Retroactive story satisfies artefact-first rule.
5. **s4.2 AC1–AC4:** N/A — solo mode for initial beta. Org-based tenantId flow not exercised. Operator decision, not a defect.
6. **s5.1 AC1 gap fixed:** Billing gate handler did not emit a log line; added `console.error` to fulfil AC1 (commit aa831da).

---

**Feature verdict: COMPLETE WITH DEVIATIONS**

All 17 stories at definition-of-done. No HIGH findings. All deviations recorded. Production live. M1 and T3-M1 on-track; T3-M2 on-track. M2 not-yet-measured pending first org-based beta user.
