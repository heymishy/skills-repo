## Benefit Metric: Test Suite Infrastructure Refactor

**Discovery reference:** artefacts/2026-10-29-test-suite-infra-refactor/discovery.md
**Date defined:** 2026-10-29
**Metric owner:** Hamish King, Platform Owner (solo-operator posture — same precedent as other features in this repo)
**Reviewers:** Hamish King, Platform Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This initiative is not a pilot or a hypothesis test about tooling/process separate from product value — the "users" named in discovery.md (developer/engineer running the inner loop, developer debugging `journey.js` coverage, platform maintainer) are this platform's own primary personas (`product/mission.md`). The metrics below are Tier 1 product metrics for the skills platform itself, not a meta-layer on top of it.

Compliance/risk-reduction (Tier 3) does not apply — `discovery.md`'s Constraints section lists none identified, and while the originating incident (`ctpl-s1`) was a security bug, this feature's own purpose is test-infrastructure reliability/duplication/speed, not a named regulatory obligation or risk-register item.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Fixture duplication (hand-rolled `mockReq` on new work)

| Field | Value |
|-------|-------|
| **What we measure** | Count of `journey.js`-touching test files, among those added or modified by a story shipped *after* this MVP, that hand-roll their own `mockReq`/`mockRes` object instead of importing the shared fixture module |
| **Baseline** | 17 of 42 existing `journey.js`-touching files hand-roll today (audit-confirmed, pre-MVP). Retrofitting the existing 42 is explicitly out of scope — this metric tracks new/modified files only, from this MVP's ship date forward |
| **Target** | 0 new hand-rolled fixtures in any `journey.js`-touching story shipped after this MVP |
| **Minimum validation signal** | The very next `journey.js`-touching story to ship after this MVP uses the shared fixture. If even the first opportunity reverts to hand-rolling, the mechanism isn't working and needs revisiting before relying on it for the next slice |
| **Measurement method** | `check-journey-fixture-usage.js`'s structural `/review` finding (added via `/clarify`), cross-checked by a manual grep count at each future `journey.js`-touching story's `/review`. Run by whoever performs `/review` for that story (today: Hamish King, solo-operator) |
| **Feedback loop** | A hand-rolled fixture despite the `/review` finding means either the finding was overridden (must be logged as a `RISK-ACCEPT` in `decisions.md`, not silently skipped) or the fixture itself has an ergonomics gap worth investigating before adding more consumers. Either way: revisit before the next slice begins |

### Metric 2: Divergence-bug incidence

| Field | Value |
|-------|-------|
| **What we measure** | Count of confirmed bugs caused by two `journey.js` test files having silently different fixture defaults — the `ctpl-s1` bug class (two pre-existing tests assumed a merge fired unconditionally; their divergent defaults masked it) |
| **Baseline** | 1 confirmed occurrence (`ctpl-s1`) before this MVP |
| **Target** | 0 further occurrences after the shared fixture ships |
| **Minimum validation signal** | No new occurrence within the next 3 `journey.js`-touching stories after this MVP. A single counterexample inside that window is itself a strong signal the fixture isn't closing the gap it was built for |
| **Measurement method** | `workspace/capture-log.md` entries tagged to this bug class, reviewed at each `/definition-of-done` for a `journey.js`-touching story |
| **Feedback loop** | A new occurrence is a direct regression of this MVP's core premise, not a deferrable finding — open a fast-follow story immediately rather than logging it for a later slice |

### Metric 3: Adoption

| Field | Value |
|-------|-------|
| **What we measure** | % of new `journey.js`-touching stories (shipped after this MVP) that use the shared fixture, out of all new `journey.js`-touching stories in that window |
| **Baseline** | 0/42 existing files use a shared fixture today (none exists yet) |
| **Target** | 100% of new `journey.js`-touching stories use it |
| **Minimum validation signal** | At least 2 of the first 3 new `journey.js`-touching stories after this MVP use it — allows one early miss while the habit forms, consistent with the structural (not yet hard-blocking) enforcement chosen at `/clarify` |
| **Measurement method** | `check-journey-fixture-usage.js`'s `/review` finding plus the same grep-count method as Metric 1, tracked across stories |
| **Feedback loop** | If adoption falls below the minimum signal, trigger the revisit condition already logged in `decisions.md`'s DESIGN entry: promote `check-journey-fixture-usage.js` from a `/review` finding to a `/definition-of-ready` hard block |

---

## Tier 2: Meta Metrics (Learning / Validation)

Not applicable — see Tier Classification above (META-BENEFIT FLAG: No).

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Fixture duplication | tsir-s1, tsir-s3 | Covered |
| Divergence-bug incidence | tsir-s1, tsir-s2 | Covered |
| Adoption | tsir-s3 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
