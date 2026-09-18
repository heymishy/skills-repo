# NFR Profile: Design System Adoption

**Feature:** 2026-09-18-design-system-adoption
**Created:** 2026-09-18
**Last updated:** 2026-09-18
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Page load time | No measurable regression from the restyle (CSS/markup-only changes, no new network calls) | Compare before/after page-load timing per screen | dsa-s1, dsa-s2, dsa-s3, dsa-s4 |
| Landing page load time | No measurable regression — higher consequence than internal screens, since it is the first page a prospective user loads | Compare before/after page-load timing | dsa-s3 |
| DoR gate check latency | `H-DESIGN`'s token scan completes within `/definition-of-ready`'s existing overall gate-check budget | Timing observation during DoR sign-off runs | dsa-s5 |

**Source:** Story ACs / this feature's own discovery NFR list

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Accessibility (WCAG 2.1 AA) | No regression to any existing accessibility property (contrast ratios, keyboard navigation) on any of the 4 restyled screens | `product/constraints.md` #9 — already an existing, platform-wide hard floor; not a new mechanism this feature builds, but a floor every restyle story must not regress | dsa-s1, dsa-s2, dsa-s3, dsa-s4 |
| Design artefact referenced, not embedded | `DESIGN.md` is referenced via `context.yml`; its content is never embedded into any SKILL.md file | `product/constraints.md` #8 | dsa-s5 |
| No new input handling | None of the 5 stories introduce new user-input entry points requiring input validation | N/A — visual restyle and governance-tooling stories only | dsa-s1, dsa-s2, dsa-s3, dsa-s4, dsa-s5 |

**Data classification:**
- [x] Public — the landing page and dashboard/artefact-viewer/chat screens display no new data beyond what already renders today; this feature changes visual presentation only, not data handling.

**Source:** `product/constraints.md` #8, #9 — no external OWASP/regulatory standard named, since `context.yml` confirms `regulated: false`.

---

## Data residency

Not applicable — no data storage, transfer, or residency question is introduced by this feature. Visual restyle and DoR-governance-tooling only.

**Source:** Not applicable

---

## Availability

Not applicable — no new service, uptime commitment, or recovery target is introduced. Existing screens' availability is unaffected by a visual restyle.

**Source:** Not applicable

---

## Compliance

Not applicable — no compliance framework or regulatory obligation applies to this feature (`context.yml` confirms `regulated: false`, and `product/constraints.md` #9's WCAG floor is already tracked as a Security NFR above, not a compliance-sign-off item).

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

No NFR gaps identified at 2026-09-18. The one open question this feature itself resolves — whether `design.system` DoR compliance enforcement genuinely exists — is `dsa-s5`'s own subject matter, not a gap in this NFR profile.
