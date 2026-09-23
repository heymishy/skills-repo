## Benefit Metric: Wire Pod/Team Pickers to the Real Team Roster

**Discovery reference:** artefacts/2026-09-23-team-roster-integration/discovery.md
**Date defined:** 2026-09-23
**Metric owner:** Hamish King — Operator/Product Owner
**Reviewers:** Hamish King — Operator/Product Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a straightforward integration fix — wiring two existing UI pickers to an already-real, already-shipped data source. It is not testing a hypothesis about tooling, process, or team capability.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Real pod membership

| Field | Value |
|-------|-------|
| **What we measure** | The proportion of `pod_members` rows whose `user_id` matches a real `person_identities.identity_key`, among rows for pods created *after* this feature ships (pre-existing pods, all created against the fictional `ORG_ROSTER` fixture, are explicitly excluded from this measurement per the discovery's own flagged risk — they are not expected to self-correct) |
| **Baseline** | 0% — confirmed by direct inspection: every `pod_members.user_id` value in this app today is one of the 3 hardcoded `ORG_ROSTER` ids (`hamish-uuid`, `susan-uuid`, `darren-uuid`) or the pod-creator placeholder (`me-uuid`), none of which resolve to any real `person_identities` row |
| **Target** | 100% — every pod created after this ships references only real, resolvable identities |
| **Minimum validation signal** | ≥1 real pod created with a real identity, verified by a real product owner using the real, already-invited `team_memberships` roster (not a synthetic test) — proves the picker is genuinely reachable and usable end-to-end, not just passing automated tests |
| **Measurement method** | A direct query comparing `pod_members.user_id` against `person_identities.identity_key` for pods with `created_at` after this feature's merge date. Measured by the metric owner, spot-checked at first real usage and again 2 weeks after release. |
| **Feedback loop** | If the minimum signal isn't hit within 2 weeks of release (no real pod created via the real picker), the metric owner investigates whether the new fetch endpoint or picker wiring has a real-world blocker (e.g. a tenant with zero `team_memberships` rows sees an empty picker with no guidance) and decides whether to patch the UX or treat it as expected given current real-user volume. |

### Metric 2: `/team/members` shows a real, accurate list

| Field | Value |
|-------|-------|
| **What we measure** | Whether `/team/members` renders every real `team_memberships` row for the viewing tenant, by identity and role |
| **Baseline** | 0 — confirmed by direct inspection: the page currently renders only an add-teammate form, no list of existing members at all |
| **Target** | The page renders 100% of the tenant's real `team_memberships` rows (minus any silently-skipped unresolvable-identity rows, per the discovery's own resolved design decision) |
| **Minimum validation signal** | The page renders at least the correct COUNT of real members for a tenant with 1+ real `team_memberships` rows (proves the join/query is wired correctly, even before visual polish is assessed) |
| **Measurement method** | Direct inspection of the rendered page against the tenant's known `team_memberships` row count. Measured by the metric owner at first release and after any future change to the invite/add-teammate flow. |
| **Feedback loop** | If the rendered count doesn't match the real row count, the metric owner treats this as a release-blocking regression (not a soft miss) — the page's entire purpose is showing an accurate roster. |

---

## Metric Coverage Matrix

<!-- Populated by /definition after stories are created. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Real pod membership | *(pending /definition)* | Gap — to be filled at /definition |
| `/team/members` shows a real list | *(pending /definition)* | Gap — to be filled at /definition |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts (`/definition`)
- Implementation approach — the new endpoint's exact shape, the query's exact SQL — that is `/definition` and the coding stories themselves
- Sprint targets or velocity — these metrics are outcome-based, not output-based
- Any metric for `ep4-s2` (paused, separate story, resumes once this feature ships)
