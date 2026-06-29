# Decisions — WUCE Multi-Tenancy

**Feature slug:** wuce-multi-tenancy
**Last updated:** 2026-06-29

---

## Regulated constraint propagation check (Step 4a)

No regulated constraints (PCI-DSS, GDPR, SOX, HIPAA, or equivalent) were identified in the discovery Constraints section. The constraints are operational/security (C1–C6): solo-founder operability, accessToken strip-before-write, path-traversal guard preservation, phase independence, chain-hash trace preservation, and infra governance. None of these reference an external compliance framework or a third-party assessment gate.

Step 4a is not applicable. No trigger table required.

---

## Decision 1 — Legacy journey permissive access policy

**Date:** 2026-06-22
**Context:** Journeys created before Phase 0 have `ownerId: null` (set by the existing `createJourney()` path, which does not set `ownerId`). After the authorization guard is wired, these journeys would be unreachable unless explicitly handled.
**Decision:** Legacy journeys (ownerId null) remain accessible to any authenticated user in Phase 0 and Phase 1. This is the permissive legacy behaviour. When Phase 1 populates `tenantId` on journeys at create time, newly created journeys have the tenant boundary enforced; legacy journeys retain the null-ownerId passthrough.
**Rationale:** Solo-developer deployment — all pre-Phase-0 journeys belong to one user and there is no cross-user risk in practice. Silently blocking access to all pre-existing journeys at Phase 0 would break in-flight work with no warning and no migration path.
**Applies to:** p0.1 AC1, p1.2 AC4.

---

## Decision 2 — Multi-org membership: first allowlist match wins

**Date:** 2026-06-22
**Context:** Discovery OQ5 — if a user belongs to two orgs in the allowlist, which one becomes their tenantId?
**Decision:** First match in `TENANT_ORG_ALLOWLIST` order (not GitHub org response order).
**Rationale:** Operator-controlled priority (allowlist order is set by the operator, not by the user). Deterministic and reproducible across API responses.
**Applies to:** p1.1 AC5.

---

## Decision 3 — Tenant directory provisioning is operator-manual

**Date:** 2026-06-22
**Context:** Phase 2 requires `WUCE_TENANT_ROOT_BASE/${tenantId}/` to exist before a tenant can use the platform. Should the platform auto-create the directory on first use?
**Decision:** Operator creates the directory manually before onboarding a tenant. The platform reads from it but does not create it.
**Rationale:** Auto-creation without validation risks writing data to an unexpected location if `tenantId` resolution is misconfigured. Solo-founder context — onboarding a new tenant is a deliberate operator action; a directory creation step is appropriate friction.
**Applies to:** p2.1 out-of-scope section.

---

## Decision 4 — In-memory journey store is NOT namespaced in Phase 2

**Date:** 2026-06-22
**Context:** The in-memory `_journeys` Map in `journey-store.js` holds all journeys for all tenants in a single Map (keyed by UUID). Phase 2 could namespace this Map by tenantId.
**Decision:** Do not namespace the in-memory store in Phase 2. The authorization guard + `isSameTenant()` enforces HTTP-layer isolation. The in-memory store is replaced by Postgres in Phase 3; namespacing a temporary in-memory structure that will be replaced adds complexity with no durable value.
**Rationale:** The journeyId is a UUID — guessing another tenant's journeyId in-memory is not the attack vector. The attack vector is the HTTP layer, which is already guarded. Phase 3 Postgres is the right place to enforce storage-layer isolation.
**Applies to:** p2.1 out-of-scope section.

---

## Decision 6 — MEDIUM review finding acknowledgement: benefit coverage matrix gap

