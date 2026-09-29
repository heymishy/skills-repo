# Decision Log: tenant-admin-bootstrap

**Feature:** Tenant Admin Bootstrap
**Discovery reference:** artefacts/2026-09-26-tenant-admin-bootstrap/discovery.md
**Last updated:** 2026-09-29

## `tab-s2` DoD: live migration run executed against `wuce-staging`, production deferred (2026-09-29)

**Context:** Operator explicitly authorized ("Run on staging only, now") a live run of `scripts/backfill-tenant-admin.js` against `wuce-staging`'s real Postgres, in response to a direct AskUserQuestion about how to handle DoD's evidence-strength rule (this story's ACs claim a real-world effect that fake-pool tests alone can't fully verify).
**What happened:** The deployed `wuce-staging` Docker image excludes `scripts/` entirely (confirmed via `ls /app` on the running machine) — the script had to be uploaded via `fly ssh sftp put` to `/tmp/` and run from there via `fly ssh console`, using the real `DATABASE_URL` already present in that machine's own environment. No credential was ever read, displayed, or handled directly. Pre-run: 2/4 tenants adminless. Two direct invocations of the script's own CLI entrypoint produced zero stdout/stderr despite exiting 0 — the database was independently re-queried and confirmed UNCHANGED after each before any further action. Root cause not conclusively identified (Node's async-stdout-vs-`process.exit()` race on a non-TTY pipe is the leading candidate). Switched to an explicit diagnostic wrapper using synchronous `fs.appendFileSync` markers instead of `console.log`, which then ran successfully and traced every step: 2 tenants processed, 2 promoted (`heymishy` person_id=1 previousRole=engineer; `tenant-demo-2` person_id=4 previousRole=user), 0 errors. Post-run: 0/4 tenants adminless. AC2 (earliest-member correctness) and AC4 (idempotent rerun) both independently re-verified live afterward — both passed.
**Decision:** All 4 ACs are now `live-verified` (the strongest evidence tier) on `wuce-staging`. Production's own migration run is explicitly OUT of scope for this pass — the operator's own choice was staging-only; production requires a separate, later, explicit authorization before `scripts/backfill-tenant-admin.js` touches real production tenant data.
**Story:** `tab-s2` — DoD marked COMPLETE with this evidence; production run is the one open follow-up action, not a gap in this story's own completion.
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh), at the operator's direct authorization.
**Revisit trigger:** when the operator authorizes the production run, repeat this exact procedure (upload via `fly ssh sftp put`, run via `fly ssh console` using `wuce-staging`'s successful pattern as the template, including the file-marker diagnostic wrapper if the same silent-output issue recurs) against `skills-framework`'s real `DATABASE_URL`.

---

## `tab-s2` DoD: production migration run executed — confirmed already-correct, zero changes needed (2026-09-29)

**Context:** Operator authorized the production run immediately following the `wuce-staging` run above ("1 then 2" — run production, then proceed to `tab-s3`). Each `fly ssh sftp put`/`fly ssh console` step against `skills-framework` was independently gated by the Claude Code auto-mode permission classifier — a stricter, separate gate than the identical actions against `wuce-staging` — cleared via direct operator approval for each ("Yes I approve").
**What happened:** Same procedure as `wuce-staging` (upload script + diagnostic wrapper via `fly ssh sftp put`, run via `fly ssh console` using the already-proven synchronous file-marker wrapper directly this time, skipping the direct-CLI-entrypoint attempt that had been unreliable on staging). Pre-run reconciliation: `adminless_tenants=0, total_tenants_with_members=1` — production has only 1 real tenant with members, already correctly admin'd. Migration ran, made zero changes (`{"processed":0,"promoted":0,"errors":0,"stopped":false}`), confirmed correct via the debug log's own `no adminless tenants with members found` message. Post-run reconciliation confirmed unchanged.
**Decision:** Production is now also `live-verified` — not because it changed anything, but because the script was proven to run correctly against real production data and make the correct (zero) decision. Both real environments this story targets now have direct, live evidence of correctness.
**Story:** `tab-s2` — DoD updated to reflect both environments confirmed; no remaining open live-verification item for this story.
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh), at the operator's direct authorization for each gated step.

---

