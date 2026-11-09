# NFR Profile: Programme Entry Points

**Feature:** 2026-11-08-programme-entry-points
**Created:** 2026-11-09
**Last updated:** 2026-11-09
**Status:** Active

---

## Performance

No performance SLOs defined — baseline measurement only. pep-s3's script has a soft expectation of completing quickly for ad-hoc/CI use, but no numeric target was set (this repo's current scale doesn't warrant one yet).

**Source:** Not defined

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Governed-file change control | Patches to `skills/programme/SKILL.md` and `skills/workflow/SKILL.md` go via branch + PR, never direct push | CLAUDE.md Platform change policy | pep-s2 |
| No new credential surface | None of the 3 stories introduce a new secret or credential | — | pep-s1, pep-s2, pep-s3 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (skill-instruction text, pipeline metadata — no PII)
- [ ] Public
- [ ] Confidential
- [ ] Restricted

**Source:** CLAUDE.md

---

## Data residency

Not applicable.

**Source:** Not applicable

---

## Availability

Not defined — no standing service, no availability target applies.

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

No NFR gaps identified at 2026-11-09.