**Date:** 2026-06-22
**Context:** All 8 story reviews raised finding M1 (MEDIUM): the benefit coverage matrix was absent from `benefit-metric.md`. Definition SKILL.md Step 5 requires this matrix to be populated after all stories are written; that step was omitted during the definition run.
**Decision:** Add the `## Metric coverage matrix` section to `benefit-metric.md` immediately — before any story proceeds to DoR. The gap was a definition-step omission, not a story defect; the per-story metric linkage fields were complete. The fix was applied on 2026-06-22 alongside the /review run.
**Rationale:** The fix is one additive section in one file with no impact on story scope, ACs, or test plans. It is the correct path forward; blocking all 8 stories until a separate definition re-run would add overhead with no quality benefit.
**Applies to:** All 8 story review reports (findings 1-M1 through 8-M1). RESOLVED — matrix now present in benefit-metric.md.

---

## Decision 5 — Slicing strategy: risk-first across all 6 stories

**Date:** 2026-06-22
**Context:** Discovery identified a live security bug (Phase 0), then identity boundary (Phase 1), then storage isolation (Phase 2). Multiple slicing strategies considered.
**Decision:** Risk-first — Phase 0 closes the highest-risk item (active exploit possible today), Phase 1 adds identity (medium risk, no infra change), Phase 2 adds storage isolation (lowest risk of the three, infra change required).
**Rationale:** Phase 0 can ship today with no dependencies. Phases 1 and 2 have sequencing dependencies. Risk-first naturally produces the correct phase ordering.
**Applies to:** All 3 epics.

---

## Decision 7 — RISK-ACCEPT: Phase 3 (Redis) waived as p4.1 prerequisite

**Date:** 2026-06-24
**Context:** p4.1 story originally listed p3.1 (Postgres) and p3.2 (Redis) as hard prerequisites. Phase 3 has been deferred indefinitely. p4.1's own out-of-scope section and test plan both state "in-process Map is sufficient for Phase 4."
**Decision:** RISK-ACCEPT — proceed with p4.1 using in-process Map for rate-limit counters. Phase 3 dependency removed as a hard gate.
**Rationale:** The two stated reasons for the Phase 3 dependency are (a) "prompt-cache session persistence is more meaningful once sessions survive restarts" — meaningfulness, not a hard technical requirement; and (b) "rate-limit counter should use Redis for correctness across restarts" — correctness-preference acknowledged and accepted. Counters reset on server restart; for current solo-founder deployment profile this is acceptable. When Phase 3 ships, the rate-limiter key can be wired to Redis with no AC changes.
**Applies to:** p4.1 W1.

---

## Decision 9 — OQ7 resolved: Neon free tier (Postgres) + Upstash (Redis)

**Date:** 2026-06-29
**Context:** OQ7 (Phase 3 vendor selection) was originally unresolved pending operator research. The initial recommendation in `reference/oq7-vendor-recommendation.md` proposed Fly Postgres + Upstash Redis, based on a narrow comparison of Fly's own offerings. The operator conducted independent research after OQ7 was published.
**Decision:** Neon free tier for Postgres; Upstash Redis unchanged.
**Rationale:** Neon free tier is the better fit for a small-friends beta at this stage:
(1) Genuinely free — no trial expiry, no 7-day pause (unlike Supabase free), no flat monthly commitment (unlike DigitalOcean $15/month or Fly Managed $38+/month).
(2) Cold starts (few-hundred ms after idle) are acceptable at beta usage patterns — sporadic sessions from 5–10 people; imperceptible versus a pipeline session that takes minutes.
(3) Sidesteps backup-discipline burden — managed service handles backups without operator cron jobs.
(4) Migration path is clean: Neon → DigitalOcean $15/month is a connection-string swap when cold starts become user-felt. No schema changes required.
Upstash Redis stands — serverless per-request pricing remains the right fit for sporadic beta traffic.
**Data residency note:** NZ-based beta users; no EU-resident data expected; Schrems II / CLOUD Act exposure noted but not a blocking concern for this deployment profile.
**Upgrade trigger:** Cold starts become noticeable to users, or data exceeds 3 GiB. Next tier: DigitalOcean Managed Postgres $15/month.
**Applies to:** Sprint 1 (p3.1 Postgres adapter, p3.2 Redis adapter, p3.3 concurrency tests). Phase 3 stories are now unblocked.

