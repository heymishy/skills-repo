# Spike Outcome: products.js/journeys.js fixture duplication

**Opened:** 2026-10-30 | **Scope:** Narrow | **Steps taken:** 3
**Done condition met:** Yes
**Artefact path:** `artefacts/2026-10-30-test-fixture-hardening-continuation/spikes/tfhc-s5-outcome.md`

---

## Outcome: PROCEED

### What was found

**Step 1 — swept `tests/` for the exact pattern that flagged `journey.js`/`skills.js` (a named `mockReq` factory: `function mockReq(` or `const/var/let mockReq = {`):**
- `products.js`-touching test files: 32 total, 10 match the named-factory pattern.
- `journeys.js`-touching test files: 31 total, 0 match the named-factory pattern.

**Step 2 — this initially looked like `journeys.js` had no duplication problem. Spot-checked a sample file (`tests/check-ep1-s1-journey-create.js`) to confirm, and found the opposite:** every test in the file constructs its own inline `const req = { session: {...}, ... }` object literal, with no reusable factory function at all — a *more* fragmented pattern than a named-but-hand-rolled `mockReq` function, not an absence of the problem. Broadened the sweep to also match inline `const/var/let req = { ... session: ...}` literals:
- `products.js`-touching test files: 27 of 32 construct their own req/session object (10 via a named factory, 17 via ad-hoc inline literals).
- `journeys.js`-touching test files: 30 of 31 construct their own req/session object (0 via a named factory — **all 30 are ad-hoc inline literals**, scattered per-test rather than centralized even in one hand-rolled function per file).
- The 1 `journeys.js`-touching file with no detected construction (`check-jcx-s2-placeholder-conversion.js`) was confirmed by direct read to be a pure data-layer test (discovery fixtures, a mock DB pool) with no HTTP handler under test — correctly excluded, same shape as the synthetic self-test fixtures excluded from `journey.js`/`skills.js`'s own counts.

**Step 3 — independently re-derived each route module's real `req.session` field reads (not assumed, not copy-pasted from either existing fixture):**
- `journeys.js` reads exactly **1** field: `req.session.tenantId` (line 37). No `accessToken`, `login`, `role`, or `userId` reads anywhere in the file.
- `products.js` reads **5** fields: `accessToken`, `login`, `tenantId`, `plan`, `impersonation` — a distinct shape from both `journey.js`/`skills.js` (no `role`/`userId`) and from `journeys.js` (4 more fields).

### Reasoning

Both surfaces confirm real, substantial duplication — in fact proportionally *larger* than either closed precedent (`journey.js` 16/41 ≈ 39%, `skills.js` 12/45 ≈ 27%, vs. `products.js` 27/32 ≈ 84%, `journeys.js` 30/31 ≈ 97%). `journeys.js`'s pattern is arguably the most urgent of all four surfaces examined in this epic: with no factory at all, there is no single place to even begin fixing a divergence bug — every one of its 30 touching files is an independent, unreviewed re-derivation of the same single-field session shape. The done condition ("a confirmed duplication count for each, plus a verdict") is met with high confidence: both counts are real, both are independently grounded against the actual route source, and the pattern recognition itself was validated rather than trusted blindly (Step 2's own correction, from "0 problem" to "30 of 31 affected," is direct evidence the broader sweep was necessary, not optional).

---

## If PROCEED

**Unblocked stage:** A follow-on implementation story for this epic (not yet created) — "walking skeleton" for `journeys.js` first (recommended — see below), same bounded shape as `tfhc-s3`: one shared fixture module + one self-test + one proof-of-pattern migration + a structural checker + `/review` wiring.

**Conditions:**
1. **Recommend `journeys.js` as the first/sole implementation target**, not both in the same cycle. Its 1-field session shape makes the fixture trivial to get right and ground independently; its "zero factory, all ad-hoc" pattern is the more urgent of the two to close. `products.js`'s confirmed 27/32 duplication (5-field shape) should be logged as a second, separately-bounded follow-on — not folded into the same implementation story, to avoid repeating this epic's own stated risk of "6 differently-shaped stories... under one epic" causing CI concurrency collisions (`discovery.md`'s own Risk section).
2. This spike does not itself implement anything — per its own out-of-scope declaration. The follow-on story (or stories) must go through the normal pipeline (discovery is not required to re-run; this spike's findings substitute for a fresh discovery per `discovery.md` item 5's own framing — see Discovery fields resolved below).

---

## What remains unknown

Nothing material to the spike's own question. One open judgment call, not an unknown: whether `products.js`'s follow-on lands within this same epic/MVP cycle or as a genuinely separate, later-scheduled story — `discovery.md`'s own Out of Scope item 2 already anticipates this exact branch ("fast-follow if... implementation doesn't land within this MVP's own cycle for capacity reasons").

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | No | Confirms the stated problem class extends to both additional surfaces, as anticipated |
| MVP scope | Yes | `discovery.md` framed this as "whichever is confirmed" (implying possibly one); both are confirmed. Scope should be read as: `journeys.js` implementation lands within this MVP (per item 5's PROCEED clause); `products.js` implementation is logged as a named fast-follow rather than assumed in-scope by default |
| Assumptions | No | The underlying assumption (this bug class likely recurs on other route modules) is validated, not changed |
| Known risks | Yes | The CI-concurrency-collision risk already named in `discovery.md`'s Risk section becomes directly relevant if both surfaces' implementations were attempted together — reinforces running them as separate, sequenced stories |
| Technical constraints | No | No new technical constraint found |

**Discovery re-run needed?**
- [x] No — findings clarify details within the existing framing (the "whichever is confirmed" wording already anticipated a PROCEED outcome; no new discovery needed to say both surfaces qualify)

---

## Decision log reference

Logged in `artefacts/2026-10-30-test-fixture-hardening-continuation/decisions.md` as a SCOPE entry (see below).
