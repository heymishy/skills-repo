## Benefit Metric: Test Fixture Hardening — Continuation

**Discovery reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md
**Date defined:** 2026-10-30
**Metric owner:** Hamish King, Platform Owner (solo-operator posture — same precedent as `test-suite-infra-refactor`)
**Reviewers:** Hamish King, Platform Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

Same reasoning as the original `test-suite-infra-refactor` benefit-metric: this is not a pilot or a hypothesis test about tooling/process separate from product value. The personas named in discovery.md (developer/engineer running the inner loop, developer extending test coverage, platform maintainer) are this platform's own primary personas (`product/mission.md`). The metrics below are Tier 1 product metrics for the skills platform itself.

Compliance/risk-reduction (Tier 3) does not apply — this feature is test-tooling-only (no `src/` production code path, no regulated data), per `discovery.md`'s Constraints section.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: E2E seed-fixture duplication

| Field | Value |
|-------|-------|
| **What we measure** | Count of files calling `/test/seed-approval-journey` that use a shared E2E fixture vs. hand-roll their own inline payload |
| **Baseline** | 0 of 4 real callers use a shared fixture today (confirmed 2026-10-30) |
| **Target** | 2–3 of the 4 migrated within this MVP; 0 new hand-rolled callers on any new E2E spec touching this endpoint after this MVP ships |
| **Minimum validation signal** | At least 1 caller migrated as proof-of-pattern, and the new structural check correctly flags a hand-rolled payload and passes a migrated one |
| **Measurement method** | New structural check (same shape as `check-journey-fixture-usage.js`) plus a manual grep-count cross-check at `/review`. Run by whoever performs `/review` for this feature (today: Hamish King, solo-operator) |
| **Feedback loop** | A new caller hand-rolling its payload despite the `/review` finding means either the finding was overridden (must be logged as a `RISK-ACCEPT` in `decisions.md`) or the fixture has an ergonomics gap worth investigating before adding more callers |

### Metric 2: `journey.js` fixture duplication (continued)

