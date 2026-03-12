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
