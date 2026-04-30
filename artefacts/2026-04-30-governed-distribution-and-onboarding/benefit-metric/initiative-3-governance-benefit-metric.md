# Benefit Metric: Initiative 3 — Governance Model Prerequisite

<!--
  Produced by /benefit-metric skill — 2026-04-30.
  Initiative 3 is the sequencing prerequisite for Initiatives 1 and 2.
  This artefact must be active before any I1 or I2 stories are written.
  Scope: attribution fields in /discovery + /benefit-metric SKILL.md templates;
  new H-GOV DoR hard block in /definition-of-ready SKILL.md.
-->

**Discovery reference:** artefacts/2026-04-30-governed-distribution-and-onboarding/discovery.md
**Date defined:** 2026-04-30
**Metric owner:** Hamish — Platform Maintainer
**Reviewers:** Hamish — Platform Maintainer

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

Initiative 3 is a governance tooling change — it modifies platform skill files and the DoR hard block set. It tests two hypotheses simultaneously: (1) that requiring attribution fields in the template will produce substantively different artefact behaviour, and (2) that a DoR hard block is the right enforcement mechanism rather than a softer warning. Both hypotheses must be confirmed before Initiatives 1 and 2 surface work is justified.

---

## Tier 1: Product Metrics (User Value)

### M1: Non-engineering outer loop attribution rate

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of new discovery artefacts produced after Initiative 3 ships that contain at least one named non-engineering contributor in the `Contributors` field (a contributor whose role is not engineer, tech lead, or platform maintainer) |
| **Baseline** | 0% — all 11 prior features in this platform's own pipeline were produced by a single engineer with no non-engineering contributors named in any artefact |
| **Target** | ≥50% of new discovery artefacts within 90 days of Initiative 3 merge carry at least one non-engineering named contributor |
| **Minimum validation signal** | At least 1 production discovery artefact (not a test run, not this platform's own dogfooding) with a non-engineering contributor named within 30 days of Initiative 3 merge |
| **Measurement method** | Platform maintainer reviews the `Contributors` field of each new `discovery.md` at approval time; count logged as a metric signal in `pipeline-state.json` under this feature's `metrics` array; reviewed at 30-day and 90-day marks |
| **Feedback loop** | At 30-day mark: if minimum signal not met, run the accountability avoidance test from the ideation artefact — present two template variants to 2–3 senior stakeholders and determine whether the field design is causing avoidance. At 90-day mark: if target not met, escalate to a platform governance review; consider whether H-GOV needs strengthening (e.g. section-level attribution) or whether the root cause is distribution reach rather than governance design |

---

## Tier 2: Meta Metrics (Learning / Validation)

### MM1: H-GOV enforcement correctness

| Field | Value |
|-------|-------|
| **Hypothesis** | A DoR hard block on missing or empty `Approved By` will reliably surface attribution gaps before implementation begins, with a message specific enough that the operator knows exactly what to fix |
| **What we measure** | Whether a DoR run on a story whose discovery artefact has an empty `Approved By` field produces a `H-GOV` failure with a message that (a) names the missing field, (b) identifies the artefact path, and (c) describes what a valid entry looks like |
| **Baseline** | Block does not exist — all DoR runs today pass attribution check unconditionally; engineer-only artefacts reach implementation with no governance signal |
| **Target** | 100% of DoR runs on attribution-gap stories correctly fail `H-GOV` with the three-part message; zero false positives (artefacts with valid attribution should not trigger `H-GOV`) |
| **Minimum signal** | At least one confirmed `H-GOV` failure demonstrated in a real DoR session within 14 days of Initiative 3 merge, using an artefact with a deliberately empty `Approved By` field |
| **Measurement method** | Platform maintainer runs DoR on one test artefact immediately post-merge; result recorded in this metric's evidence field; ongoing — every DoR run output is reviewed for `H-GOV` correctness and false-positive absence |

### MM2: Attribution field completeness rate

| Field | Value |
|-------|-------|
| **Hypothesis** | Required template fields (Contributors, Reviewers, Approved By) with a DoR enforcement backstop will produce complete attribution records without operators gaming the block with placeholder text |
| **What we measure** | Percentage of new discovery artefacts produced after Initiative 3 ships where all three fields (Contributors, Reviewers, Approved By) contain substantive entries — defined as: name present, role present, not placeholder text `[Name — Role]` or equivalent |
| **Baseline** | 0% — fields do not exist in the current discovery template |
| **Target** | 100% — the combination of template required fields and H-GOV enforcement should leave no path to approval with empty attribution |
| **Minimum signal** | The discovery artefact for Initiative 1 (the immediately following initiative in this feature) has all three fields substantively populated |
| **Measurement method** | Platform maintainer inspects each new `discovery.md` at approval time; field completeness logged in metric signal; a text-presence check for placeholder patterns (`\[Name`) flags potential gaming |

### MM3: Platform dogfood attribution demonstration

| Field | Value |
|-------|-------|
| **Hypothesis** | This platform can dogfood its own governance model — the I1 and I2 discoveries produced after I3 ships will have complete attribution, demonstrating that the mechanism works on real production artefacts before wider distribution |
| **What we measure** | Whether the discovery artefacts for Initiatives 1 and 2 (produced in the same feature delivery pipeline as I3) have complete, substantive attribution fields including at least one non-engineering named contributor |
| **Baseline** | Not applicable — artefacts do not exist yet |
| **Target** | Both I1 and I2 discovery artefacts have complete attribution at approval; at least one non-engineering contributor present in each |
| **Minimum signal** | I1 discovery artefact (next in sequence) has complete attribution; I3 is considered validated on this metric if I1 passes |
| **Measurement method** | Platform maintainer records contributor list at I1 and I2 discovery approval; compared against baseline |

---

## Metric Coverage Matrix

<!--
  Populated by /definition after stories are created.
-->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Non-engineering attribution rate | i3.1 (adds attribution fields that enable measurement), i3.2 (surfaces gaps at benefit-metric), i3.3 (enforces at DoR) | ✅ Covered |
| MM1 — H-GOV enforcement correctness | i3.3 (adds H-GOV hard block to /definition-of-ready) | ✅ Covered |
| MM2 — Attribution field completeness rate | i3.1 (adds Contributors/Reviewers/Approved By to /discovery template), i3.2 (acknowledgement step ensures benefit-metric artefacts note completeness) | ✅ Covered |
| MM3 — Platform dogfood attribution | i3.1 + i3.2 together create the mechanism; evidence comes from the I1 discovery artefact (produced after i3.1 merges) | ✅ Covered — evidence deferred to I1 discovery approval |

---

## Measurement Evidence

<!--
  Populated post-implementation in /definition-of-done and /record-signal.
-->

### M1 Evidence

*Not yet measured. Baseline confirmed: 0% from artefact audit of all 11 prior features (engineer-only contributors throughout).*

### MM1 Evidence

*Not yet measured. Block does not exist — will be tested within 14 days of Initiative 3 merge.*

### MM2 Evidence

*Not yet measured. Fields do not exist in current template.*

### MM3 Evidence

*Not yet measured. I1 discovery artefact is the measurement instrument.*

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on i3.x story artefacts
- Implementation approach for the attribution fields or H-GOV block
- The exact attribution format (Name — Role — Date is the proposed format; stories define the spec)
- Sprint targets or velocity — these metrics are outcome-based

---

## Contributors

- Hamish — Platform Maintainer

## Reviewers

- Hamish — Platform Maintainer

## Status

Active — Initiative 3 metrics are live from 2026-04-30.
