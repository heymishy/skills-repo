# Benefit Metric: Skills Platform — Phase 2: Scale, Observability, and Self-Improving Harness

**Discovery reference:** artefacts/2026-04-11-skills-platform-phase2/discovery.md
**Date defined:** 2026-04-11
**Metric owner:** Hamish (platform maintainer)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative continues the Phase 1 dogfood model: the platform team delivers Phase 2 using the pipeline it is extending, simultaneously validating that the platform is self-sufficient as it scales. Tier 1 metrics track platform capability outcomes against the Phase 2 target (10+ squads, full surface model, improvement loop operational). Tier 2 meta-metrics track what the Phase 2 delivery validates about the pipeline itself — and specifically about estimation calibration and flow-findings conversion, which have Phase 1 baselines and can now be measured for the first time.

MM4 and MM5 are new additions to the meta-metric set: they use Phase 1 actuals as their baseline and begin measuring from Phase 2 delivery. No implementation story is required — the `/estimate` skill E3 mechanism and `workspace/results.tsv` / `workspace/estimation-norms.md` are already live.

---

## Tier 1: Product Metrics (Platform Capability)

### Metric 1: Second squad onboarding — full outer loop unassisted

| Field | Value |
|-------|-------|
| **What we measure** | A second squad (distinct from the platform maintainer) completes the full outer loop — discovery through DoR — for a real story using only the platform's own reference material, with no platform team assistance and no blocking external lookups. Baseline from Phase 1 MM1: zero blocking lookups, ~2.5 calendar days, 13h operator focus. |
| **Baseline** | Phase 1 MM1 actuals: zero blocking lookups, all outer loop stages completed in one session, all information in-repo. This is the before-baseline. The Phase 2 measurement is the first real-world test against a different operator. |
| **Target** | Second squad completes full outer loop in a single session with zero blocking lookups. Squad does not contact the platform team at any point during discovery through DoR. |
| **Minimum validation signal** | Second squad completes all outer loop stages without stopping, even if blocking lookups are required. Any blocking lookup is logged as a platform gap finding. Below floor: any stage that cannot complete even after a genuine attempt, requiring platform team intervention before the stage proceeds. |
| **Measurement method** | Platform maintainer observes or debrief-interviews the second squad operator after their first outer loop run. Records per stage: completed without blocking lookups (Y/N), blocking lookups logged (count and description). Single acceptance test per squad, at first outer loop completion. |
| **Feedback loop** | Blocking lookups are platform gap findings — each is a signal that reference material, a skill, or a template is insufficient. Fed into the improvement loop. If zero blocking lookups: M1 passes. If any blocking lookups: platform gap findings created, improvement agent consumes them in the next cycle. |

---

### Metric 2: Non-git-native surface adapter — passing assurance verdict

| Field | Value |
|-------|-------|
| **What we measure** | Whether at least one non-git-native surface adapter (IaC, SaaS-API, SaaS-GUI, M365-admin, or manual) produces a passing assurance verdict on a real PR — evidenced by: (1) `context.yml` declares a non-git-native surface type; (2) the assurance agent selects the correct adapter at gate time; (3) the surface-appropriate DoD gate is applied; (4) a `completed` trace is written with the correct surface type in `standardsApplied`. |
| **Baseline** | Zero — only the git-native adapter exists. No non-git-native PR has ever passed an assurance gate. |
| **Target** | First non-git-native adapter story (P2.1) produces a passing assurance verdict with all four sub-conditions met. The surface type recorded in the trace matches the `context.yml` declaration. |
| **Minimum validation signal** | Assurance agent selects the non-git-native adapter at gate time (evidenced by adapter selection path in gate log) — even if the gate verdict is fail. Adapter selection mechanism works. Gate failure at this point is a scope/AC problem, not a routing problem. |
| **Measurement method** | Platform maintainer opens the first P2.1 story PR, inspects CI gate log for adapter selection path, inspects trace for surface type in `standardsApplied`, confirms DoD gate variant applied matches declared surface type. Records: story ID, declared surface type, adapter selected (Y/N correct), trace surface type match (Y/N), DoD gate variant applied (name), gate verdict (pass/fail). Single acceptance test at P2.1 DoD. |
| **Feedback loop** | If adapter not selected correctly: routing logic in P2.1 is not operational. P2.1 cannot be marked done. If adapter selected but DoD gate variant wrong: POLICY.md floor variant lookup is broken — check `context.yml` → adapter → POLICY.md floor mapping. |

