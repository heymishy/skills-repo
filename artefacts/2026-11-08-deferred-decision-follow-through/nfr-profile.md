# NFR Profile: Deferred Decision Follow-Through

**Feature:** 2026-11-08-deferred-decision-follow-through
**Created:** 2026-11-09
**Last updated:** 2026-11-09
**Status:** Active

---

## Performance

No performance SLOs defined — baseline measurement only. ddft-s3's PostHog query volume is bounded by surfaced-record count per scan; not expected to be a concern at this repo's current scale.

**Source:** Not defined

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Governed-file change control | Three separate PRs for `/discovery`, `/decisions`, `/benefit-metric` patches, never direct push | CLAUDE.md Platform change policy | ddft-s4 |
| Credential storage | PostHog API key in secrets store if run outside this interactive session, never the agent's environment | `product/constraints.md` #12 | ddft-s3 |
| No credentials in record content | Same `MC-SEC-02` rule as `itar-s1` | MC-SEC-02 | ddft-s1 |
| Escaped rendering | Deferred-item content rendered as escaped text, never raw HTML | MC-SEC-01 | ddft-s5 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (pipeline metadata, no PII)
- [ ] Public
- [ ] Confidential
- [ ] Restricted

**Source:** CLAUDE.md / `.github/architecture-guardrails.md` Mandatory Constraints

---

## Data residency

Not applicable — `complianceProfile: standard`, `complianceFrameworks: []`.

**Source:** Not applicable

---

## Availability

Not defined — no standing service; every mechanism here is triggered/bounded.

**Source:** Not defined

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required
- [ ] Yes

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance | Web UI fetch latency for `workspace/incidents.json` has no baseline — same open gap already flagged in `urpv-s3`'s and `itar-s3`'s own NFR profiles | Hamish King (Platform Owner) | Before ddft-s5 reaches /definition-of-ready |
