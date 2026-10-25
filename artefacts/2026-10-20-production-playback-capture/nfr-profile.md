# NFR Profile: Production Playback Capture

**Feature:** 2026-10-20-production-playback-capture
**Created:** 2026-10-21
**Last updated:** 2026-10-26
**Status:** Verified at 2026-10-23 for `ppc-s1`–`ppc-s3` (all reached `/definition-of-done` with every NFR row addressed and evidenced); `ppc-s4` NFR rows verified at its own DoD (2026-10-25); `ppc-s5`/`ppc-s6` rows added at `/definition` (2026-10-25), refined by a CX/UX spike (2026-10-26, see `spikes/cx-ux-playback-pattern-outcome.md`); `ppc-s7` rows added at `/definition` (2026-10-26), same spike — none of `ppc-s5`/`ppc-s6`/`ppc-s7` verified yet, pending their own DoD.

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Single-AC capture time | No fixed SLA — expected a few seconds based on `rpca`'s proven per-screenshot timing | Observed during implementation | `ppc-s1` |
| Full-feature capture time | No fixed SLA yet — ~30-60s is the named threshold for revisiting sync vs. async | Real wall-clock measurement recorded as DoD evidence (story AC3) | `ppc-s2` |
| Rate-limiter overhead | Negligible — matches existing `sign-off.js` usage | Consistent with existing `createRateLimiter` implementation, no new infra | `ppc-s3` |
| Video-inclusive capture-all duration | Not yet defined — `ppc-s2`'s 30-60s threshold was sized for screenshot-only capture; `ppc-s5` must measure real video-inclusive duration and confirm/revise the threshold | Real wall-clock measurement recorded as DoD evidence | `ppc-s5` |
| Video page-render load (distinct from capture-time) | Every rendered `<video>` uses `preload="none"` + `poster` + explicit dimensions — no eager download of every clip on page load, no layout shift | Manual check — confirmed via CX/UX spike (`spikes/cx-ux-playback-pattern-outcome.md`, 2026-10-26) as a named best-practice pattern, formalised as `ppc-s5` AC7 | `ppc-s5` |
| Summary section fetch overhead | Bounded — two additional `fetchArtefact` calls per page load, same cost class as `ppc-s4`'s own DoD-content fetch | Consistent with existing `fetchArtefact` usage, no new infra | `ppc-s6` |
| Sign-off write overhead | Negligible — one additional JSONB write on form submit, same cost class as `ppc-s2`'s existing `captureAllDuration` write | Consistent with existing `journeys.data` write pattern, no new infra | `ppc-s7` |

**Source:** Story AC (`ppc-s2` AC3/AC4) / Not yet a committed SLO — this feature's own build is what establishes the real baseline.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | Capture mechanism uses the Product Owner's own real, already-authenticated `req.sessionId` — never a service credential, never the `NODE_ENV=test` bypass | ADR-018 (Playwright/E2E auth-bypass boundary) | `ppc-s1` |
| Authorisation | Access-control check filters by both `tenant_id` AND `product_id`; capture content is strictly bounded to what the triggering Product Owner's own session can already see | `decisions.md` 2026-10-21 ARCHITECTURE entries | `ppc-s1`, `ppc-s2` |
| Input validation | N/A — no new user-supplied path/query parameters beyond existing authenticated routing; path-traversal guard convention applies if any file path is built from request data (CLAUDE.md mandatory) | CLAUDE.md "Path traversal guard for disk writes" | `ppc-s1` |
| Secrets management | `session_id` is an unsigned bearer-equivalent value and must never leave the server process boundary — no client-side exposure, no logging | `discovery.md` Q1 resolution | `ppc-s1`, `ppc-s2` |
| Audit logging | None identified for this feature at this stage — not a blocking gap, flagged as a candidate for a later story if usage patterns justify it | Not defined | `ppc-s1`–`ppc-s6` |
| Sign-off decision identity | Resolved via `req.session.login || req.session.userId` (never `req.session.accessToken` — CLAUDE.md canonical-field rule), mirroring `admin-credits.js`'s own `adminId` audit-trail pattern | `admin-credits.js` precedent; CLAUDE.md | `ppc-s7` |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [x] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

Classified Confidential because captured screenshots show a tenant's real, live production data (not synthetic/demo data) — bounded to exactly what that tenant's own Product Owner is already authorized to see (per the Q1/Q3 resolution in `discovery.md`), but still real commercial/customer data, not public or purely internal.

**Source:** `discovery.md` Assumptions and Risks (Q1/Q3 resolutions) / `decisions.md` 2026-10-21 ARCHITECTURE entries / ADR-018.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | No regulated constraint or data-residency requirement identified in `discovery.md` | — |

**Source:** Not applicable — `discovery.md` Constraints section identified no regulated constraints.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | — | This feature has no dedicated SLA beyond the existing product's own availability. |
| RTO (recovery time) | Not defined | — | No new durable state is introduced beyond existing `journeys`/`products` tables and the tenant's own connected repo (artefact files). |
| RPO (data loss tolerance) | Not applicable | — | Captured screenshots are written as files to the tenant's own connected repo — not a new database of record requiring its own backup/recovery policy. |
| Planned maintenance window | Not defined | — | Follows the existing product's own deployment cadence. |

**Source:** Business context — not formally defined for this feature.

---

## Accessibility

| NFR | Requirement | Verification method | Applies to story |
|-----|-------------|---------------------|-----------------|
| Feature list / AC list / "Capture evidence" action keyboard access | Meets WCAG 2.1 AA; fully keyboard-accessible | Manual check (no automated a11y tooling in this repo — see `workspace/learnings.md` D48) | `ppc-s1` |
| Capture progress indicator | Exposed to assistive technology via an `aria-live` region, not purely visual | Manual check | `ppc-s2` |
| Rate-limit rejection message | Exposed via `role="alert"` HTML (form path) or a parsed JSON error body (API path), not a visual-only toast | Unit test + live Chrome accessibility-tree check during `/verify-completion` | `ppc-s3` |
| Captured video has no audio narration — not subject to WCAG audio-caption requirement for this use case; transcript explicitly deferred, not silently dropped | See `decisions.md` 2026-10-25 DESIGN entry | Manual check | `ppc-s5` |
| Dashboard-shell wrap preserves existing keyboard-operable, no-client-JS interaction model | No new JS-dependent interaction introduced by the shell wrap | Manual check | `ppc-s6` |

**Source:** Each story's own NFRs section — added retroactively by `/trace` (2026-10-23, Finding 2) after all 3 stories' DoD artefacts had already independently addressed and evidenced an accessibility requirement with no feature-level section to record it in.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

No regulated constraint or compliance framework was identified in `discovery.md`'s Constraints section. Step 4a (regulated constraint propagation check) was skipped per its own entry condition — no regulated constraint present.

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance | Real full-feature capture timing is unknown until `ppc-s2` is built — this is a designed open question, not an oversight (see `ppc-s2` AC3/AC4) | Platform Owner / implementing engineer | At `ppc-s2` DoD |
| Audit logging | No audit trail for capture-trigger actions — flagged, not yet scoped as a story | Platform Owner | Revisit post-MVP if usage patterns justify it |