---

### Metric 3: Improvement agent — first SKILL.md diff proposal from real failure

| Field | Value |
|-------|-------|
| **What we measure** | Whether the improvement agent produces at least one SKILL.md diff proposal originating from a real Phase 2 delivery failure pattern, with a challenger pre-check result included — evidenced by: (1) a diff file present in `workspace/proposals/`; (2) the diff references a specific trace or failure pattern as its evidence source; (3) a challenger pre-check result is recorded alongside the proposal (human-assisted in Phase 2); (4) the proposal is reviewed and actioned (accepted, rejected with rationale, or deferred). |
| **Baseline** | Zero — no improvement agent exists, no proposals have ever been generated. Baseline is absence of the mechanism. |
| **Target** | At least one proposal in `workspace/proposals/` meeting all four sub-conditions, reviewed and actioned by the platform maintainer. Binary gate: mechanism exists and produced at least one real proposal from Phase 2 delivery signal. |
| **Minimum validation signal** | A diff file is present in `workspace/proposals/` from Phase 2 delivery, with a trace reference. Even without a challenger pre-check result recorded, the generation mechanism and evidence-linking mechanism work. |
| **Measurement method** | Platform maintainer inspects `workspace/proposals/` after the first P2.2 delivery cycle, confirms diff is present and references a trace, confirms challenger pre-check result (even if "manual run — human-assisted" is the record), records action taken. Single acceptance test at P2.2 DoD. |
| **Feedback loop** | If no proposal generated: improvement agent did not identify a failure pattern from Phase 2 delivery traces — check trace format compatibility and failure-cluster threshold. If proposal present but no challenger pre-check result: human-assisted pre-check step was skipped — not acceptable at DoD; pre-check is required even if manual. |

---

### Metric 4: Fleet observability — ≥2 squad states visible without manual entry

| Field | Value |
|-------|-------|
| **What we measure** | Whether the fleet viz shows at least two squad states without manual data entry by the platform maintainer — evidenced by: (1) `fleet-state.json` written by CI from at least two squad `pipeline-state.json` files; (2) pipeline-viz fleet panel rendering at least two squad cards from `fleet-state.json`; (3) no manual edits to `fleet-state.json` by the platform maintainer after CI generated it. |
| **Baseline** | Zero — no `fleet-state.json` exists. Fleet view renders with zero squads. There is no CI job aggregating squad state. Platform maintainer must check each squad repo individually. |
| **Target** | `fleet-state.json` generated by CI with ≥2 squad entries; pipeline-viz renders both without manual entry. CI aggregation job is operational. |
| **Minimum validation signal** | `fleet-state.json` written by CI with at least one squad entry — even without viz rendering. CI aggregation mechanism works. Viz rendering is a separate concern. |
| **Measurement method** | Platform maintainer triggers the CI aggregation job after at least two squads are registered in `fleet/squads/`, inspects `fleet-state.json` for ≥2 entries, opens pipeline-viz to confirm ≥2 squad cards render. Records: aggregation job triggered (Y/N), squad entries in `fleet-state.json` (count), cards rendered in viz (count), manual edits to `fleet-state.json` by maintainer (Y/N). Single acceptance test at P2.3 DoD. |
| **Feedback loop** | If CI aggregation fails: P2.3 CI job configuration is broken — check job trigger and file paths. If viz does not render: pipeline-viz fleet panel has a data-shape mismatch — check `fleet-state.json` schema against viz's consumption. If manual edit required: JSON is malformed by CI or path routing is wrong. |

---

### Metric 5: Non-engineer approval interface — DoR sign-off outside VS Code

