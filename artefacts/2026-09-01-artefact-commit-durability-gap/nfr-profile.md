# NFR Profile: Completed Stages Can Silently Lack Durable Git Backing

**Feature:** 2026-09-01-artefact-commit-durability-gap
**Created:** 2026-09-02
**Last updated:** 2026-09-02
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Stage-completion latency | No meaningful increase over current behaviour — the resolve-then-commit sequence already runs synchronously before `completeStage()` | Manual comparison of stage-completion response time before/after, spot-checked | acdg-s1 |
| Logging/PostHog overhead | Fire-and-forget — must not block or add latency to the stage-completion response | Code review confirms `_logCrossChannelEvent` calls are not awaited in the response-blocking path, matching `ep1-s5`/`ep1-s6`'s established pattern | acdg-s2 |

**Source:** Story AC / established repo pattern (`ep1-s5`, `ep1-s6`)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Secrets management | No new credential handling — continues using `req.session.accessToken` exactly as `das-s1` already does | `product/constraints.md` #12 (credentials structural, never in agent environment) — no change to how credentials flow | acdg-s1 |
| Audit logging | Every stage-completion commit attempt (succeeded/failed/skipped) is logged with `featureSlug`/`stage`/`eventType`/`timestamp`/`reason` — no credentials or full artefact content in the log line | This story's own AC1–AC4 | acdg-s2 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

<!-- operatorId (GitHub login, when present via the shared _logCrossChannelEvent
     helper's existing convention) is the only potentially-identifying field --
     same classification ep1-s5/ep1-s6 already used for the identical field. -->

**Source:** Established repo pattern (`ep1-s5`, `ep1-s6`) / `product/constraints.md` #12

---

## Data residency

Not applicable — no new data storage introduced. Log lines go to existing server stdout and the existing PostHog integration, both already in use by every other story in `new-feature-af17f555`.

**Source:** Not applicable

---

## Availability

No availability SLA changes. This feature does not introduce new infrastructure or change deployment topology — it corrects existing in-process error-handling logic and adds logging calls within an already-running request path.

**Source:** Not applicable

---

## Compliance

No named regulatory framework or compliance obligation applies to this feature. The discovery artefact's Constraints section names no compliance framework, and `context.yml`'s `meta.regulated` is `false` for this repo.

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance | No formal latency budget was defined in the discovery (constraint is qualitative — "no meaningful increase") — acceptable given this is an internal reliability fix, not a customer-facing performance-sensitive path | Hamish King | Revisit only if a real regression is observed post-deploy |

_No compliance or data-residency gaps identified at 2026-09-02._
