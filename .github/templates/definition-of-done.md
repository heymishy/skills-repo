# Definition of Done: [Story Title]

<!--
  USAGE: Produced by the /definition-of-done skill after a PR is merged.
  Records whether the merged code satisfies the story's ACs, test plan, NFRs,
  and metric signal expectations.

  Outcome values:
  - COMPLETE                 — all ACs satisfied, no scope deviations
  - COMPLETE WITH DEVIATIONS — ACs satisfied; deviations recorded (surfaced by /trace)
  - INCOMPLETE               — one or more ACs not satisfied; follow-up required

  To evolve: update this template, open a PR, tag QA lead + engineering lead.
-->

**PR:** [link] | **Merged:** [YYYY-MM-DD]
**Story:** [link to story artefact]
**Test plan:** [link to test plan artefact]
**DoR artefact:** [link to DoR artefact]
**Assessed by:** [Copilot / human]
**Date:** [YYYY-MM-DD]

---

## AC Coverage

| AC | Satisfied? | Evidence | Deviation |
|----|-----------|----------|-----------|
| AC1 | ✅ / ⚠️ / ❌ | [Test name / observable behaviour] | [None / description] |
| AC2 | ✅ / ⚠️ / ❌ | [Test name / observable behaviour] | [None / description] |
| AC3 | ✅ / ⚠️ / ❌ | [Test name / observable behaviour] | [None / description] |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

<!--
  Anything implemented that was in the story or epic out-of-scope section.
  "None" is the expected and desirable value.
-->

[None / list of deviations with description and PR reference]

---

## Test Plan Coverage

**Tests from plan implemented:** [n / n total]
**Tests passing in CI:** [n / n implemented]

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| [Test name] | ✅ / ❌ | ✅ / ❌ / N/A | |

**Gaps (tests not implemented):**
[None / list with risk assessment]

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| [NFR description] | ✅ / ⚠️ / ❌ | [Results, scan output, review reference] |

---

## Metric Signal

<!--
  Does not claim success — records what measurement is now possible
  and when the metric owner should check.
-->

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| [Metric name] | ✅ / ❌ | [Timeline / date] | |

---

## Outcome

**[COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE]**

**Follow-up actions:**
[None / list actions with owner]

---

## DoD Observations

<!--
  Record any material observations about the delivery not captured elsewhere:
  - Cross-story runtime failures discovered post-merge (e.g. a file produced by
    this story caused a consuming story's CI to fail due to missing schema fields)
  - NFR gaps or guardrail entries absent at delivery time
  - Sequencing decisions that other DoD runs should be aware of
  - Any scope deviation resolved after PR open
  Tag each observation as a /levelup candidate if it should feed back to
  standards, architecture-guardrails, or skill files at the next /levelup run.
-->

[None / numbered list of observations]

---

## Operator Verification Prompt

<!--
  Optional. Paste the block below into a second independent session to spot-check
  this DoD output. Recommended for high-oversight stories or any DoD generated
  under context pressure.
-->

```
Review this Definition of Done artefact for [story title].
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
