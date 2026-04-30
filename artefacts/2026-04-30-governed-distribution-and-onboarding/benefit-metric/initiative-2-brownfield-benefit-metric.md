# Benefit Metric: Initiative 2 — Brownfield Entry

<!--
  Produced by /benefit-metric skill — 2026-04-30.
  Initiative 2 is sequenced after Initiative 1 (onboarding + lockfile) is fully delivered.
  Scope: /orient brownfield entry routing (Entry A/B/C), retrospective story path.
  Entry condition: Initiative 1 stories merged; /orient skill operational before I2 implementation begins.
-->

**Discovery reference:** artefacts/2026-04-30-governed-distribution-and-onboarding/discovery.md
**Date defined:** 2026-04-30
**Metric owner:** Hamish — Platform Maintainer
**Reviewers:** Hamish — Platform Maintainer

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

Initiative 2 tests the hypothesis that three named brownfield entry patterns (A: story-first, B: code-first, C: no-history) cover the actual distribution of incoming teams who want to adopt the platform without abandoning their existing investments. The product metric (at least one brownfield team reaches a supported entry path in one concierge interaction) validates the routing design. The meta metric (attribution evidence from a non-engineering contributor via brownfield entry) validates that the I3 governance model works end-to-end on a real brownfield artefact. Meta-benefit flag is Yes because the success condition for this initiative includes confirming or invalidating the Assumption 2 from the discovery artefact — that the three patterns cover the real distribution.

---

## Tier 1: Product Metrics (User Value)

### M1: Brownfield team reaches supported entry path in one /orient interaction

