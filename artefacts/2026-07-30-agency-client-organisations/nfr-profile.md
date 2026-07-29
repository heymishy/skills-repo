# NFR Profile: Agency and Client organisation subtypes

**Feature:** 2026-07-30-agency-client-organisations
**Created:** 2026-07-30
**Last updated:** 2026-07-30
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Organisation resolution latency | At most 1 additional indexed lookup added to the existing OAuth login path | Query plan review at code review time | Story 1 |
| Grant-check lookup cost | At most 1 additional indexed query per protected route, matching existing tenant-scoping guard's cost profile | Query plan review; load test if a route shows regression | Story 2 |
| Comment list retrieval | Batched read, no N+1 query pattern | Code review against `_getArtefactCountsBulk`'s established batched-read precedent | Story 5 |

**Source:** Story ACs (no formal SLA exists for this feature — `product/constraints.md` does not define one for the SaaS web-ui product surface).

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | Dual-path: GitHub OAuth (unchanged for Agency/Standalone) or single-use, time-limited email magic-link (Client-org only) | ADR-025 (application-layer tenant scoping) | Story 4 |
| Authorisation | Read-only grant enforcement scoped per Agency-Client relationship; 404 (not 403) on unauthorised access; immediate revocation | ADR-025; this codebase's existing FORBIDDEN-vs-NOT_FOUND policy (`middleware/journey-access.js`) | Story 2, Story 5 |
| Input validation | Server-side `org_type` check on the create-client flow (not client-side only); form validation on org name | Existing `handlePostProductNew`-style validation conventions | Story 3 |
| Secrets management | Magic-link tokens are single-use, time-limited, and never logged in plaintext | Analogous to `product/constraints.md` #12 (credentials are structural, never logged) | Story 4 |
| Audit logging | Organisation creation, grant creation/revocation/denied-access, client creation/invitation, magic-link requests/redemptions, comment creation, and org conversion are all logged with actor, resource, and timestamp | This codebase's existing PostHog/audit-log conventions | Stories 1, 2, 3, 4, 5, 6 |

**Data classification:**
- [x] Confidential — PII (invited client email addresses) and commercially sensitive data (agency work product shared with clients, subject to the exact cross-org leak risk this feature's access model exists to prevent)

**Source:** Story ACs; ADR-025 (`.github/architecture-guardrails.md`).

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — discovery.md's Constraints section states "None identified"; no jurisdictional requirement was named.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | No SLA agreement or business context requiring a specific availability target was identified for this feature. |

**Source:** Not defined.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required

`context.yml` marks this repo `regulated: false`; discovery.md named no compliance framework or regulatory obligation.

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Security — Story 2's access-control review | This is the epic's highest-risk story (many-to-many relationship, per-relationship grant scoping, no precedent in this codebase). Recommend closer-than-default review at `/review` and `/definition-of-ready`, given this codebase's own prior cross-tenant access bug (`bri-s3.4`). | Hamish King — Product/Platform Owner | Before Story 2 proceeds past `/definition-of-ready` |