| Field | Value |
|-------|-------|
| **What we measure** | Whether a non-engineer approver (PM, risk lead, or designated stand-in) completes a DoR sign-off action using the Jira, Confluence, or Slack/Teams interface — without opening VS Code — evidenced by: (1) approval action recorded in the non-engineer interface (Jira ticket status change, Confluence comment, or Slack/Teams response); (2) approval event triggers a corresponding update in `pipeline-state.json`; (3) approver confirms they did not open VS Code during the action. |
| **Baseline** | Zero — all DoR sign-offs today require VS Code or direct `pipeline-state.json` edit by the platform maintainer on behalf of the approver. No non-engineer approval surface exists. |
| **Target** | At least one real DoR sign-off completed via a non-engineer interface, with all three sub-conditions met. The approver is a genuine non-engineer (not the platform maintainer acting in a proxy capacity). |
| **Minimum validation signal** | Approval action recorded in the non-engineer interface — even if the `pipeline-state.json` update is not yet automated (manual update by maintainer based on the interface record is acceptable as minimum signal). Integration plumbing is a follow-on; the interface existing and capturing intent is the signal. |
| **Measurement method** | Platform maintainer designates a non-engineer approver for a Phase 2 story DoR, asks them to complete the sign-off via the configured interface, records: interface used (Jira/Confluence/Slack/Teams), approver role (non-engineer Y/N), VS Code opened (Y/N), `pipeline-state.json` updated (Y/N — manual or automated). Single acceptance test at P2.3 DoD. |
| **Feedback loop** | If approver could not complete action without VS Code: interface is not accessible or intuitive for the approver persona — iterate before DoD. If interface action did not trigger `pipeline-state.json` update: integration plumbing between interface and state file is broken or absent. |

---

## Tier 2: Meta Metrics (Dogfood Validation)

### Meta Metric 1: Solo operator outer loop — Phase 2 calibration

*Continued from Phase 1 MM1. Phase 1 actuals provide the baseline for Phase 2 comparison.*

| Field | Value |
|-------|-------|
| **Hypothesis** | Phase 2 outer loop (with ~14 stories, more complex surface scope, and pipeline evolution stories in scope) completes in ≤ 3 calendar days at 50% engagement, with ≤ 1 blocking external lookup |
| **What we measure** | Same as Phase 1 MM1: all outer loop stages complete, blocking lookups logged. Phase 2 adds one sub-condition: outer loop calendar span ≤ Phase 1 × 1.5 (≤ 3 days for ~14 stories at 50% engagement, given Phase 1 was ~2.5 days for 8 stories). Scope increase must not produce a disproportionate time increase. |
| **Baseline** | Phase 1 actuals (MM1 Evidence Record): ~2.5 calendar days, ~13h operator focus, zero blocking lookups, 8 stories. Engagement: 50%. Phase 2 E1 estimate: ~2 calendar days, ~32h focus, ~14 stories. |
| **Target** | All outer loop stages complete with ≤ 1 blocking lookup; calendar span ≤ 3 days; focus H/story within 25% of Phase 1 baseline (≤ 2.9h/story). |
| **Minimum signal** | All outer loop stages complete (regardless of blocking lookups and calendar span). Below floor: any stage that cannot complete. |
| **Measurement method** | Operator records gap log in real time. At /levelup E3: compare calendar days, focus hours, and h/story against Phase 1 baseline. Records feed into MM4 derivation automatically. |
| **Feedback loop** | Calendar span above target: outer loop phases not running in parallel (Phase 1 flow finding: parallelise review + test-plan + DoR). Blocking lookups above target: reference material gaps or new skill coverage gaps — each becomes an improvement agent input. |

---

### Meta Metric 2: Cross-session resume — Phase 2 ISO datetime upgrade

*Continued from Phase 1 MM2. Phase 2 adds `startedAt`/`completedAt` ISO datetime requirement per decisions.md ARCH 2026-04-11.*

| Field | Value |
|-------|-------|
| **Hypothesis** | `startedAt`/`completedAt` ISO datetimes in `state.json` cycle blocks (introduced Phase 2) enable fully automatic E3 phase duration derivation with no JSONL fallback required |
| **What we measure** | At Phase 2 /levelup E3: tier-1 source ("state.json startedAt/completedAt") used for all phase duration rows — no tier-2 or tier-3 fallback required for any phase. This validates the ISO datetime upgrade delivers its intended benefit. |
| **Baseline** | Phase 1 used `completedDate: YYYY-MM-DD` (date-only) — every E3 phase row sourced as "date-only (±12h precision)" requiring timestamp interpolation. Tier-1 source never used in Phase 1. |
| **Target** | Phase 2 E3: all phase duration rows sourced as "tier-1 (state.json ISO datetime)" — zero rows falling back to tier-2 or tier-3. |
| **Minimum signal** | At least half the phase rows use tier-1 sourcing — ISO datetime upgrade is partially operational. Below floor: zero tier-1 rows (Phase 2 cycle blocks still using date-only fields). |
| **Measurement method** | At Phase 2 /levelup, the E3 step presents the phase duration derivation table with source tier per row. Count of tier-1 rows is the measurement. Fully automatic — no manual input needed. |
| **Feedback loop** | If tier-1 rows < total rows: specific skills are not writing `startedAt`/`completedAt` at phase begin/exit. Each missing skill is an improvement candidate. If zero tier-1 rows: ISO datetime requirement not implemented in any skill — blocked /estimate E3 benefit; treat as a Phase 2 delivery gap. |

