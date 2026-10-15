# NFR Profile: Feature Playback Demo Package

**Feature:** 2026-10-07-feature-playback-demo-with-video-and-or-screens-
**Created:** 2026-10-15
**Last updated:** 2026-10-15
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Demo preparation time (engineer active input) | ≤45 minutes per package | Session timing signal from the playback skill (self-reported until instrumented) | `fpd-s1`, `fpd-s2` |
| Page / response time (viewer) | Not defined — no stakeholder-named SLO | — | `fpd-s3`, `fpd-s4` |

**Source:** Story AC (`fpd-s1`/`fpd-s2`'s own benefit linkage to M3) for demo preparation time; no SLO defined for the viewer's own response time.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | Viewer route requires the same session-based authentication as every other `src/web-ui/` route — no new auth mechanism | ADR-027 (ordinary application code) | `fpd-s3`, `fpd-s4` |
| Authorisation | Feature list and media scoped to the authenticated user's own tenant — no cross-tenant exposure | Existing multi-tenancy posture (ADR-025) | `fpd-s3`, `fpd-s4` |
| Data captured | Screenshots/video capture only what is already visible in the normal authenticated UI — no scrubbing mechanism introduced, no new data exposure beyond what the feature itself already renders | — | `fpd-s1`, `fpd-s2` |
| Input validation | Not applicable — this feature introduces no new write/mutating endpoint | — | — |
| Secrets management | Not applicable — no new secret or credential | — | — |
| Audit logging | None — every story in this feature is read-only (capture against an already-DoD-complete feature, or viewing already-captured media); no new mutating action anywhere in scope | — | All 4 stories |

**Data classification:**
- [x] Internal — non-public but low sensitivity (demo content reflects already-shipped, already-governed feature UI; same classification as the rest of this platform's own delivery artefacts — not PII, not commercially restricted)

**Source:** This repo's own existing multi-tenancy and session-auth conventions (ADR-025, ADR-027) — no new security surface introduced.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — all artefact files stay in the same repository/database already used by the rest of the pipeline; no new residency requirement introduced.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | — | No dedicated SLA — rides on the platform's existing availability posture |
| RTO | Not defined | — | |
| RPO | Not defined | — | No new data store; playback artefacts follow the same backup/recovery posture as the rest of `artefacts/` |
| Planned maintenance window | Not defined | — | |

**Source:** Business context — no stakeholder-named SLA for this feature.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None (current) | — | — | — |

**Named sign-off required?**
- [x] Not required — `meta.regulated: false` per `.github/context.yml`; discovery names only a *conditional future* compliance concern (screen-recording restrictions in a regulated environment), not a current obligation this feature exists to satisfy. Revisit if/when a regulated tenant actually adopts this skill, per `benefit-metric.md`'s own Tier 3 check.

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Accessibility (video) | Captions/transcript generation mechanism's own accuracy is not yet specified — `fpd-s2`'s own AC3/AC5 require human review before a package ships, but no accuracy threshold is set | Engineer implementing `fpd-s2` | At `/definition-of-ready` for `fpd-s2` |
| Performance (viewer) | No response-time SLO defined for `fpd-s3`/`fpd-s4` — acceptable for MVP given no stakeholder-named requirement, but worth a baseline measurement once the viewer is live | Platform Owner | Post-MVP, informational |

_Accessibility is addressed as a mandatory, non-optional constraint (see `fpd-s2`'s own NFR section) — WCAG AA baseline, not a gap in coverage, only in accuracy-threshold specification._
