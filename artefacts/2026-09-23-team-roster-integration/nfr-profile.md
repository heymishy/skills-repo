# NFR Profile: Wire Pod/Team Pickers to the Real Team Roster

**Feature:** 2026-09-23-team-roster-integration
**Created:** 2026-09-23
**Last updated:** 2026-09-23
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Real-roster read (function + endpoint) response time | Well under 1s for any realistic tenant member count | Manual timing during live validation; no dedicated timing assertion (matches this app's own established RISK-ACCEPT pattern for comparably-shaped synchronous NFRs) | rtri-s1 |
| Pod-creation modal roster fetch | No perceptible added delay vs. today's static-array render | Live Chrome check on staging | rtri-s2 |
| `/team/members` page render | No meaningful change from one additional indexed query | Live Chrome check on staging | rtri-s3 |

**Source:** Story AC / established pattern from `ep4-s1`'s own comparable NFRs

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | New endpoint reuses this app's existing `authGuard` — no new auth mechanism | This app's established `authGuard` convention | rtri-s1 |
| Authorisation / tenant isolation | Every read strictly scoped by `tenant_id` | ADR-025 | rtri-s1, rtri-s2, rtri-s3 |
| Input validation | Not applicable — no new user-supplied input in this feature (all 3 stories are read paths over already-validated, already-written data) | N/A | — |
| Secrets management | Not applicable — no secrets introduced | N/A | — |
| Audit logging | Not applicable — read-only; the write path (invite/add-teammate) this feature displays is unaffected and remains unaudited as it is today | N/A | — |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

Real identity values (GitHub login / email) are already stored and already read elsewhere in this app (`req.session.login`, `person_identities.identity_key` via `resolveRoleForPerson` and others) — this feature adds no new category of data, only a new read path over data that already exists.

**Source:** ADR-025 / this app's own existing identity-handling convention

---

## Data residency

**Not applicable** — no new data storage, no new region/boundary requirement; reuses existing tables with their existing (unmodified) residency characteristics.

**Source:** Not applicable

---

## Availability

**Not applicable** — no new infrastructure, no new SLA. This feature is entirely a read-path addition within the existing web-ui process; availability characteristics are identical to every other read-only route in this app.

**Source:** Not applicable

---

## Compliance

**No compliance frameworks apply.** Confirmed against `.github/context.yml` (`meta.regulated: false`) and the discovery artefact's own Constraints section, which names no regulatory obligation.

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## NFR AC blocks

No dedicated performance/security/data-residency AC blocks were added to the individual stories beyond what's already stated in each story's own NFR section — all 3 stories are low-risk, read-only, reuse-of-existing-pattern work where a dedicated timing/security AC would test infrastructure noise rather than this feature's own logic (matching this codebase's own established precedent for identically-shaped stories).

---

## Gaps and open questions

No NFR gaps identified at 2026-09-23.
