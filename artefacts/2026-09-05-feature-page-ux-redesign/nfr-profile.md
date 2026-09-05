# NFR Profile: Feature-detail page UX redesign

**Feature:** 2026-09-05-feature-page-ux-redesign
**Created:** 2026-09-05
**Last updated:** 2026-09-05
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Page render time | No regression from current baseline (informal — page loads instantly today) | Manual comparison, pre/post-implementation | fpux.1 |
| Nav-path round-trip | No new network calls introduced | Code review at DoR/DoD | fpux.2 |

**Source:** Story AC — No performance SLOs defined beyond "do not regress the current, already-fast baseline." No formal throughput/load targets apply — this is a low-traffic internal/beta-evaluation page, not a high-volume production endpoint.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | Existing `/features/:slug` auth guard (302 to `/auth/github` when unauthenticated) is unchanged | `src/web-ui/routes/features.js` existing behavior | fpux.1, fpux.2 |
| Authorisation | No change — existing tenant-scoped artefact lookup unchanged | N/A — out of scope per discovery | fpux.1, fpux.2 |
| Input validation | Not applicable — no new user input surface introduced | N/A | fpux.1, fpux.2 |
| Secrets management | Not applicable — no new secrets/credentials involved | N/A | — |
| Audit logging | Existing `feature_artefacts_accessed` audit log call is unchanged | `src/web-ui/routes/features.js` existing behavior | fpux.1, fpux.2 |

**Data classification:**
- [x] Public — no PII, no sensitive data (this is pipeline/artefact metadata, not customer data)
- [ ] Internal
- [ ] Confidential
- [ ] Restricted

**Source:** No new security surface — this is a rendering/CX-layer initiative only, per discovery Out of Scope.

---

## Data residency

Not applicable — no data storage, transmission, or residency question is introduced by this feature; it is a presentation-layer change over existing, already-resident artefact metadata.

**Source:** Not applicable

---

## Availability

Not applicable — no new uptime, RTO, or RPO target applies. This page's availability is governed by the existing web-ui server's own SLA (not redefined by this feature).

**Source:** Not applicable — no change to availability characteristics.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| WCAG 2.1 AA | Contrast (1.4.3), keyboard operability (2.1.1), focus visibility (2.4.7) | `product/constraints.md` #9 — accessibility is a hard floor, not a performance NFR | fpux.1 |

**Named sign-off required?**
- [ ] Not required
- [x] Yes — the WCAG 2.1 AA conformance check (fpux.1 AC3/AC4) requires explicit sign-off at `/definition-of-ready`, per `CLAUDE.md`'s CSS-layout-dependent AC classification rule (automated Playwright visual-regression test, or RISK-ACCEPT + manual smoke test — decision made at DoR, not left unclassified).

_Compliance NFRs with named regulatory clauses require human sign-off before the story can proceed past `/definition-of-ready`. This is enforced as H-NFR in the DoR check._

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Accessibility tooling | No automated accessibility-scanning tool (e.g. axe-core) currently exists in this repo's toolchain — fpux.1's AC3/AC4 will be verified manually unless tooling is confirmed available at `/definition-of-ready` (platform-availability gate, D2-platform) | Hamish King | Before fpux.1's DoR sign-off |
| M3 target | Metric 3's target is intentionally left as "TBD" pending fpux.2's own audit — not a gap in this NFR profile, but tracked here so it isn't lost before DoR | Hamish King | Before fpux.2's DoR sign-off |
