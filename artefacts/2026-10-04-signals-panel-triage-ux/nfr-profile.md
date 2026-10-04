# NFR Profile: Signals Panel Triage UX

**Feature:** 2026-10-04-signals-panel-triage-ux
**Created:** 2026-10-04
**Last updated:** 2026-10-04
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Nav render | No measurable change — one static array entry | N/A (trivial addition) | `sptu-s1` |
| Filtered + paginated render time | Stays within the established <100ms budget (single array `.filter()` pass before `ep2-s3`'s already-measured pagination slice) | Server-side render time, same method as `ep2-s1`/`ep2-s3`'s own NFR tests | `sptu-s2` |
| Sort-label render | No measurable change — per-item boolean check on already-available `timestamp` field | N/A (trivial addition) | `sptu-s3` |
| Dismiss filter + persistence | Stays within the established <100ms budget (O(1) hash-set membership check per signal, reusing `sptu-s2`'s own pre-pagination filter pass) | Server-side render time, same method as above | `sptu-s4` |

**Source:** Story ACs/NFRs, each independently specific and measurable; established `<100ms` budget inherited from `ep1-s3`/`ep2-s1`/`ep2-s3`'s own precedent.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No new attack surface — filter params | `hideType`/`hideSource` query values validated/normalized against the real observed `type`/`source` value set before use in any comparison | `sptu-s2` AC1/AC2 | `sptu-s2` |
| No new attack surface — dismiss store | `workspace/dismissed-signals.json` stores only derived hashes, never raw signal content, credentials, or PII | `sptu-s4` Architecture Constraints | `sptu-s4` |
| No new npm runtime dependency | Dismiss-key hashing uses Node's built-in `crypto` module only | discovery.md Constraints | `sptu-s2`, `sptu-s3`, `sptu-s4` |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

Signal content and dismiss-state are drawn from this repo's own workspace/delivery artefacts — internal engineering process data, not customer or regulated data. Matches the parent feature's own (`2026-09-28-weeb-ui-learnings-and-improvements`) existing classification.

**Source:** discovery.md's own stated scope; no change from the parent feature's classification.

---

## Data residency

**Not applicable** — no new data storage beyond a single new local file (`workspace/dismissed-signals.json`), read/written entirely within the existing local repo/workspace. Matches the parent feature's own precedent.

---

## Availability

**Not applicable** — no new infrastructure; entirely within the existing web-ui process.

---

## Compliance

**No compliance frameworks apply.** `discovery.md`'s own Assumptions and Risks section resolved all open items via `/clarify`; no regulated constraint (PCI, AML, GDPR, SOX, HIPAA) is present. `/definition` Step 4a (regulated constraint propagation) was skipped as a result — confirmed no regulated constraints exist in discovery's Constraints section.

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## Accessibility

| NFR | Requirement | Applies to story |
|-----|-------------|-----------------|
| Keyboard navigation — nav row | New "Signals" nav row Tab-reachable like every existing `sw-nav-item` | `sptu-s1` AC4 |
| Keyboard navigation — filter controls | Type/source hide-toggles individually focusable and operable (space/enter); colour never the sole indicator of active filters | `sptu-s2` AC5 |
| Colour-independent indicator — no-date marker | "No date" marker on undated signals uses text/icon, not colour alone | `sptu-s3` AC2 |
| Keyboard navigation — dismiss controls | Dismiss/Undismiss controls individually focusable and operable | `sptu-s4` AC6 |

Per `product/constraints.md` #9: WCAG 2.1 AA is a hard floor, not a performance NFR, for this feature — matches the parent feature's own established Tab-order E2E coverage pattern (`ep2-s1`/`ep2-s3`).

---

## Gaps and open questions

No NFR gaps identified at 2026-10-04.
