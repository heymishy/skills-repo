# Definition of Done: Bootstrap a brand-new tenant's first admin automatically on login

**PR:** https://github.com/heymishy/skills-repo/pull/925 | **Merged:** 2026-09-29T05:09:06Z
**Story:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s1.md
**Test plan:** artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-26-tenant-admin-bootstrap/dor/tab-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification strength | Deviation |
|----|-----------|----------|------------------------|-----------|
| AC1 | ✅ | `firstLoginOnNewTenantGrantsAdmin`, `githubCallbackWiresIntoBootstrapForNewTenant`, `googleCallbackWiresIntoBootstrapForNewTenant`, `emailSignupWiresIntoBootstrapForNewTenant` — all re-run fresh against merged `master` just now, all pass | integration-real-code (real route dispatch through `routes/auth.js`/`routes/auth-email.js`, real transactional fake-pool semantics) | None |
| AC2 | ✅ | `secondPersonIntoBootstrappedTenantDoesNotBecomeAdmin` | unit | None |
| AC3 | ✅ | `concurrentBootstrapExactlyOneWins` — real `Promise.all` concurrency against the fake pool's atomic `ON CONFLICT` emulation, not a serialized simulation | unit (concurrency-real) | None |
| AC4 | ✅ | `bootstrapIdenticalAcrossAllThreeProviders` plus the 3 per-provider integration tests above | integration-real-code | None |
| AC5 | ✅ | `noOpWhenTenantAlreadyHasRealAdmin` | unit | None |
| AC6 | ✅ | `rollbackLeavesNoClaimedButAdminlessTenant` | unit | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

**Note on evidence class:** no AC in this story claims an external, real-world effect (no third-party system, no rendered UI) — every AC is a server-side data/transaction guarantee, so `unit`/`integration-real-code` evidence is the correct and sufficient class here. `AC3`'s concurrency proof and `AC6`'s rollback proof were both explicitly required by the story to be real (not mocked/serialized) — confirmed, both run against a fake pool that models real Postgres transactional semantics (`BEGIN`/`COMMIT`/`ROLLBACK`, atomic `ON CONFLICT DO NOTHING RETURNING`), not against a serialized stub.

**UI-evidence gate:** N/A — no AC in this story describes browser-observable behaviour (backend-only, no rendered UI).

---

## Fix-forward found during `/verify-completion` (in scope, shipped in this PR)

The mandatory route/handler E2E coverage check found a real regression: `arl-s4`'s pre-existing admin-bypass gate in `routes/auth.js` was written when `role==='admin'` could only mean a legacy pre-existing operator who should never see `/welcome`. This story's bootstrap grant introduces a second, valid way to become admin — a brand-new tenant's first sign-up, who by definition SHOULD see `/welcome`. Fixed with a `_grantedAdmin` flag scoped to the exact call that performed the grant; verified all 4 `bri-s3.6-auth-journey.spec.js` tests (including the returning-admin case) pass with the fix. Full root-cause writeup: `artefacts/2026-09-26-tenant-admin-bootstrap/decisions.md`.

---

## Scope Deviations