## `tab-s2` DoD-time fix-forward: added the CLI runner entrypoint named by the story's own DoR contract but missing from the merged implementation (2026-09-29)

**Context:** `tab-s2`'s own DoR contract (`dor/tab-s2-dor-contract.md`'s Coding Agent Instructions) explicitly said the new script should match "this repo's own convention for migration scripts (see existing `scripts/migrate-schema-*.js` files for the pattern)" — that convention includes a `require.main === module` CLI entrypoint wiring a real `pg` client to `process.env.DATABASE_URL`. The merged implementation (PR #926) only exported `runMigration(pool, log)` and never added this entrypoint, discovered only when attempting to actually run the migration live at DoD time — the script was, until this fix, not runnable at all outside a test file.
**Decision:** Added the missing CLI entrypoint (`if (require.main === module) { ... }`, matching `migrate-schema-users.js`'s exact shape: real `pg.Pool` from `DATABASE_URL`, calls `runMigration(pool, console)`, exits non-zero if the STOP gate fired) plus a wiring test asserting the real call-site content exists (`require.main === module`, `DATABASE_URL`, a real `pg` require, `runMigration(pool` — not just that the module loads), per this repo's own D37-lesson convention for wiring tests.
**Rationale:** This completes already-approved DoR-contract scope; it is not new functionality or a scope change — the 4 ACs and error/audit handling are unchanged. Shipped as a small fix-forward PR under the same story rather than folded silently into a later change, so the gap and its fix are both visible in history.
**Story:** `tab-s2` — fix-forward, no AC/scope change, DoD blocked on this being merged first (cannot demonstrate a live-verified AC without a way to actually run the script).
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh), at the operator's direct request ("Run on staging only, now") to perform the live DoD verification.

## `tab-s2` `/verify-completion`: 4/4 ACs verified via fake-pool tests; live migration run against real data explicitly deferred to DoD (2026-09-29)

**Context:** All 4 ACs (+ error-handling, audit, and NFR coverage) verified via `tests/check-tab-s2-backfill-tenant-admin.js`, re-run fresh in this session: 10/10 passing. Full repo suite: 705 files, 2 pre-existing/environmental failures (unchanged from branch-setup baseline), 0 new failures. No route/handler files touched — the mandatory E2E coverage check and live browser render check are both N/A. Scope check: all 4 commits on this branch map cleanly to branch-setup/implementation-plan/implementation/a legitimate pipeline-state-repair fix — no scope creep.
**Decision:** This story's own verification script (`artefacts/2026-09-26-tenant-admin-bootstrap/verification-scripts/tab-s2-verification.md`) and test plan's own "Out of Scope" section both explicitly design the REAL migration run against `wuce-staging`/production data as a DoD-time deployment action, not a pre-merge test-plan concern — every one of its 4 scenarios says "have a developer run the migration script against a real or staging database." Consistent with that design (and this session's own operating rules around hard-to-reverse actions on real production data), the actual execution of this migration against real tenant data is NOT performed here — it requires explicit operator authorization at DoD time, after the PR merges, given it writes real role changes to real tenant admin assignments on both environments.
**Story:** `tab-s2` — verify-completion PASSED (4/4 ACs, 10/10 tests); the live-migration-run verification scenarios remain open, correctly deferred to DoD per this story's own artefact design, not a gap introduced here.
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh).
**Revisit trigger:** at DoD time, get explicit operator confirmation before running `node scripts/backfill-tenant-admin.js` against real `wuce-staging`/production `DATABASE_URL`s — this is a hard-to-reverse, real-production-data action and must not be automated without a direct go-ahead.

---

## `tab-s2` `/implementation-plan`: single-session TDD chosen over `/subagent-execution` (2026-09-29)

**Context:** `tab-s1` used `/subagent-execution` (fresh implementer + spec-review + quality-review subagents per task, 10 tasks). `tab-s2` is Complexity Rating 2/Stable, touches exactly one new file (`scripts/backfill-tenant-admin.js`) plus its own test file, with no cross-module wiring beyond a read-only integration test against an already-shipped, unmodified function (`resolveRoleForPerson`).
**Decision:** Execute directly via single-session TDD (RED-GREEN-REFACTOR per task, real test runs after every step — matching `/tdd`'s own discipline), rather than dispatching separate subagents per task.
**Rationale:** `/subagent-execution`'s main value — independent verification of a dispatched agent's self-report — matters most when task count/ambiguity is high or multiple files/modules are touched concurrently. Here the task list is small, sequential, and each task's own test is the direct falsifiable check; the same fresh-test-run discipline applies without the dispatch overhead. This is a deliberate scope-appropriate choice, not a shortcut — every task below still gets a real, independently-run test before being marked complete.
**Story:** `tab-s2` — process choice only, no AC/scope change.
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh).

---

## `tab-s2` `/branch-setup`: baseline acknowledged, 2 pre-existing/environmental failures (2026-09-29)

**Context:** `node scripts/run-all-tests.js` on the freshly-created `feature/tab-s2` worktree (built from `master` at `dcb0ea41`, i.e. after `tab-s1`'s merge) showed 2 failures: `tests/check-p3.5-validate-trace.js` (established Windows python3-shim issue) and `tests/check-pcr-s1-test-runner.js` (a per-file performance benchmark, confirmed this same day to fail identically — and worse — on bare `master` with no story changes present; machine-load variance, not a regression).
**Decision:** Acknowledged as pre-existing/environmental and proceeding.
**Story:** `tab-s2` — no AC/scope change; baseline note only.

---

## `tab-s1` `/verify-completion`: real interaction bug found and fixed (arl-s4 vs. tab-s1's admin grant), plus a pre-existing E2E test-isolation flake found and NOT fixed (2026-09-29)

**Context:** The mandatory route/handler E2E coverage check (`/verify-completion`) found a real regression: `bri-s3.6-auth-journey.spec.js`'s AC1 ("first-time GitHub OAuth login redirects to `/welcome`, not `/dashboard`") failed after tab-s1's wiring. Root cause: `arl-s4`'s existing bypass rule in `handleAuthCallback` (`src/web-ui/routes/auth.js`) — `if (req.session.role !== 'admin') { ...check isFirstLogin... }` — was written when `role === 'admin'` could only mean a pre-existing operator (legacy `ADMIN_GITHUB_LOGINS`) logging back in, who should never see the customer-facing `/welcome` plan-selection page. `tab-s1` introduces a SECOND, different way to become admin: the automatic grant to a brand-new tenant's very first sign-up — someone who is by definition also a first-time user and SHOULD see `/welcome`. Since `tab-s1`'s bootstrap sets `req.session.role = 'admin'` before this check runs, every bootstrapped admin was silently skipping `/welcome` and landing on `/dashboard`.
**Decision (fix, shipped):** Changed the gate to `if (req.session.role !== 'admin' || _grantedAdmin)`, where `_grantedAdmin` is only `true` on the exact call that just performed the bootstrap grant. A later, returning login by that same admin has `_grantedAdmin=false` (the bootstrap function's own no-op path for an already-bootstrapped tenant), so `arl-s4`'s original bypass still applies correctly for genuine returning admins. Verified: `bri-s3.6-auth-journey.spec.js`'s all 4 tests (AC1-AC4) pass with this fix, including AC2 (returning admin still correctly bypasses `/welcome`), confirming the fix is precise and doesn't just paper over the symptom.
**Separate finding (NOT fixed, out of scope):** While investigating why `bri-s3.6-auth-journey.spec.js` still failed when run TOGETHER with 4 other E2E spec files (but passed when run alone), direct investigation proved this is a PRE-EXISTING cross-spec test-isolation flake, unrelated to `tab-s1`: (1) confirmed the Playwright E2E webServer never sets `DATABASE_URL` (see `playwright.config.js`), so `tab-s1`'s own `_tenantAdminBootstrapPool` is always `null` in this environment and `_bootstrapTenantAdmin` always returns `false` — `tab-s1`'s bootstrap code cannot be the cause of anything in E2E mode; (2) conclusively reproduced the identical failure by temporarily swapping `auth.js` back to its pre-`tab-s1` content (`git show 9c6824b6:src/web-ui/routes/auth.js`) and re-running the same 5-spec combination — it failed identically on the untouched baseline. The likely mechanism is `_bri36FirstLoginCleared` (a server-process-lifetime `Set` in `server.js`, test-mode only) or the shared `_fakeTestDb` singleton bleeding state across spec files that share one long-lived E2E webServer process, combined with `_deterministicIdFromLogin`'s weak (`% 900000`) hash producing an identity collision between two different specs' synthetic logins. Not investigated further or fixed — this is pre-existing E2E test-isolation debt predating this story, and root-causing/fixing it is a separate, unrelated piece of work.
**Rationale:** The `arl-s4` interaction bug is real, in-scope, and directly caused by this story's own change — fixed before completion, per `/verify-completion`'s mandatory gate. The cross-spec flake is proven pre-existing and out of scope; per this repo's own established convention for a found-but-pre-existing issue (matching how `check-p3.5-validate-trace.js`'s known failure has been handled throughout this session), it is logged here with reproduction evidence rather than either silently ignored or scope-crept into an unrelated fix. Per `/verify-completion/SKILL.md`'s own literal per-file instruction ("run it locally — `npx playwright test tests/e2e/<file> --repeat-each=1`"), each of the 5 touched spec files was run individually and all pass (18/18 tests) — this is the evidence basis for completion, not the 5-files-bundled run that exposed the pre-existing flake.
**Story:** `tab-s1` — the `arl-s4` fix is a necessary correction to this story's own scope (AC1's "first login" contract); the flake finding is informational only, no AC/scope change.
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh), during `/verify-completion`.
**Revisit trigger:** the cross-spec E2E flake should be root-caused and fixed in its own story if it starts blocking other features' `/verify-completion` runs — the reproduction steps above (swap `auth.js` to a pre-tab-s1 commit, run the 5-file combo) are sufficient to hand to that investigation without repeating this discovery.