| Field | Value |
|-------|-------|
| **What we measure** | Whether a team with an existing codebase (no prior platform artefacts) can run `/orient` once and receive a specific, named entry path (Entry A, B, or C) with the first skill to run and why — without requiring a follow-up interaction or out-of-band support to determine which path applies to them |
| **Baseline** | No supported brownfield entry path exists. Teams with existing codebases who have enquired about adoption have been advised to start fresh (/discovery), effectively abandoning their existing investment. Zero brownfield adoptions have been completed using the platform. |
| **Target** | At least one brownfield team completes a real delivery cycle (through at least /discovery → /benefit-metric) via one of the three entry paths, without requiring platform-team support beyond the initial `/orient` routing recommendation |
| **Minimum validation signal** | At least one team is correctly routed to Entry A, B, or C by `/orient` in a real session (not a demo or walkthrough) within 60 days of I2 merge |
| **Measurement method** | Platform maintainer records each brownfield adoption attempt: which entry path was recommended, whether the team followed it, and whether they required any out-of-band help. Logged as metric signal per adoption. First recorded adoption is the minimum signal confirmation. |
| **Feedback loop** | If minimum signal not met within 60 days: review the pattern with teams who expressed brownfield interest but did not proceed — determine whether the routing was wrong (wrong entry path recommended), incomplete (entry path didn't cover their actual situation), or whether there is a different blocker entirely (e.g. governance resistance). If a fourth pattern is identified that covers a real team, treat as an I2 scope extension via standard pipeline (new story, not a hotfix). |

### M2: Non-engineering contributor named in a real brownfield discovery artefact

| Field | Value |
|-------|-------|
| **What we measure** | Whether at least one brownfield entry (a team that entered the platform via Entry A, B, or C) produces a discovery artefact with a named non-engineering contributor — a person whose role is not engineer, tech lead, or platform maintainer — in the `Contributors` field, passing the I3 `H-GOV` DoR block on their first attempt |
| **Baseline** | 0 brownfield discovery artefacts exist. All prior artefacts were produced by a single engineer. This metric requires both I2 (brownfield entry path working) and I3 (governance model enforced at DoR) to be active. |
| **Target** | At least one brownfield discovery artefact with a non-engineering named contributor, produced in real production use (not a platform dogfooding run), within 90 days of I2 merge |
| **Minimum validation signal** | At least one brownfield team reaches the discovery stage and their artefact has any non-engineering contributor named (even if the full target of "real production use" is not yet confirmed) within 90 days |
| **Measurement method** | Platform maintainer reviews each brownfield discovery artefact at approval time; `Contributors` field inspected for non-engineering roles; result recorded as metric signal. Cross-referenced against I3/M1 (non-engineering attribution rate) to confirm this counts as evidence for both metrics. |
| **Feedback loop** | If minimum signal not met within 90 days but Entry A/B/C routing is confirmed working (M1 minimum met): the bottleneck is not technical but social — the brownfield teams reaching the platform may be engineer-led and not inviting non-engineering contributors. Escalate to an I3 governance review — the attribution mechanism may need reinforcement. |

---

## Tier 2: Meta Metrics (Learning / Validation)

### MM1: Entry A/B/C routing correctness across all three patterns

| Field | Value |
|-------|-------|
| **Hypothesis** | The three brownfield entry patterns (A: story-first teams, B: code-first teams, C: no-history teams) are mutually exclusive and exhaustive for the realistic range of brownfield contexts — that is, any brownfield team can be correctly assigned to exactly one entry path by `/orient` based on what it finds in their repo |
| **What we measure** | Whether `/orient`, given a repo containing each of the three brownfield signals — (A) story artefacts present, no discovery.md; (B) codebase files present, no artefacts; (C) no artefacts, no recent codebase history — correctly identifies the entry path and names the first skill to run, for all three patterns, with zero misroutes |
| **Baseline** | No brownfield detection exists in any skill. All onboarding assumes a greenfield starting point. |
| **Target** | `/orient` correctly identifies Entry A, B, or C for 100% of test scenarios covering all three patterns; zero scenarios where an incorrect entry path is recommended or no routing is produced |
| **Minimum signal** | Entry B (code-first) is the hardest path to detect (requires heuristic codebase inspection); if Entry B produces a correct routing recommendation in a real session, Entry A and C are considered validated (they are easier to detect) |
| **Measurement method** | Automated test suite (`tests/check-i2.x-brownfield-routing.js`) validates all three routing states; platform maintainer additionally runs `/orient` on a real Entry-B repo within 30 days of I2 merge and records the routing recommendation |

### MM2: Assumption 2 validation — do three patterns cover the real distribution?

| Field | Value |
|-------|-------|
| **Hypothesis** | Entry A (story-first), Entry B (code-first), and Entry C (no-history) cover the actual distribution of brownfield adoption contexts seen in practice. If a brownfield team arrives that does not fit any of the three patterns, the hypothesis is invalidated and a new pattern must be defined. |
| **What we measure** | Whether all brownfield teams who attempt adoption within the measurement window can be assigned to one of the three named entry paths, or whether any team presents a context that is not covered by A, B, or C |
| **Baseline** | Three patterns are hypothesised from surveying teams who expressed interest in adoption. No real brownfield adoption data exists. |
| **Target** | 100% of brownfield adoption attempts in the first 90 days are covered by Entry A, B, or C — no team requires a fourth pattern. If a fourth pattern is encountered, it is named, documented, and added to the I2 scope as an extension story. |
| **Minimum signal** | At least 3 distinct brownfield teams attempt adoption in the 90-day measurement window, providing enough sample to begin assessing coverage. If fewer than 3 teams attempt adoption, the assumption is deferred (not validated, not invalidated) until more data is available. |
| **Measurement method** | Platform maintainer records each brownfield adoption attempt with the entry path assigned; any case where no path fits is flagged immediately as a coverage gap; summary of A/B/C/uncovered distribution reported at 90-day mark |

---

## Metric Coverage Matrix

<!--
  Populated by /definition after stories are created.
-->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Brownfield team reaches supported entry path | i2.1 (Entry A routing), i2.2 (Entry B routing), i2.3 (Entry C routing) | Pending — /definition not yet run |
| M2 — Non-engineering contributor in brownfield artefact | i2.1, i2.2, i2.3 (H-GOV passes via brownfield entry) | Pending — /definition not yet run |
| MM1 — Entry A/B/C routing correctness | i2.1, i2.2, i2.3 | Pending — /definition not yet run |
| MM2 — Assumption 2 validation (pattern coverage) | All i2.x stories (aggregate signal) | Pending — /definition not yet run |

---

## Measurement Evidence

<!--
  Populated post-implementation in /definition-of-done and /record-signal.
-->

### M1 Evidence

*Not yet measured. Measurement window opens when I2 merges. First brownfield adoption attempt is the minimum signal.*

### M2 Evidence

*Not yet measured. Dependent on both I2 (brownfield routing) and I3 (H-GOV block) being active.*

### MM1 Evidence

*Not yet measured. Entry B routing is the most complex detection path — will be validated within 30 days of I2 merge.*

### MM2 Evidence

*Not yet measured. Minimum 3 brownfield adoption attempts needed for meaningful assessment. Measurement window: 90 days post-I2 merge.*

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on i2.x story artefacts
- Implementation approach for the brownfield detection heuristics in /orient
- Facilitation-native UI (canvas) — explicitly out of scope per discovery.md; canvas deferred to Phase 5 WS6 pending framing test results