| Field | Value |
|-------|-------|
| **What we measure** | Count of `journey.js`-touching test files, among the 41 current total, that hand-roll their own `mockReq` instead of importing the shared fixture |
| **Baseline** | 16 of 41 hand-roll today (confirmed 2026-10-30, down from the original 17/42 after `tsir-s1`'s own proof-of-pattern migration) |
| **Target** | 11–13 of 41 after this MVP's batch migration (3–5 files); 0 new hand-rolled fixtures on any new story (already structurally enforced by the existing `tsir-s3` check) |
| **Minimum validation signal** | At least 3 files migrated in this MVP, full suite stays green throughout — confirms incremental migration continues to work at scale, not just for the single file `tsir-s1` proved it with |
| **Measurement method** | Existing `check-journey-fixture-usage.js`, re-run and grep-count cross-checked at `/review` |
| **Feedback loop** | If migrating a file breaks its own assertions in a way not explained by a real bug, treat it as a fixture ergonomics gap — revisit the canonical shape before migrating further files |

### Metric 3: `skills.js` fixture duplication

| Field | Value |
|-------|-------|
| **What we measure** | Count of `skills.js`-touching test files, among the 45 current total, that hand-roll their own `mockReq` instead of importing a shared fixture |
| **Baseline** | 12 of 45 hand-roll today (confirmed 2026-10-30) |
| **Target** | 11 of 45 after one proof-of-pattern migration in this MVP; 0 new hand-rolled fixtures on any new `skills.js`-touching story after this MVP ships |
| **Minimum validation signal** | The proof-of-pattern migration's existing assertions pass unchanged; the new structural check correctly flags a hand-rolled fixture and passes a shared-fixture-using file (mutation-test discipline, same as `tsir-s3`) |
| **Measurement method** | New structural check script (same shape as `check-journey-fixture-usage.js`), grep-count cross-checked at `/review` |
| **Feedback loop** | Same as `tsir`'s own adoption feedback loop — an override without a logged `RISK-ACCEPT` triggers a revisit of the enforcement mechanism |

### Metric 4: Journey-seed-endpoint classification completeness

| Field | Value |
|-------|-------|
| **What we measure** | Whether each of the 5 journey-related `/test/seed-*` endpoints has a documented redundant-vs-legitimate classification |
| **Baseline** | 0 of 5 classified today — this is the exact unknown this story resolves |
| **Target** | 5 of 5 classified, each with a named verdict (redundant → named as a correctly-sized fast-follow candidate; legitimate → documented and closed) |
| **Minimum validation signal** | All 5 classified with a concrete verdict; if any are found redundant, at least one is named with a bounded scope, not left vague |
| **Measurement method** | The classification artefact itself (`artefacts/2026-10-30-test-fixture-hardening-continuation/research/tfhc-s4-journey-seed-endpoint-classification.md`), reviewed at this story's own `/definition-of-done` |
| **Feedback loop** | If the classification reveals a genuinely large hidden problem (contradicting this session's own narrowing from "13 endpoints" to "5 journey-related"), log an `/improve` candidate — the original audit's framing needed verification before being trusted, and that lesson should feed back into how future audits are scoped |

### Metric 5: `products.js`/`journeys.js` duplication (spike)

| Field | Value |
|-------|-------|
| **What we measure** | Whether `products.js` and/or `journeys.js` carry the same hand-rolled-fixture problem confirmed for `skills.js` (12/45), and the resulting verdict |
| **Baseline** | `[UNKNOWN BASELINE]` — neither file has been audited yet; that is this spike's job |
| **Target** | A confirmed duplication count for each file, plus a recorded PROCEED / DEFER / REJECT verdict. If PROCEED: the walking-skeleton implementation for whichever is confirmed lands within this same MVP |
| **Minimum validation signal** | The spike completes with a recorded verdict — a DEFER/REJECT outcome still satisfies this signal, since the point is resolving the unknown, not guaranteeing a fix |
| **Measurement method** | The spike's own verdict artefact (`spikes/`, per this repo's existing spike convention) |
| **Feedback loop** | If verdict is PROCEED but implementation doesn't land in this MVP's own cycle for capacity reasons, it must be logged explicitly as a named fast-follow (per `discovery.md` Out-of-Scope item 2) — not silently dropped |

### Metric 6: Parallelization risk resolution (spike)

| Field | Value |
|-------|-------|
| **What we measure** | How many of the 64 subprocess-spawning files named in the original `test-suite-infra-refactor` discovery are still not behind the `stis-s1` D37 adapter, and the resulting verdict |
| **Baseline** | `[UNKNOWN BASELINE]` — the original discovery confined the risk to "known call sites" but never enumerated them |
| **Target** | A precise list of remaining at-risk files, plus a recorded PROCEED / REDESIGN / DEFER verdict. If PROCEED: `scripts/run-all-tests.js` parallelization implementation lands within this same MVP |
| **Minimum validation signal** | The spike completes with a recorded verdict and a precise (not vague) remaining-risk count, regardless of whether the verdict is PROCEED or REDESIGN/DEFER |
| **Measurement method** | The spike's own verdict artefact |
| **Feedback loop** | If REDESIGN/DEFER, the precise remaining-risk list becomes the input to a future, correctly-scoped discovery for parallelization — not a vague carryover like the one this spike just resolved |

### Metric 7: Divergence-bug incidence (cross-cutting, extended scope)

| Field | Value |
|-------|-------|
| **What we measure** | Count of confirmed bugs caused by silently-divergent test fixture defaults — the `ctpl-s1` bug class — across `journey.js`, `skills.js`, or E2E seed-journey, after this MVP ships |
| **Baseline** | 1 confirmed occurrence (`ctpl-s1`), `journey.js`-specific, before this MVP |
| **Target** | 0 new occurrences across any of the 3 surfaces after this MVP ships |
| **Minimum validation signal** | No new occurrence within the next 3 stories touching any of `journey.js`, `skills.js`, or E2E seed-journey after this MVP |
| **Measurement method** | `workspace/capture-log.md` entries tagged to this bug class, reviewed at each `/definition-of-done` for a story touching any of these 3 surfaces |
| **Feedback loop** | A new occurrence is a direct regression of this MVP's core premise, not a deferrable finding — open a fast-follow story immediately rather than logging it for a later slice |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| E2E seed-fixture duplication (m1) | tfhc-s1 | Covered |
| `journey.js` duplication, continued (m2) | tfhc-s2 | Covered |
| `skills.js` duplication (m3) | tfhc-s3 | Covered |
| Journey-seed-endpoint classification (m4) | tfhc-s4 | Covered |
| `products.js`/`journeys.js` duplication (m5) | tfhc-s5 (spike — run via `/spike`, not a standard story; PROCEED unlocks a follow-on implementation story within this epic) | Covered, pending spike |
| Parallelization risk resolution (m6) | tfhc-s6 (spike — run via `/spike`, not a standard story; PROCEED unlocks a follow-on implementation story within this epic) | Covered, pending spike |
| Divergence-bug incidence, extended (m7) | tfhc-s1, tfhc-s2, tfhc-s3 (cross-cutting) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