---

## Decision 8 — RISK-ACCEPT: cache-scope embedding via system-prompt comment

**Date:** 2026-06-24
**Context:** Anthropic's prompt-caching mechanism hashes content — there is no named key parameter. To prevent cross-tenant cache hits when two tenants send structurally identical system prompts, the tenantId-sessionId scope string must appear in the prompt content itself.
**Decision:** RISK-ACCEPT — embed `<!-- cache-scope: ${tenantId}-${sessionId} -->` as the first line of the system prompt in `_anthropicSystem()` when tenantId is present. The comment is inert to model behaviour (HTML comments in plain-text prompts are treated as literal text, but a one-line prefix has negligible effect on model output). Session threading into the call stack is deferred; the scoping logic is implemented and ready to activate when session is passed through.
**Rationale:** Embedding a tenant discriminator in the prompt content is the only available mechanism with the Anthropic ephemeral cache_control API. The risk of a cross-tenant cache hit without this guard is real for identical system prompts across tenants (unlikely but possible). The implementation is complete in `_anthropicSystem()` and `buildCacheKey()`; activation requires threading `session` through the call chain in a follow-up.
**Applies to:** p4.1 W2.

---

## Decision 11 — Production hotfix: default SKILL_EXECUTOR_PROVIDER to anthropic

**Date:** 2026-06-29
**Context:** During s4.1 beta deployment execution, the first journey start attempt returned `sse_error: Copilot API HTTP 400 model_not_supported` for `claude-sonnet-4-6`. The code defaulted to the copilot provider when `SKILL_EXECUTOR_PROVIDER` was unset; the GitHub Copilot Chat Completions API does not support Claude 4.x model IDs. `.env` comments already noted that "Anthropic enforces budget_tokens correctly; GHCP does not, causing thinking overflow" — Anthropic direct was always the intended production provider.
**Decision:** Change the hardcoded fallback in `skill-turn-executor.js` from `'copilot'` to `'anthropic'`. Copilot remains available as an explicit opt-in via `SKILL_EXECUTOR_PROVIDER=copilot`. Applied as a production hotfix (commit `8c21dcd`) without a preceding DoR; retroactive story s4.3 created post-implementation.
**Rationale:** The code change is 3 lines (string default), low risk, and immediately unblocked the s4.1 smoke test. Blocking on a full artefact chain before fixing a broken beta deployment was disproportionate. The retrospective story (s4.3) satisfies the artefact-first rule post-facto.
**Applies to:** `src/modules/skill-turn-executor.js`, `tests/check-wuce26-per-answer-model-response.js` (T9/T10 provider pin), `.env.example` (new provider section).

---

## Decision 10 — MEDIUM review finding acknowledgement: sprint story template compliance gaps (s3.1–s5.1)

**Date:** 2026-06-29
**Context:** The /review run for all five sprint stories (s3.1, s3.2, s4.1, s4.2, s5.1) raised identical MEDIUM findings: missing Discovery reference link, Benefit-metric reference link, Benefit Linkage section with named metric, Architecture Constraints section, and NFRs section. These gaps arose because the sprint stories were written as operator-execution checklists without the full story.md template structure.
**Decision:** All five gaps resolved before DoR sign-off by updating the story artefacts to add the missing sections. The fixes are additive (no AC or scope changes): Discovery/Benefit-metric references added to headers; Metric Linkage updated to name M1/M2; Architecture Constraints and NFRs sections added referencing nfr-profile.md. RESOLVED — all sections now present in s3.1–s5.1.
**Rationale:** Adding missing template sections does not change story scope or ACs. Blocking all 5 stories at DoR pending a separate review re-run would add overhead with no quality benefit; the gaps are structural (template compliance) not substantive.
**Applies to:** s3.1-review-1.md, s3.2-review-1.md, s4.1-review-1.md, s4.2-review-1.md, s5.1-review-1.md — findings M1–M5 in each.
