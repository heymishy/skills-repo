# Consumer Registry

<!--
  PURPOSE: Tracks adoption of a new service, API, or library version across
  all downstream consumers. Used in library rewrite and service replacement
  programmes to ensure no consumer is left behind.

  This file lives at:
  artefacts/[programme-slug]/consumer-registry.md

  Created by /programme (Step 5) when programme type is "service or library rewrite".
  Updated as consumers migrate. Referenced by /release when producing
  compliance bundles — all consumers must be at an acceptable state before
  the source system can be decommissioned.
-->

**Programme:** [Programme name]
**Service / library being replaced:** [Name and current version]
**Target version:** [New version]
**Decommission target date:** [Date after which the old service/library will be removed]
**Registry owner:** [Name and role]
**Last updated:** [YYYY-MM-DD]

---

## Breaking changes in the new version

<!--
  List breaking changes consumers must absorb. Each item should be specific
  enough that a consumer team can assess their own impact without additional
  context.
-->

| Change ID | Type | Description | Migration guidance |
|-----------|------|-------------|-------------------|
| BC-01 | [e.g. API contract] | [e.g. /v1/accounts endpoint removed — use /v2/accounts] | [e.g. See migration guide: reference/migration-guide.md] |
| BC-02 | [e.g. Auth scheme] | [e.g. API key auth removed — OAuth2 only] | [e.g. Credentials migration guide: reference/auth-migration.md] |
| BC-03 | [e.g. Response schema] | [e.g. status field renamed to account_status] | [e.g. Search and replace in consumer codebase] |

---

## Consumer status

<!--
  One row per consumer. Update status as consumers migrate.

  Status values:
  - Not started — consumer has not begun migration
  - In progress — migration story exists and is in the pipeline
  - Testing — migrated to new version in non-prod
  - Ready — migrated and signed off in prod or pre-prod
  - Blocked — migration started but blocked (see notes)
  - Deferred — agreed exception — will not migrate by decommission date (needs approval)
  - Decommissioned — consumer itself has been decommissioned

  Impact:
  - None — no breaking changes affect this consumer
  - Low — 1 breaking change, minor code change required
  - Medium — 2–3 breaking changes, non-trivial migration
  - High — 4+ breaking changes or architectural change required
-->

| Consumer | Team | Impact | Breaking changes | Status | Target date | Sign-off | Notes |
|---------|------|--------|-----------------|--------|------------|---------|-------|
| [consumer-name] | [team] | [High/Med/Low/None] | [BC-01, BC-03] | [Not started] | [YYYY-MM-DD] | — | |
| [consumer-name] | [team] | [High/Med/Low/None] | [BC-02] | [In progress] | [YYYY-MM-DD] | — | |

---

## Sign-off criteria

A consumer is marked **Ready** only when:

1. Migration story is DoD-complete (PR merged, ACs verified)
2. Consumer has validated in [environment] environment
3. [Named role from the consumer team] has confirmed readiness in writing
4. No open HIGH findings in consumer's migration review

**Sign-off record:**

| Consumer | Sign-off name | Role | Date | Method |
|---------|---------------|------|------|--------|
| [consumer-name] | [name] | [role] | [YYYY-MM-DD] | [PR comment / email / Jira] |

---

## Deferred consumers

<!--
  Consumers who will not migrate by the decommission date.
  Each deferral requires explicit approval — it represents a risk to decommission.
-->

| Consumer | Reason | Approved by | New target date | Risk accepted |
|---------|--------|------------|----------------|--------------|

---

## Decommission gate

The source service/library **cannot be decommissioned** until:

- [ ] All consumers at status **Ready** or **Decommissioned**
- [ ] All deferred consumers have approved extensions recorded above
- [ ] No consumer at status **Blocked** without a signed-off resolution plan
- [ ] Programme lead has confirmed decommission readiness
- [ ] Decommission story is DoD-complete

**Decommission sign-off:**
Name: [Name]
Role: [Role]
Date: [YYYY-MM-DD]