None. PR #925's file list (`git diff`/`gh pr view --json files`) touches only `tenant-admin-bootstrap.js` (new), `identity-links.js`, `routes/auth.js`, `routes/auth-email.js`, `server.js`, the story's own test file, and artefact/state bookkeeping — no `tab-s2` (backfill) or `tab-s3` (legacy removal) file is present, confirming the out-of-scope boundary held.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 (6 unit + 3 integration; the 3 NFR tests are additional, not double-counted against the 9 AC-verifying tests)
**Tests passing, re-run fresh against merged `master`:** 14 / 14 (`node tests/check-tab-s1-tenant-admin-bootstrap.js`, executed during this DoD check, not carried over from `/verify-completion`'s own report)
**Full repo suite:** `node scripts/run-all-tests.js` — 703 files, 2 pre-existing/environmental failures unrelated to this diff (`check-p3.5-validate-trace.js`: known Windows python3-shim issue; `check-pcr-s1-test-runner.js`: a per-file performance benchmark confirmed to fail identically, and by a larger margin, on bare `master` with none of this branch's changes present — machine-load variance, not a regression). 0 new failures.

| Test | Implemented | Passing (fresh) | Notes |
|------|-------------|-------------------|-------|
| firstLoginOnNewTenantGrantsAdmin (AC1) | ✅ | ✅ | |
| secondPersonIntoBootstrappedTenantDoesNotBecomeAdmin (AC2) | ✅ | ✅ | |
| concurrentBootstrapExactlyOneWins (AC3) | ✅ | ✅ | |
| bootstrapIdenticalAcrossAllThreeProviders (AC4) | ✅ | ✅ | |
| noOpWhenTenantAlreadyHasRealAdmin (AC5) | ✅ | ✅ | |
| rollbackLeavesNoClaimedButAdminlessTenant (AC6) | ✅ | ✅ | |
| githubCallbackWiresIntoBootstrapForNewTenant (AC1/AC4 integration) | ✅ | ✅ | |
| googleCallbackWiresIntoBootstrapForNewTenant (AC1/AC4 integration) | ✅ | ✅ | |
| emailSignupWiresIntoBootstrapForNewTenant (AC1/AC4 integration) | ✅ | ✅ | |
| serverJsWiresTenantAdminBootstrapPool (D37 wiring guard) | — (bonus) | ✅ | Added during implementation, checks the real call site per this repo's own D37-lesson convention, not just that a module was imported |

**Gaps (tests not implemented):** None.

**Coverage gap audit (CSS-layout-dependent):** N/A — the test plan records zero layout-dependent ACs, confirmed by DoR's `H-E2E: N/A`. Nothing to audit.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — bootstrap adds a small, fixed query cost | ✅ | `exactlyTwoRealInsertsForOneSuccessfulBootstrap` — re-run fresh, passes. Test-plan text said "exactly 4 query calls"; shipped test correctly asserts 2 real INSERTs (`BEGIN`/`COMMIT` are intercepted below the counted query log) — a documented, accepted test-plan wording drift, not a behavioural gap (see `decisions.md`, `/subagent-execution` final review, Observation 2). NFR itself (no meaningful added latency) is genuinely satisfied. |
| Security — race-safety under concurrent load | ✅ | AC3's real concurrency test, re-run fresh, passes. Matches the feature-level NFR profile's Security row and guardrail `NFR-security-tab-race` (already `met`, assessed at DoR). |
| Accessibility — N/A | ✅ N/A | Backend-only, no rendered UI. Matches guardrail `NFR-accessibility-tab` (`na`). |
| Audit — `admin_bootstrap_granted` logged, no raw identity string | ✅ (with one pre-existing, accepted partial-gap) | `grantIsAuditedWithoutRawIdentityString` re-run fresh, passes. **Caveat, logged during `/subagent-execution` final review (Observation 1, RISK-ACCEPT):** for email/password-provider tenants specifically, `req.session.tenantId` already equals the raw email address app-wide (a pre-existing characteristic of this codebase's tenant model, not introduced by this story) — so the audited `tenantId` field is the literal email for that one provider. The guarantee holds fully for GitHub/Google (2 of 3 providers) and partially for email. Accepted as-is; fixing it is an app-wide `tenantId`-derivation change, out of scope for this story. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable |
|--------|--------------------|-----------------------|
| m1 — Time-to-admin for a brand-new solo signup | ✅ — "infinite / never (confirmed live)" | not-yet-measured |
| m2 — % of real tenants with at least one working admin | ✅ — "at least 1 tenant confirmed at 0%" | not-yet-measured |
| m3 — Manual admin-grant interventions needed | ✅ — "effectively required for every tenant today" | not-yet-measured |

**Evidence note:** No real-user login has yet exercised this code path in production since merge (PR merged minutes before this DoD check) — measurement is not yet possible. This is `not-yet-measured`, not a gap: the mechanism is live and correct per fresh test evidence above; the metric needs real signups to accrue before a signal exists.

**Observation (not a blocker):** none of `m1`/`m2`/`m3`'s `contributingStories` arrays in `pipeline-state.json` currently list `tab-s1`, even though `m1` is this story's own named benefit-linkage metric and the discovery/benefit-metric artefacts directly attribute it here. Left as a DoD observation below rather than silently edited, since populating `contributingStories` correctly for all 3 stories in this epic is a feature-level bookkeeping concern, not solely tab-s1's.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Once real signups start flowing through production, measure `m1`/`m2`/`m3` and update their signal — flagged above, not blocking.
2. Populate `contributingStories` for `m1`/`m2`/`m3` in `pipeline-state.json` to include the relevant story slugs (`tab-s1` for `m1`/`m3`; `tab-s2` likely for `m2`) — a feature-level bookkeeping gap, not specific to this story.
3. The pre-existing cross-spec E2E test-isolation flake found (but proven unrelated to this story) during `/verify-completion` remains open — see `decisions.md`'s own revisit trigger; root-cause it if it starts blocking other features' E2E runs.
4. Test-plan wording drift ("4 query calls" vs. the shipped, correct "2") is cosmetic and addressable whenever convenient — see `decisions.md` Observation 2.

---

## DoD Observations

1. **`m1`/`m2`/`m3`'s `contributingStories` arrays are empty in `pipeline-state.json`**, despite the discovery/benefit-metric artefacts and this story's own Benefit Linkage section directly attributing `m1` to `tab-s1`. This looks like a definition-time authoring gap (the field was left unpopulated) rather than a deliberate choice — worth a `/improve` check on whether `/definition` or `/benefit-metric` should populate `contributingStories` as a standard step, so DoD's own Step 6 measurement gate (which reads this field) doesn't silently skip metrics that genuinely apply.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for tab-s1 (tenant-admin-bootstrap first story).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
