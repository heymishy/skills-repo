# Discovery: Tenant Admin Bootstrap

**Status:** Draft — awaiting approval
**Created:** 2026-09-26
**Approved by:** [Name + date — filled in after human review]
**Author:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh), with Hamish King

---

## Problem Statement

There is no working path for any real tenant on this platform to ever have an admin, under the conditions that now actually exist in production — and the one thing that looks like a working mechanism is legacy code that predates the real (person-scoped) role system and no longer functions as intended.

1. **No tenant-creation/first-user bootstrap** exists in the current, real (`tir-s1`+) role system — nobody automatically becomes admin when a tenant is created.
2. **The only apparent bootstrap (`ADMIN_GITHUB_LOGINS` → legacy `user_roles` table → lazy-backfill) is effectively dead code for real tenants today.** It predates `tir-s1`'s person-scoped `team_memberships` model, was superseded by it, and only still fires for a person with zero membership rows — which real usage has made the rare case, not the common one. Confirmed live: it did nothing for the platform owner's own account.
3. **Even in the rare case it does fire, it's broken on its own terms** — it links a phantom, disconnected `people` row rather than the real person, so the grant doesn't reliably attach to anyone.
4. **There is no first-class, in-use admin-bootstrap path at all** — everything that exists is a pre-`tir-s1` relic nobody removed, not a working feature.

**Who experiences it:** any tenant's own admin candidate — solo developer or squad/tech lead — hits a bare `{"error":"Forbidden"}` with no recovery path. Confirmed live on `wuce-staging.fly.dev` today, even against the platform owner's own long-lived account.

**Cost when unresolved:** ~20 stories of shipped team-management/role investment (`tir-s1`–`tir-s9`, `wsi-s1`/`wsi-s6`, `rtri-s1`–`rtri-s4`) are unreachable for any real tenant, and the legacy code sitting in `user_roles`/`arl-s4`/`_backfillOne` continues to mislead anyone reading it into thinking a bootstrap mechanism exists.

## Who It Affects

1. **Developer / engineer (primary persona, per `product/mission.md`)** — a solo user on their own personal tenant. They're inherently the sole owner of that tenant, yet have no way to ever reach admin on it, so they can't manage their own team page, can't invite anyone, and can't reach role-scoped areas of the product that assume an admin exists.
2. **Tech lead / squad lead (primary persona)** — "owns delivery governance for a squad" per the mission doc. When onboarding a real squad, they need to invite teammates and assign roles via `/team/members`/`/team/invites/new` — but can't reach admin at all, so the squad's entire team-management surface is dead on arrival for them.
3. **Platform owner/operator (Hamish King)** — needs a reliable way to administer or support any given tenant. Today the only lever is manually editing a Fly secret keyed by GitHub login, which (as proven live in this session) frequently does nothing anyway.

## Why Now

Two concrete triggers, both from the same session:

1. **The `real-team-roster` epic (`rtri-s1`–`rtri-s4`) just completed the last piece of infrastructure needed to make team membership genuinely visible and usable** — a real roster read API, reliable identity backfill on login, and real UI rendering of the member list. Live-verifying that epic's own DoD claims is precisely what surfaced this gap: none of it is reachable, because nobody — not even the platform owner — can actually get to the admin-gated pages it depends on.
2. **The gap is actively worsening with time, not static.** The one legacy mechanism that could still work (`ADMIN_GITHUB_LOGINS`'s lazy-backfill) only fires for a person with zero `team_memberships` rows. As real usage accumulates, more accounts cross that threshold every week and become permanently locked out of ever reaching admin — this was a survivable gap when the role system was brand new and most tenants were empty; it isn't now.

**Process signal worth naming:** this was found by live-verifying a DoD claim in a real browser against real deployed state, not by automated tests — the test suites all pass because they use fake pools where an admin session is trivially mockable. "Can anyone in the real production database actually become admin" is an emergent property of real data state that no test fixture would ever model.

## MVP Scope

1. **A real "first user of a tenant becomes admin" mechanism**, wired into the current, actually-used role-resolution path (`resolveRoleForPerson`/`addOrUpdateTeammate`'s own conventions) — fired at genuine tenant-creation/first-login time, not a legacy side-table. Direction (via /clarify): extend the existing `tenant_plan`-shaped per-tenant-row pattern rather than invent a new entity; bootstrap via an atomic `INSERT ... ON CONFLICT (tenant_id) DO NOTHING RETURNING *`, which also handles the simultaneous-first-login race safely.
2. **A one-time backfill for existing real tenants** that currently have zero admin — needed precisely because this feature is arriving after the fact. Who specifically gets promoted (earliest member? tenant creator, if that's even trackable?) is a real open policy question, named here rather than decided.
3. **Retire the legacy path** — `user_roles` table, `ADMIN_GITHUB_LOGINS`, `arl-s4`'s seeding, and `_backfillOne`'s phantom-row creation — since it's superseded, partially broken, and actively misleading to leave in place once a real mechanism exists.

**What must be true for the first person who uses it to find it useful:** a brand-new solo developer signs up and, with zero operator intervention, can immediately reach `/team/members` and `/team/invites/new` as admin of their own tenant.

## Out of Scope

- **Admin transfer/demotion UI** — once a tenant has a working admin, letting them hand off or step down from admin is a separate feature, not needed to fix the "nobody can ever become admin" gap.
- **Perfect concurrency handling for simultaneous first-logins into a brand-new shared org tenant** (two people landing on the same never-before-seen `tenantId` at the same instant) — a real edge case, but not the common path; defer to "operator manually resolves if it ever happens" rather than building distributed-lock-level correctness for this pass.
- **Any change to non-admin role semantics** (engineer/product/viewer) or the pod-role vocabulary (`rtri-s2`) — this is scoped strictly to how admin gets bootstrapped, not the rest of the role model.
- **Any change to the invite/add-teammate flows themselves** (`team-invitations.js`, `client-invitations.js`) beyond removing the legacy admin-seeding path — those flows work correctly today and aren't part of this problem.
- **A broader dead-code audit of the rest of the codebase** — only the specific legacy path this problem touches (`user_roles`, `ADMIN_GITHUB_LOGINS`, `arl-s4`, `_backfillOne`) is in scope for removal, not a general legacy-code sweep. Flagged for a dedicated future review — logged in `workspace/capture-log.md` (2026-09-26) so it isn't lost.

## Assumptions and Risks

[RESOLVED via /clarify, 2026-09-26] There is no first-class `tenants` table with an owner/creator field, but `tenant_plan` (`tenant_id PRIMARY KEY`, `src/web-ui/server.js`) already establishes exactly this per-tenant-row pattern for plan/status state. Direction: extend that pattern (either a new column on `tenant_plan` or a sibling table with the same `tenant_id PRIMARY KEY` shape) rather than inventing a new entity or inferring "first" from `team_memberships`. The bootstrap itself is a single atomic `INSERT ... ON CONFLICT (tenant_id) DO NOTHING RETURNING *` — whoever's insert succeeds becomes admin; this is also the race-safety mechanism for simultaneous first-logins into a brand-new tenant, no separate locking needed. Exact schema (new column vs. sibling table) is a `/definition`-time implementation detail, not locked here.

[ASSUMPTION] For an existing tenant that already has multiple real members but zero admin, the backfill policy (who becomes admin — earliest member? all current members? something else?) is undecided. — unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] Whether any real production tenant (as opposed to this `wuce-staging` deployment) currently has a working admin is unconfirmed — only staging's Fly secrets were checked, not production's. — unconfirmed, requires /clarify before scope is locked.

**Risks:**
- Removing the legacy `user_roles`/`ADMIN_GITHUB_LOGINS` path could have blast radius beyond what's been traced so far — one comment marks it "unused in production after `tir-s1`," but this hasn't been exhaustively verified against every caller.
- What could make this not worth building: if real production already has a different, working admin-bootstrap path not yet found (i.e., this staging deployment is uniquely misconfigured rather than representative), the urgency shrinks substantially — worth confirming actual production tenant/admin coverage before committing significant build effort.

## Directional Success Indicators

**1. Time-to-admin for a brand-new solo signup**
Baseline: infinite / never — confirmed today, live: no automatic path exists at all.
Target: 0 seconds, fully automatic, no operator intervention required.
Measured via: a fresh signup integration test asserting `role === 'admin'` immediately after first login, for a tenant that has never existed before.

**2. % of real tenants with at least one working admin**
Baseline: [UNKNOWN BASELINE] — no DB read access to count this directly; needs a real query (`team_memberships` grouped by `tenant_id`, filtered `role = 'admin'`, cross-referenced against all distinct tenant_ids) before this can be stated numerically. Confirmed qualitatively: at least one real tenant (the platform owner's own) currently has zero.
Target: 100%.
Measured via: the same query, re-run post-fix.

**3. Manual admin-grant interventions needed (support-burden proxy)**
Baseline: effectively 100% of tenants today — the only route to admin currently requires an operator manually editing a Fly secret (and even then, as proven, often doesn't work).
Target: 0 — no tenant should ever need an operator to manually grant admin again.
Measured via: absence of any future `ADMIN_GITHUB_LOGINS`-related Fly secret edit or equivalent manual intervention after this ships.

## Constraints

- **No compliance frameworks apply** — confirmed via `.github/context.yml` (`meta.regulated: false`).
- **No first-class `tenants` table exists today** — `tenantId` is a derived string (GitHub login or resolved org name), not an entity with its own row. Whatever bootstrap mechanism gets designed has to work within that reality, or explicitly propose introducing one — that's a `/definition`-time design decision, not locked here.
- **Security-sensitive by nature** — this grants elevated (admin) access. Should get extra scrutiny at `/review` (this repo's own Category E security-finding class), same bar as any other authorization-boundary change.
- **New feature, flat story shape** — per this repo's own `ADR-017` (all new features use flat `features[].stories[]`; the `epics[].stories[]` nested shape used by `real-team-roster` is legacy, not to be repeated).
- No time, budget, or team-capability constraints named by the operator.

## Contributors

- Hamish King — Platform Owner / first beta user

## Reviewers

- [Name — Role]

## Approved By

[Name — Role — Date]

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- There is no first-class `tenants` table with an owner/creator field anywhere in this codebase — `tenantId` appears to be a derived string (GitHub login or resolved org name), not an entity with its own row.
- For an existing tenant that already has multiple real members but zero admin, the backfill policy (who becomes admin) is undecided.
- Whether any real production tenant (as opposed to this `wuce-staging` deployment) currently has a working admin is unconfirmed.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

---

**Next step:** Human review and approval → /benefit-metric
