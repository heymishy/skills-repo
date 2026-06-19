# NFR Profile: [feature or story title]

<!--
  USAGE: Produced by /definition after epics and stories are written.
  Consolidates all non-functional requirements for the feature into one artefact.
  Referenced by /definition-of-ready (H-NFR hard blocks), /definition-of-done
  (NFR verification), and /trace (NFR orphan check).
  
  Save to: artefacts/[feature]/nfr-profile.md
  
  To evolve: update templates/nfr-profile.md and open a PR.
-->

**Feature:** [feature-slug]
**Created:** [YYYY-MM-DD]
**Last updated:** [YYYY-MM-DD]
**Status:** Draft / Active / Archived

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Page / response time | | | |
| Throughput | | | |
| Load target | | | |

**Source:** Product constraints (`constraints.md`) / Story AC / Stakeholder requirement / Not defined

_If not defined: state "No performance SLOs defined — baseline measurement only."_

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | | | |
| Authorisation | | | |
| Input validation | | | |
| Secrets management | | | |
| Audit logging | | | |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** OWASP / `.github/standards/security/` / Regulatory requirement / Not defined

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| | | | |

**Source:** `constraints.md` / Regulatory / Not applicable

_If not applicable: state explicitly — do not leave blank._

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | | | |
| RTO (recovery time) | | | |
| RPO (data loss tolerance) | | | |
| Planned maintenance window | | | |

**Source:** SLA agreement / Business context / Not defined

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| | | | |

**Named sign-off required?**
- [ ] Not required
- [ ] Yes — compliance / legal review needed before shipping

_Compliance NFRs with named regulatory clauses require human sign-off before the story
can proceed past /definition-of-ready. This is enforced as H-NFR in the DoR check._

---

## NFR AC blocks

> These are copy-pasteable AC blocks for individual stories.
> Add them directly to the story's NFR section.

**Performance:**
```
Given the [component] is under [load condition]
When [action] is performed
Then response time is < [target] at P[percentile]
```

**Security:**
```
Given [input entry point]
When [malformed / malicious input] is submitted
Then the system rejects the input with [expected response] and logs the attempt
```

**Data residency:**
```
Given [data type] is created
Then it is stored only in [region] and no copy exists outside this boundary
```

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| | | | |

_If no gaps: state "No NFR gaps identified at [date]."_