---

### Meta Metric 3: Improvement loop — first proposal reviewed within one feature cycle

*New in Phase 2. Depends on P2.2 delivery.*

| Field | Value |
|-------|-------|
| **Hypothesis** | The improvement agent generates a reviewable SKILL.md diff proposal within the Phase 2 delivery cycle, with evidence, rationale, and a challenger pre-check result — and the platform maintainer completes a review action (accept/reject/defer) within the same cycle |
| **What we measure** | Two sub-conditions: (1) at least one proposal in `workspace/proposals/` with evidence source, rationale, and challenger pre-check result recorded; (2) action taken by platform maintainer (accept, reject with rationale, or defer to Phase 3) documented in the proposal file. |
| **Baseline** | Zero — no improvement loop exists. No proposals have ever been generated or reviewed. |
| **Target** | Both sub-conditions met within Phase 2 delivery cycle. Binary — the loop either completes an end-to-end cycle or it doesn't. |
| **Minimum signal** | Sub-condition 1 met (proposal present with evidence and pre-check). Review action not yet taken. Loop generation mechanism works; review cadence is a process maturity question. |
| **Measurement method** | Platform maintainer inspects `workspace/proposals/` at Phase 2 /levelup. Records: proposal count, evidence references, challenger pre-check recorded (Y/N), action taken (accept/reject/defer/none). |
| **Feedback loop** | If no proposal: improvement agent did not trigger from Phase 2 traces — check failure threshold and trace format. If proposal but no challenger pre-check: human pre-check step was skipped — treat as a delivery gap before DoD. If proposal reviewed but rejected: rationale in proposal file; rejected proposals are still valid evidence the loop is operational. |

---

### Meta Metric 4: Estimation calibration accuracy

| Field | Value |
|-------|-------|
| **Hypothesis** | E2 estimate error for outer loop focus time falls below 20% by feature 3 — meaning the `/estimate` skill's E2 model produces reliable forecasts once the normalisation table has 3+ rows |
| **What we measure** | `\|E2 outerLoopFocusH − actual outerLoopFocusH\| ÷ actual outerLoopFocusH` — expressed as a percentage. Computed automatically at each `/levelup` E3 run from `workspace/results.tsv` and `workspace/estimation-norms.md`. Phase 2 is feature 2 in the normalisation table (feature 1 = Phase 1, no prior E2). Target fully evaluable by feature 3. |
| **Baseline** | Phase 1 actuals row in `workspace/estimation-norms.md`: no prior estimate (e1 = null, e2 = null); only actuals recorded. Baseline is established — delta computation is not yet possible until E2 exists for a completed feature. Phase 2 E1 recorded (86.7% gauge start); E2 will be recorded at /definition exit. |
| **Target** | `\|E2 − actual\| / actual < 20%` by feature 3. Measured automatically from `results.tsv` at each `/levelup` E3 run. |
| **Minimum validation signal** | E2 estimate recorded at /definition exit for Phase 2; E3 actuals recorded at /levelup; delta row present in `results.tsv`. The comparison mechanism works. Error percentage above 20% is a calibration signal, not a failure of the measurement mechanism. |
| **Measurement method** | Automatic — `/estimate` E3 reads `results.tsv`, computes delta per row, reports error percentage in E3 calibration summary. No manual measurement step. Operator confirms result at /levelup. |
| **Feedback loop** | If error remains above 20% after feature 3: engagement fraction bands in `/estimate` E1/E2 prompt are miscalibrated for this team's working pattern. Revision candidates: adjust the 2h/day baseline assumption; adjust band boundaries (0.25/0.50/0.75/0.90); or add a per-story complexity multiplier. Each revision requires a decisions.md ARCH entry before implementation. |

---

### Meta Metric 5: Flow findings conversion rate

