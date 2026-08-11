# NFR Profile: web-ui-guardrails-standards-surface

**Feature:** 2026-08-11-web-ui-guardrails-standards-surface
**Created:** 2026-08-11
**Last updated:** 2026-08-11
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Product/org-level view load time | No hard SLO — GitHub API latency accepted as a known tradeoff (per `decisions.md` ARCH entry #4, no caching layer for MVP) | Manual observation during beta; revisit if a caching layer is reconsidered per the entry's own revisit trigger | `wugs-s2`, `wugs-s3` |
| Edit-form pre-fill load time | Under 2 seconds | Manual observation | `wugs-s5` |

**Source:** Story AC / `decisions.md` ARCH entry #4

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | Uses the operator's own session OAuth token for all GitHub reads/writes — no service-account token with broader scope | Matches existing `artefact-fetcher.js`/`repo-bootstrap.js` pattern | `wugs-s1`, `wugs-s6` |
| Authorisation | Promotion approval/rejection gated on the existing `admin` role, server-side enforced via `isEffectivelyAdmin` (same mechanism as `credits-guard.js`) | `decisions.md` SCOPE entry (2026-08-11, definition-stage) | `wugs-s9` |
| Input validation | Guardrail/standard content submitted via the create/edit form is validated server-side, not trusted from client input alone | Mandatory Constraint pattern (`.github/architecture-guardrails.md`) | `wugs-s5` |
| Input rendering | Repo file content (untrusted, tenant-controlled) is HTML-escaped before rendering — no raw injection into innerHTML | `MC-SEC-01` | `wugs-s2`, `wugs-s3`, `wugs-s5` |
| Tenant isolation | Org-level content is strictly tenant-scoped — Tenant A never sees Tenant B's designated org repo | ADR-025 (multi-tenancy) | `wugs-s3` (AC5 explicit test) |
| Secrets management | No credentials/tokens logged or persisted beyond the session's own token handling | `MC-SEC-02` (spirit, extended beyond its literal viz scope) | `wugs-s1`, `wugs-s6` |
| Audit logging | All state-changing actions (org-repo designation, PR creation, promotion request/approve/reject) are PostHog-captured | Existing platform capture convention | `wugs-s3`, `wugs-s6`, `wugs-s10` |

**Data classification:**
- [x] Internal — repo file content is the tenant's own governance documentation (guardrails/standards text), not PII, but not meant for public exposure outside the tenant either
- [ ] Public
- [ ] Confidential
- [ ] Restricted

**Source:** `.github/architecture-guardrails.md` Mandatory Constraints / ADR-025 / `decisions.md`

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | Discovery Constraints section: "None identified"; `context.yml` `regulated: false` | — |

**Source:** Not applicable

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | This feature depends on GitHub's own availability for both read and write paths — no independent SLA target beyond GitHub's own; a GitHub outage degrades this feature's views/edits, which is an accepted external dependency, not a gap to close |

**Source:** Not defined

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| Not applicable | — | — | — |

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance | No hard SLO for live GitHub reads — deferred per `decisions.md` ARCH entry #4's own revisit trigger; monitor real latency during beta and reconsider a caching layer if it proves too slow | Hamish King | Revisit if flagged during beta (no fixed date — usage-triggered) |
| Authorisation | `admin`-only promotion-approval gating may prove too coarse in practice (per `decisions.md` SCOPE entry's own revisit trigger) | Hamish King | Revisit if a non-admin tech lead legitimately needs approval authority (usage-triggered, no fixed date) |
| Performance | No fetch timeout on live GitHub reads, despite this file's own Performance NFR row stating "a reasonable fetch timeout (e.g. 10s) with a clear timeout error state is expected" — `wugs-s1`'s `fetchRepoPath`/`realFetchRepoPath` adapter (the shared read path `wugs-s2`, `wugs-s3` consume) has no `AbortController` or timeout wrapper, so a hung GitHub API call currently hangs the whole page render indefinitely rather than degrading to a named timeout error. Found during `wugs-s2`'s final story-level review (2026-08-12); the gap predates `wugs-s2` — it sits in `wugs-s1`'s adapter, already merged — so fixing it is out of `wugs-s2`'s own task scope. Logged here rather than silently dropped, per this repo's CSS-layout-dependent-AC discipline extended to NFR gaps generally | Hamish King | Add timeout handling to `fetchRepoPath`/`realFetchRepoPath` before or shortly after `wugs-3`/`wugs-4` ship (both share the same adapter and same exposure) |