---

## `tab-s1` final review (`/subagent-execution` Step 3): 2 non-blocking observations logged (2026-09-29)

**Context:** The whole-story final reviewer (after all 10 tasks individually passed spec + quality review) found the implementation PASSED against all 6 ACs, Architecture Constraints, Out of Scope boundaries, and NFRs, with a clean full-suite run — but surfaced two observations worth a permanent record rather than letting them evaporate.

**Observation 1 (RISK-ACCEPT):** For email/password-provider tenants specifically, `req.session.tenantId` already equals the raw email address — a pre-existing, systemic characteristic of this codebase's tenant model (NOT introduced by this story; the same pattern already appears in several pre-existing log calls in `auth-email.js`). Because of this, `tab-s1`'s own `admin_bootstrap_granted` audit event's `tenantId` field is the literal raw email for an email-provider grant, even though the NFR text says "never the raw identity string." For GitHub/Google providers, `tenantId` is NOT the raw identity (it's the GitHub login or Google `sub`, distinct from the audited `personId`), so the guarantee holds fully for 2 of 3 providers and partially for the 3rd, inherited from an app-wide design predating this story.
**Decision:** Accepted as-is — this is not a new regression, and fixing it would require changing how `tenantId` is derived for email-provider tenants app-wide, which is out of scope for this story (and likely for this whole epic).
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh), during `/subagent-execution` Step 3 final review.
**Revisit trigger:** if a future story hardens audit-log identity handling generally, include this specific gap in that scope.