| Field | Value |
|-------|-------|
| **Hypothesis** | Flow findings logged by `/estimate` E3 are actionable and acted upon within the following feature cycle — indicating the findings format is specific enough to drive improvement |
| **What we measure** | Percentage of flow findings logged during Phase 1 E3 (and Phase 2 E3) that result in a documented pipeline improvement — either a decisions.md entry, a new story, or a merged SKILL.md change — within 2 features of the finding being logged. Operator confirms at each `/levelup` whether prior findings were actioned. Measurement: count of actioned findings ÷ total logged findings × 100. |
| **Baseline** | Zero — no prior flow findings exist to have been actioned. Phase 1 E3 logged 2 flow findings (parallel outer loop; inner loop is dispatch-and-merge). Phase 2 will be the first opportunity to confirm whether those findings were actioned. |
| **Target** | ≥50% of logged flow findings result in a pipeline improvement (decisions.md entry, story, or merged change) within 2 features. Evaluated at Phase 2 /levelup for the Phase 1 findings, then at Phase 3 /levelup for Phase 2 findings. |
| **Minimum validation signal** | At least one flow finding from Phase 1 actioned (decisions.md entry, story, or merged change) by Phase 2 /levelup. Below floor: zero Phase 1 findings actioned at Phase 2 /levelup — indicates findings are too vague to act on. |
| **Measurement method** | Operator reviews each logged flow finding at /levelup and records: finding description, action taken (decisions.md entry / story slug / merged PR / none), action date. Actioned = at least one action taken. Confirmation is a manual review step at each /levelup. |
| **Feedback loop** | If conversion rate below 50% after feature 3: findings are too vague — revise `/estimate` E3 flow findings format to require a specific story slug or decisions.md entry as the action item at the time of logging, not at the next /levelup review. Revision requires a SKILL.md change through the normal pipeline. |

---

## Metric Coverage Matrix

*Populated by /definition after stories are written. Every metric must have at least one story. Every story must reference at least one metric.*

| Metric | Primary stories | Secondary / enabling stories | Coverage status |
|--------|----------------|------------------------------|-----------------|
| M1 — Second squad outer loop unassisted | p2.9 (removes discipline-lookup blocker), p2.10 (removes Bitbucket CI blocker) | p2.4 (AGENTS.md adapter enables non-GitHub squads), p2.1/p2.2/p2.3 (definition skill improvements reduce rework loops) | Covered — all 13 stories available |
| M2 — Non-git-native adapter assurance verdict | p2.5a (IaC + SaaS-API adapters), p2.5b (SaaS-GUI + M365-admin + manual adapters), p2.4 (AGENTS.md), p2.6 (EA registry Path A) | p2.10 (Bitbucket squad M2 evidence path unblocked) | Covered — 5 direct stories across P2.1 scope |
| M3 — Improvement agent first proposal | p2.11 (trace interface + failure/staleness detection + proposal generation), p2.12 (challenger pre-check + review workflow + improvement-agent SKILL.md) | — | Covered — 2 direct stories; sequenced after first inner loop batch |
| M4 — Fleet observability ≥2 squads | p2.7 (per-squad registry files + CI aggregation + fleet-state.json + viz fleet panel) | — | Covered — 1 direct story |
| M5 — Non-engineer approval interface | p2.8 (channel hint routing + non-engineer sign-off action + pipeline-state.json dorChannel/dorApprover) | p2.7 (fleet registry prerequisite for off-VS-Code sign-off targeting) | Covered — 1 direct story; depends on p2.7 DoD |
| MM1 — Solo operator outer loop Phase 2 | p2.1 (D1/D2/D3 — definition improvements), p2.2 (D4 — review incremental write), p2.3 (D8/D9/B1-enforce — template improvements) | All Phase 2 stories (outer loop dogfood signal); p2.9 (discipline blocking lookup eliminated) | Covered — direct delivery via E1 stories |
| MM2 — Cross-session resume ISO datetime | p2.2 (D4 — /review incremental write adds startedAt/completedAt to state.json write path) | — | Covered — 1 direct story |
| MM3 — Improvement loop end-to-end | p2.11 (proposal generation), p2.12 (challenger pre-check + review action recorded) | — | Covered — 2 direct stories; same sequencing constraint as M3 |
| MM4 — Estimation calibration accuracy | No story — measured automatically via \/estimate\ E3 + esults.tsv\ at Phase 2 /levelup | — | No story required — measurement mechanism already live from Phase 1 |
| MM5 — Flow findings conversion rate | p2.1 (D1/D2/D3 pipeline evolution), p2.2 (D4), p2.3 (D8/D9/B1-enforce), p2.9 (discipline standards gap finding resolved) | — | Covered — flow findings from Phase 1 /levelup resolved in E1 + E4 |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
