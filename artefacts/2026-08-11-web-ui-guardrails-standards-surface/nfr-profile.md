# NFR Profile: web-ui-guardrails-standards-surface

**Feature:** 2026-08-11-web-ui-guardrails-standards-surface
**Created:** 2026-08-11
**Last updated:** 2026-08-14
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

## Accessibility

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Colour-independent state | Error and empty states must be conveyed via text/label, not colour alone | `MC-A11Y-02` | `wugs-s2`, `wugs-s3` (same as `wugs-s2`), `wugs-s7` |
| Keyboard-accessible controls | "Connect a repo" prompt is a real link/button, not a non-interactive text hint | Mandatory Constraint pattern (`.github/architecture-guardrails.md`) | `wugs-s4` |
| Keyboard-accessible controls | Form fields have labels; Add/Edit actions are keyboard-accessible buttons/links, not click-only divs | Mandatory Constraint pattern | `wugs-s5` |
| Keyboard-accessible controls | "Request promotion" is a real button, keyboard-accessible | Mandatory Constraint pattern | `wugs-s8` |
| Keyboard-accessible controls | Approve/Reject are real `<button>` elements, keyboard-accessible — named as a requirement by `wugs-s9`'s own story text, but not actually built until `wugs-s13` (per `/trace`'s 2026-08-14 HIGH finding) | Mandatory Constraint pattern | `wugs-s9` (requirement), `wugs-s13` (implementation) |

**Source:** Individual story Accessibility NFR bullets (`wugs-s2`, `wugs-s3`, `wugs-s4`, `wugs-s5`, `wugs-s7`, `wugs-s8`, `wugs-s9`, `wugs-s13`) — this section was added 2026-08-14 to close `/trace`'s 2026-08-14 LOW finding #6 (profile-level Accessibility section was missing entirely despite multiple stories carrying explicit Accessibility NFRs). Stories with no user-facing UI (`wugs-s1`, `wugs-s6`, `wugs-s10`, `wugs-s14`) or no new accessibility surface (`wugs-s11`, `wugs-s12`) are correctly excluded.

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
| Performance | ~~No fetch timeout on live GitHub reads~~ **RESOLVED 2026-08-14** — `wugs-s14` added an `AbortController`-based 10s timeout (overridable) to `fetchGithubContentsResponse`, the shared helper both `fetchArtefact` and `realFetchRepoPath` call through, closing the gap this row originally tracked (found during `wugs-s2`'s final story-level review, 2026-08-12). See `artefacts/2026-08-11-web-ui-guardrails-standards-surface/dod/wugs-s14-dod.md` | Hamish King | Closed |
