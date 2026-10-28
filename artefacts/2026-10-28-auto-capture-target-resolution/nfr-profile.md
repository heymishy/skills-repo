# NFR Profile: auto-capture-target-resolution

**Feature:** 2026-10-28-auto-capture-target-resolution
**Created:** 2026-10-28
**Last updated:** 2026-10-28
**Status:** Active

---

## Performance

No new performance SLO. `actr-s1` is pure in-memory string parsing — negligible cost. `actr-s2`/`actr-s3` add at most 2 artefact fetches per AC lacking a manual target (the story's `test-plan.md`, then conditionally its named spec file) on an already-authenticated, already-tenant-scoped read path — bounded by the AC count already being rendered or captured, never unbounded.

---

## Security

**Data classification:**
- [x] Internal — tenant-repo source content (E2E spec files, test-plan markdown), not public, not PII/sensitive
- [ ] Confidential
- [ ] Restricted

**Source:** The new read surface is the tenant's own connected repo, read through the same tenant+product-scoped `fetchArtefact` adapter every other artefact read in `playback-evidence.js` already uses — no new access-control boundary. The one new, real risk is a derived URL being used to navigate a real, session-authenticated browser (via the existing capture-dispatch path) — mitigated by `actr-s1`'s own relative-path-only guard (AC3), which fails closed (returns `null`, falls through to manual entry) rather than ever passing an unvalidated value downstream. See `decisions.md`, 2026-10-28 SECURITY entry.

---

## Data residency

Not applicable — no new data store; this feature reads existing tenant-repo content and writes to the existing `journeys.captureTargets` field, both already covered by this product's existing data-residency posture.

---

## Availability

Not applicable — no new runtime service component. Auto-resolution failure is explicitly required (across all 3 stories) to degrade to today's existing manual-entry behaviour, never to block page render or capture dispatch (`actr-s2` AC5, `actr-s3` AC4).

---

## Accessibility

The auto-detected read-only display and "Override" control (`actr-s2`) must remain keyboard-operable, matching this page's own existing convention (`ppc-s6` AC5). No new color values or visual pattern are introduced — the block reuses this page's existing text/form styling, so `hasDesignSystemTrack` is set `true` on `actr-s2`/`actr-s3` as a precaution (per CLAUDE.md's opt-in guidance for any story touching UI in `src/web-ui/`), with the expectation that `node scripts/check-design-tokens.js` passes cleanly since no new colors are added — confirmed at implementation time, not DoR time, since no code exists yet to scan.

---

## Compliance

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

No NFR gaps identified at 2026-10-28.