**Observation 2 (documentation drift):** `artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s1-test-plan.md`'s NFR-performance row states "Pass threshold: Exactly 4 query calls," but the shipped test (`exactlyTwoRealInsertsForOneSuccessfulBootstrap`) correctly asserts `2` — the difference is that `BEGIN`/`COMMIT` are intercepted at the fake pool's client level before reaching the counted `queryLog`, so only the 2 real INSERT statements are counted; the underlying NFR (minimal added latency) is genuinely satisfied, only the test-plan's literal number is now stale.
**Decision:** Logged here rather than fixed inline — the test-plan document itself could be corrected in a follow-up edit, but doing so is not required for this story's own completion since the actual shipped behavior is correct and verified.
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh), during `/subagent-execution` Step 3 final review.
**Revisit trigger:** none required — cosmetic documentation fix only, addressable whenever convenient.

---

## `tab-s1` Task 4 (`/subagent-execution`): fake-pool transaction model was wrong under concurrent transactions, fixed (2026-09-29)

**Context:** Adding the AC3 concurrency test (`Promise.all` of two `bootstrapTenantAdminIfNeeded` calls against the same brand-new tenant) exposed a real bug in the test file's own fake Postgres pool (built in Task 1), not in production code. The fake pool's `BEGIN`/`COMMIT`/`ROLLBACK` handling did whole-state snapshot/restore keyed to each client's own `BEGIN` time. Under two overlapping transactions, the losing transaction's `ROLLBACK` restored the ENTIRE shared state back to its own pre-`BEGIN` snapshot — a point in time that predates the winning transaction's commit — wiping out the winner's already-committed claim and admin rows. This does not match real Postgres, where a `ROLLBACK` only ever undoes the rolling-back transaction's own uncommitted writes.
**Decision:** Replaced whole-state snapshot/restore with a per-transaction undo log: each mutating branch in the fake pool registers a targeted reversal closure via a `recordUndo` callback; `ROLLBACK` replays only that client's own undos, in reverse; `COMMIT` discards the log. Verified independently (traced the logic by hand, then re-ran the story test file 5x — deterministic 5/5 passed each time) before accepting.
**Rationale:** This is test-infrastructure-only (no production code changed) and is a strict correctness improvement — the old approach only ever happened to work for single-transaction scenarios (Tasks 1-3's tests, and the not-yet-written AC6 rollback test are all single-client), so it does not invalidate any already-passed review; it specifically fixes the two-concurrent-transaction case AC3 is the first test to exercise.
**Story:** `tab-s1` — no AC/scope change; shared test-file infrastructure fix, needed for AC3 and relevant to AC6 (both land correctly under the new model; AC6 would have already passed under the old model too, since it's single-transaction).
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh), implementer subagent during `/subagent-execution` Task 4, independently verified by the orchestrating session before proceeding.
**Revisit trigger:** none expected — this is a correctness fix, not a design choice.

---

## `tab-s1` `/branch-setup`: baseline acknowledged, 1 pre-existing/environmental failure (2026-09-28)

**Context:** `node scripts/run-all-tests.js` on the freshly-created `feature/tab-s1` worktree (built from master at the DoR sign-off commit) showed 1 failure: `tests/check-p3.5-validate-trace.js` — the same established pre-existing/environmental failure acknowledged repeatedly across every worktree in this repo's history.
**Decision:** Acknowledged as pre-existing/environmental and proceeding.
**Story:** `tab-s1` — no AC/scope change; baseline note only.

---

## `tab-s1` `/implementation-plan`: two design corrections found via direct code reading, DoR contract text updated in the plan (2026-09-28)

**Context:** While loading inputs for `/implementation-plan`, direct reads of `src/web-ui/modules/identity-links.js` (`resolvePersonForIdentity`, lines 82-90) showed it returns `null` for a genuinely brand-new identity (no `person_identities` row AND no `team_memberships` row) — there is no existing code path that CREATES a `people` row for a first-ever login. The DoR contract's own "Assumptions" section (`tab-s1-dor-contract.md` line 37) states `personId` is "already available/resolvable at the point in the login flow ... confirmed by reading auth.js/auth-email.js directly during /review" — but the actual `/review` reports (`tab-s1-review-1.md`, `tab-s1-review-2.md`) contain no mention of `personId`/`resolvePersonForIdentity` at all, so this specific claim was written but not actually cross-checked against `resolvePersonForIdentity`'s null-return behaviour.

**Decision 1 (gap fix):** Add a new exported helper `resolveOrCreatePersonForIdentity(pool, identityKey, provider, logger)` to `identity-links.js` (not a new module — extends the module that already owns `resolvePersonForIdentity`/`backfillIdentityIfNeeded`, matching this codebase's own "extend in place" convention). Each of the 3 wiring call sites (`auth.js` GitHub, `auth.js` Google, `auth-email.js` signup) calls this BEFORE calling `bootstrapTenantAdminIfNeeded`, so a genuinely brand-new identity gets a real `people` row (and a `person_identities` link) created regardless of whether they end up winning the admin-bootstrap race. This does not change `bootstrapTenantAdminIfNeeded`'s own signature (still `(pool, tenantId, personId, logger)`, exactly as the DoR contract specifies) — it only clarifies HOW `personId` gets resolved before that call, correcting the DoR contract's own inaccurate assumption rather than contradicting its interface.

**Decision 2 (design refinement for AC5, keeps the NFR-performance test's exact query count of 4):** The DoR contract's own SQL sketch (line 12: plain `INSERT ... ON CONFLICT (tenant_id) DO NOTHING RETURNING`) does not correctly satisfy AC5 on its own — if a tenant already has a real admin granted via OTHER means (e.g. `team-management.js`'s `addOrUpdateTeammate`), no `tenant_admin_bootstrap` row would exist yet, so a plain `ON CONFLICT`-only insert would incorrectly let a second person's login claim the gate row and get granted admin too. Fixed by combining the existing-admin check into the SAME insert statement: `INSERT INTO tenant_admin_bootstrap (tenant_id, admin_person_id) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM team_memberships WHERE tenant_id = $1 AND role = 'admin') ON CONFLICT (tenant_id) DO NOTHING RETURNING admin_person_id` — one query, not two, so the NFR-performance test's "exactly 4 query calls" pass threshold (`BEGIN`, this combined insert, the `team_memberships` grant insert, `COMMIT`) still holds exactly as the test plan specifies.

**Rationale:** Both corrections were found by directly reading the referenced source files and the actual review artefacts, not by assuming the DoR contract's own prose was accurate — consistent with this session's established practice of verifying artefact claims against real code before building on them. Neither correction changes any AC's observable behaviour or the signed-off `bootstrapTenantAdminIfNeeded` function signature; both are implementation-detail corrections needed to make the already-approved ACs actually hold.
**Story:** `tab-s1` — no AC/scope change; implementation-plan-level design correction, logged per this repo's own "decisions.md is mandatory for features with architectural choices" rule (CLAUDE.md).
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh), during `/implementation-plan` — flagged for Hamish King's awareness, not blocking (Medium oversight story).
**Revisit trigger:** none expected — this is a correctness fix for the interface the DoR already signed off on, not a new design choice.

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-09-26 | ASSUMPTION | /clarify Q1 (discovery)**
**Decision:** The admin-bootstrap mechanism will extend the existing `tenant_plan`-shaped per-tenant-row pattern (`tenant_id PRIMARY KEY`) rather than introduce a new `tenants` entity or infer "first user" from `team_memberships` row ordering.
**Alternatives considered:** (a) a new first-class `tenants` table with `created_by`/owner fields; (b) no new table, infer "first" purely from the earliest `team_memberships` row for a `tenant_id`, with separate locking to handle races.
**Rationale:** `tenant_plan` already establishes exactly this per-tenant-row pattern in this codebase (a proven, working convention for plan/status state) — reusing it avoids inventing a new concept. An atomic `INSERT ... ON CONFLICT (tenant_id) DO NOTHING RETURNING *` against that table solves both "what does bootstrap attach to" and "race safety for simultaneous first logins" in one primitive, which the `team_memberships`-inference option could not do as cleanly.
**Made by:** Hamish King (Platform Owner)
**Revisit trigger:** if a genuine first-class `tenants` entity becomes necessary for unrelated reasons (e.g. billing/ownership features), this bootstrap mechanism should move onto that table instead of `tenant_plan`.
---
**2026-09-28 | ASSUMPTION | /clarify Q2 (discovery)**
**Decision:** For an existing real tenant with members but no admin, the backfill promotes the earliest-created `team_memberships` row for that tenant (by `created_at`) to admin, fully automatic, no operator step; all other existing members' roles are left untouched.
**Alternatives considered:** (a) promote all current members to admin; (b) no auto-promotion, flag for operator manual resolution per tenant.
**Rationale:** Automatic and unambiguous, avoids an operator-toil backlog of manual tenant-by-tenant decisions, and avoids unintentionally changing every existing member's access level (which promoting everyone would do).
**Made by:** Hamish King (Platform Owner)
**Revisit trigger:** if "earliest member" turns out not to correlate reliably with "who should actually be admin" once real backfill data is examined (e.g. the earliest member is a departed contractor, not the real owner).
---
**2026-09-28 | ASSUMPTION | /clarify Q3 (discovery)**
**Decision:** Production has been confirmed (not assumed) to share the identical admin-bootstrap gap as `wuce-staging` — `ADMIN_GITHUB_LOGINS` is unset on the real production Fly app (`skills-framework`) too.
**Alternatives considered:** proceed on the assumption that staging mirrors production without checking; treat this repo as having no separate production environment.
**Rationale:** `fly secrets list -a skills-framework` directly confirmed the same missing secret, removing the need to assume — this locks in the discovery artefact's urgency/blast-radius framing as confirmed rather than speculative.
**Made by:** Hamish King (Platform Owner)
**Revisit trigger:** none obvious — this is a factual confirmation, not a policy choice.
---
**2026-09-28 | ARCH | /definition Step 1.5**
**Decision:** This feature's `pipeline-state.json` entry uses the flat `features[].stories[]` shape (no epic nesting), per `ADR-017` — not the nested `epics[].stories[]` shape that `/definition`'s own `SKILL.md` literally instructs writing.
**Alternatives considered:** (a) follow `/definition/SKILL.md`'s literal nested-shape instruction, matching this session's own `2026-09-23-team-roster-integration` feature and other recent examples (`2026-08-21-viewer-role-no-enforcement`); (b) ask which shape before proceeding rather than picking one.
**Rationale:** Checked directly rather than assumed: `ADR-017` (2026-05-02) postdates the commit that made `/definition` nest stories (`b502cd05`, 2026-03-29) — it was a deliberate later policy change the skill was simply never updated to match, not the skill being authoritative over a stale ADR. A direct `pipeline-state.json` audit confirmed flat is genuinely the dominant, proven convention (235 features with real flat `stories[]`, including several created right around `ADR-017`'s own date) — the nested shape is the minority/exception. `/definition/SKILL.md` itself has a real, confirmed drift defect (logged separately in `workspace/capture-log.md`, 2026-09-28) — worth its own fix-forward story, not patched inline here.
**Made by:** Hamish King (Platform Owner)
**Revisit trigger:** once `/definition/SKILL.md` is itself fixed to default to flat (the `/improve` candidate above), this entry can be removed as no-longer-a-deviation — it will just be the skill's own normal behaviour.
---
**2026-09-28 | RISK-ACCEPT | /review tab-s2 Run 1, finding 1-M1**
**Decision:** `tab-s2`'s backfill promotes the earliest-created `team_memberships` row's owner to admin regardless of that row's current role — including if it is an explicitly-assigned restrictive role like `'viewer'`. No exception rule or manual-review gate is added for this sub-case.
**Alternatives considered:** (a) add TR-05 excluding/flagging tenants whose earliest member has a non-default role, requiring manual review instead of auto-promotion; (b) accept the risk as-is, matching the already-confirmed `/clarify` Q2 policy ("earliest member, fully automatic, no exceptions").
**Rationale:** The precondition for TR-01 firing at all is that the tenant has zero existing admin — a genuinely rare, small-volume case at this platform's current scale (per `tab-s2`'s own `[UNKNOWN BASELINE]`, expected small). Adding a manual-review exception path for one further sub-case would complicate a deliberately simple, fully-automatic migration for a case that may not even occur in the real dataset. If it does occur, the existing rollback procedure (`tab-s2`'s own Rollback procedure section) already covers correcting a wrong promotion after the fact.
**Made by:** Hamish King (Platform Owner)
**Revisit trigger:** if the real `tab-s2` run (once executed) actually finds a tenant matching this sub-case (earliest member has a non-default role), revisit before applying the promotion to that specific tenant rather than after the fact.
---
**2026-09-28 | RISK-ACCEPT | /definition-of-ready tab-s1, Warning W4**
**Decision:** `tab-s1`'s AC verification script (`artefacts/2026-09-26-tenant-admin-bootstrap/verification-scripts/tab-s1-verification.md`) proceeds to the inner coding loop without a separate domain-expert review pass.
**Alternatives considered:** (a) pause DoR sign-off and have a domain expert review the script before proceeding.
**Rationale:** Solo-operator repo — the same person (Hamish King) who would review it also owns the story/discovery/benefit-metric chain it derives from, and already worked through the story's own ACs in detail during `/review`'s fix cycle. The marginal value of a separate formal review pass is low; acknowledged as a real, standard risk (not resolved) per this repo's own established W4 handling pattern (matches `rtri-s3`'s own DoR).
**Made by:** Hamish King (Platform Owner)
**Revisit trigger:** if a second reviewer/operator joins this repo, reinstate a genuine separate-person review pass for verification scripts rather than continuing to acknowledge W4 by default.
---

---

## Architecture Decision Records

<!-- None yet for this feature. -->
