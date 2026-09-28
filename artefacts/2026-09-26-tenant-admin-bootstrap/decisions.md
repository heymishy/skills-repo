# Decision Log: tenant-admin-bootstrap

**Feature:** Tenant Admin Bootstrap
**Discovery reference:** artefacts/2026-09-26-tenant-admin-bootstrap/discovery.md
**Last updated:** 2026-09-28

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
