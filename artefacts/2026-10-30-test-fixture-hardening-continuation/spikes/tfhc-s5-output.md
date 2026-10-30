# Spike Output: products.js/journeys.js fixture duplication

**Spike:** tfhc-s5
**Parent feature:** 2026-10-30-test-fixture-hardening-continuation
**Discovery artefact:** `artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md`
**Outcome:** PROCEED
**Output date:** 2026-10-30

---

## Uncertainty addressed

> Do `products.js` and/or `journeys.js` carry the same hand-rolled-fixture duplication problem already confirmed and closed for `skills.js` (12/45) and `journey.js` (16/41)?

---

## Options evaluated

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| 1 | Implement walking-skeleton fixture for `journeys.js` only, within this MVP | Simplest shape (1 session field), most urgent pattern (0 of 30 use even a local factory — pure ad-hoc repetition), lowest implementation risk | `products.js`'s confirmed 27/32 duplication stays open a while longer | ✓ Recommended |
| 2 | Implement walking-skeleton fixtures for both surfaces in this same cycle | Closes both confirmed problems immediately | Repeats `discovery.md`'s own named risk (6 differently-shaped stories under one epic causing CI concurrency collisions); `products.js`'s more complex 5-field shape needs its own independent grounding, not a rushed add-on | ✗ Ruled out (this cycle) |
| 3 | DEFER both, treat as out of scope | No further epic scope growth | Ignores clear, measured evidence of the exact bug class this epic exists to close, on two surfaces with proportionally *higher* duplication than either closed precedent | ✗ Ruled out |

---

## Recommendation

PROCEED with a `journeys.js` walking-skeleton implementation story within this MVP's own cycle (same bounded shape as `tfhc-s3`: one fixture + one self-test + one proof-of-pattern migration + a structural checker + `/review` wiring), given its confirmed 30/31 duplication rate and the fact that none of those 30 files even share a local factory function today. Log `products.js`'s separately-confirmed 27/32 duplication as a named, bounded fast-follow story for this same epic — not folded into the same implementation cycle, to avoid the CI-concurrency-collision risk `discovery.md` already names for running too many differently-shaped stories under one epic at once.

---

## Constraints confirmed

| Constraint | Source | Implication |
|------------|--------|-------------|
| `journeys.js` reads only `req.session.tenantId` — no `accessToken`/`login`/`role`/`userId` | Independent grep of `src/web-ui/routes/journeys.js`, this spike | The fixture for `journeys.js` is simpler than any existing one (journey.js/skills.js both have 5 fields) — do not copy either existing fixture's shape wholesale |
| `products.js` reads 5 fields distinct from both other surfaces (`accessToken`, `login`, `tenantId`, `plan`, `impersonation`) | Independent grep of `src/web-ui/routes/products.js`, this spike | A future `products.js` fixture needs its own independent grounding — same discipline already applied for `journey.js`/`skills.js`, do not assume compatibility with any existing fixture |

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | No | Confirmed, not changed |
| Target users | No | Same personas as the rest of this epic |
| MVP scope | Yes | `journeys.js` walking-skeleton implementation now explicitly in-scope for this MVP (per item 5's own PROCEED clause); `products.js` implementation logged as a named fast-follow, not assumed in-scope by default |
| Out of scope | Yes | `products.js` implementation added to the explicit fast-follow list (already anticipated by `discovery.md` Out of Scope item 2's own conditional wording) |
| Assumptions | No | Validated, not changed |
| Known risks | Yes | The CI-concurrency-collision risk already named in `discovery.md` is reinforced as the reason to sequence `journeys.js` and `products.js` implementations separately rather than together |
| Success criteria | No | Unchanged — "items 5-6's spikes have a recorded verdict" is satisfied by this output |
| Technical constraints | Yes | See Constraints confirmed table above — both surfaces' real session-field shapes are now documented, neither matching either existing fixture |

**Discovery re-run needed?**
- [x] No — findings clarify details within the existing framing

---

## Remaining unknowns

Nothing material to this spike's own question. Whether `journeys.js`'s implementation lands as a new story within this same session or is scheduled for later is an operator scheduling decision, not an unresolved technical unknown.

---

## Decision log reference

Logged in `artefacts/2026-10-30-test-fixture-hardening-continuation/decisions.md` as a SCOPE entry.
