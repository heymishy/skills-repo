# NFR Profile: Incident Triage and Respond

**Feature:** 2026-11-08-incident-triage-and-respond
**Created:** 2026-11-09
**Last updated:** 2026-11-09
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Triage matching run time | No numeric SLO — expected low incident volume for now; re-evaluate if initiative 2's alerts materially raise volume | Observed during test-plan execution | itar-s2 |
| Web UI fetch latency | `[UNKNOWN BASELINE]` — same caveat as initiative 1's `decisions.md` fetch; not assumed safe at scale without measurement | Flagged as a risk to measure, not solved speculatively | itar-s3 |

**Source:** Story AC / Not defined (genuinely unmeasured)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No credentials in incident content | `trigger`/`summary` text must never include raw credentials or tokens | MC-SEC-02 | itar-s1 |
| Escaped rendering | `workspace/incidents.json` content rendered as escaped text, never raw HTML | MC-SEC-01 | itar-s3 |
| Forward-looking credential rule | If handoff/confirmation ever posts via initiative 2's Teams adapter, the token lives in a secrets store, never the agent's environment — not yet active, binding once built | `product/constraints.md` #12 | itar-s4 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (incident metadata, triage text — no PII expected, though authors must avoid including any)
- [ ] Public
- [ ] Confidential
- [ ] Restricted

**Source:** `.github/architecture-guardrails.md` Mandatory Constraints (Security)

---

## Data residency

Not applicable — `complianceProfile: standard`, `complianceFrameworks: []` for this feature.

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
| Performance | Web UI fetch latency for `workspace/incidents.json` has no baseline, same open gap already flagged in initiative 1's own NFR profile for `decisions.md` | Hamish King (Platform Owner) | Before itar-s3 reaches /definition-of-ready |
