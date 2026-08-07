# NFR Profile: gate-advance-validation

**Feature:** 2026-07-18-gate-advance-validation
**Created:** 2026-07-18
**Last updated:** 2026-07-18
**Status:** Active

---

## Performance

No performance SLOs defined — baseline measurement only. This story adds CLI/tooling validation functions (reading small Markdown/JSON artefacts synchronously), matching the existing H1-H9 checks' cost profile. Not a runtime hot path.

---

## Security

**Data classification:**
- [x] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Path traversal (OWASP A01) is the one live security concern — every new gate branch must preserve the existing `resolvedPath.startsWith(repoRoot + sep)` guard for any artefact path it resolves. Covered by a dedicated integration test (IT1) per new gate, not assumed inherited.

---

## Data residency

Not applicable — this feature has no data-residency dimension.

---

## Availability

Not defined — no runtime service component; this is CLI/tooling used during pipeline sessions, not a running production service with an uptime SLA of its own.

---

## Compliance

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| New gate criteria correctness | AC2-AC6's proposed validation criteria are a first design pass, not yet exercised against real historical artefacts in this repo (Complexity Rating 3, Scope stability Unstable per the story) | Hamish King | During implementation — adjust and log in decisions.md if a real artefact doesn't fit |
