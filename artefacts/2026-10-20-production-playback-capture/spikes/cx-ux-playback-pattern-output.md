# Spike Output: CX/UX pattern for self-service DoD evidence review

**Spike:** cx-ux-playback-pattern
**Parent feature:** 2026-10-20-production-playback-capture
**Discovery artefact:** `artefacts/2026-10-20-production-playback-capture/discovery.md`
**Outcome:** REDESIGN (bounded)
**Output date:** 2026-10-26

---

## Uncertainty addressed

What's the best-practice CX/UX pattern for a SaaS tenant-facing "prove this feature is done" flow — select a DoD-complete feature → see its scope/benefit summary → see progressively-detailed evidence (screenshots, annotations, video) mapped to each AC → reach a sign-off decision — and does the `ppc-s5`/`ppc-s6` design as currently scoped match that pattern?

---

## Options evaluated

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| 1 | PROCEED as-is — `ppc-s5`/`ppc-s6` ACs already match best practice | No rework needed | Two concrete, nameable gaps (video lazy-load, empty-state specificity) would ship unaddressed | ✗ Ruled out |
| 2 | REDESIGN — add/tighten two specific ACs, nothing else | Fixes the two real gaps found; stays within existing architecture/complexity rating; no new story needed | Requires a small story-file edit before `/review` | ✓ Recommended |
| 3 | Broader redesign — also build an in-app sign-off/decision-recording mechanism now | Would fully close the "evidence viewed → decision made" loop research kept surfacing | Materially larger scope (decision storage, approver identity, audit trail) not called for by either story's benefit linkage or by discovery; turns a CX spike into a new feature | ✗ Ruled out — logged as an open scope question instead, not built |

---

## Recommendation

Apply two bounded AC changes — (1) a video-loading-performance AC in `ppc-s5` (`preload="none"` + `poster` + explicit dimensions), and (2) tightened wording in `ppc-s6` AC4 so the "not available" state names the specific missing artefact — then proceed straight to `/review` on both stories. Do not build an in-app sign-off-recording mechanism now; log it as a named open question for the Platform Owner instead, since it's a product-scope decision no amount of CX research can settle on its own.

---

## Constraints confirmed

| Constraint | Source | Implication |
|------------|--------|-------------|
| WCAG 1.2.2 (captions) applies only to prerecorded *audio* | WCAG video-accessibility research, this spike | Confirms `ppc-s5`'s existing caption deferral is accessibility-safe, not a compliance gap — no change needed |
| Native `<video>` avoids the keyboard-trap failure mode common to custom players | Accessibility research, this spike | Confirms `ppc-s5` AC2's choice of native `<video controls>` is correct as designed — no change needed |

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | No | — |
| Target users | No | — |
| MVP scope | No | — |
| Out of scope | No | — |
| Assumptions | No | — |
| Known risks | No | — |
| Success criteria | No | — |
| Technical constraints | No | — |

**Discovery re-run needed?**
- [x] No — findings clarify details within the existing framing
- [ ] Yes — spike changes the problem framing significantly → re-run /discovery before proceeding

---

## Remaining unknowns

Whether "sign-off decision made" (the epic's own goal wording) is meant to be an in-app recorded action or an off-platform decision is unresolved — logged as an open scope question in `decisions.md`, not guessed at.

---

## Decision log reference

`artefacts/2026-10-20-production-playback-capture/decisions.md`, 2026-10-26 entries (DESIGN, SCOPE).
