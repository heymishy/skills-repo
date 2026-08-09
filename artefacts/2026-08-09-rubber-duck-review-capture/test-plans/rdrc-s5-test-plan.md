## Test Plan: Suggest rubber-duck review for eligible hero/customer-facing stories

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s5-suggest-review-for-eligible-stories.md
**Epic reference:** artefacts/2026-08-09-rubber-duck-review-capture/epics/epic-1-rubber-duck-review-capture-mvp.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Eligible story's completion output includes a suggestion | 2 tests | — | — | — | — | 🟢 |
| AC2 | Non-eligible story's completion output has no suggestion | 1 test | — | — | — | — | 🟢 |
| AC3 | Declining/ignoring the suggestion never blocks completion | 1 test | — | — | — | — | 🟢 |
| AC4 | Eligibility criteria are an explicit, editable list — not hardcoded inline | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — fixture story artefacts with varying `domain` tags and hero-feature markers, exercising the eligibility rule against known-eligible and known-ineligible cases.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fixture story with `domain: [web-ui]` and a hero-feature marker | Hand-authored fixture | None | Positive case |
| AC2 | A fixture story with no matching domain and no hero-feature marker | Hand-authored fixture | None | Negative case |
| AC3 | Same as AC1, plus a simulated "decline" input | Hand-authored fixture | None | |
| AC4 | The eligibility rule's own source/config location | Real implementation file (`context.yml` or a documented constant, per Story's own AC4) | None | Confirms the rule is externally editable, not string-matched inline in the skill's own prose |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### completionOutput_includesSuggestion_whenStoryMatchesEligibilityCriterion

- **Verifies:** AC1
- **Precondition:** A fixture story artefact tagged `domain: [web-ui]` and explicitly marked as a hero/customer-facing feature
- **Action:** Generate the completion output (e.g. for `/definition-of-done` or `/branch-complete`, per the story's own choice) for this fixture
- **Expected result:** The output includes a suggestion to run the rubber-duck review tool, naming which mode is most relevant (human-narrated only, if the agent-driven mode isn't built yet at implementation time; both, once available)
- **Edge case:** No

### completionOutput_namesCorrectMode_dependingOnWhatsAvailable

- **Verifies:** AC1
- **Precondition:** Same eligible fixture, tested once with only `rdrc-s2` (human-narrated) available and once with both `rdrc-s2` and `rdrc-s4` (agent-driven) available
- **Action:** Generate completion output in both configurations
- **Expected result:** The suggestion names only the human-narrated mode in the first configuration, and can name either/both in the second — never suggests a mode that doesn't exist yet
- **Edge case:** Yes — guards against a hardcoded suggestion text that ignores which modes are actually built

### completionOutput_noSuggestion_whenStoryDoesNotMatchCriteria

- **Verifies:** AC2
- **Precondition:** A fixture story artefact with no matching domain tag and no hero-feature marker
- **Action:** Generate completion output for this fixture
- **Expected result:** No rubber-duck-review suggestion appears anywhere in the output — the nudge is targeted, not unconditional
- **Edge case:** No

### decliningTheSuggestion_neverBlocksOrDegradesCompletion

- **Verifies:** AC3
- **Precondition:** Eligible fixture story, suggestion shown
- **Action:** Simulate the operator ignoring/declining the suggestion and proceeding
- **Expected result:** The underlying skill (DoD or branch-complete) completes exactly as it would have without the suggestion ever being shown — same fields written, same pass/fail outcome, no additional gate introduced
- **Edge case:** Yes — this is the "genuinely a nudge, not a disguised gate" requirement itself

### eligibilityCriteria_areExternallyEditable_notHardcodedInSkillProse

- **Verifies:** AC4
- **Precondition:** The real implementation, post-build
- **Action:** Locate the eligibility rule's definition
- **Expected result:** The rule is expressed as an explicit, separately-editable list or config (e.g. in `context.yml` or a named, exported constant) — adding a new eligible domain or tag does not require editing the skill's own instruction prose
- **Edge case:** No

---

## Integration Tests

None beyond the unit-level fixtures above — this story's mechanism (a conditional text addition to existing skill output) has no additional cross-component seam worth a separate integration test; the "does completion still succeed" check in AC3's test already covers the one real integration point (this addition vs. the underlying skill's own completion logic).

---

## NFR Tests

### suggestionAddition_negligiblePerformanceImpact

- **NFR addressed:** Performance
- **Measurement method:** Compare completion-output generation time with and without this story's eligibility check
- **Pass threshold:** No measurable regression — a single conditional check against story metadata already in memory
- **Tool:** Simple before/after timing comparison, consistent with how this repo treats "negligible" performance NFRs elsewhere (e.g. `avpf-s1`'s own Performance NFR)

---

## Out of Scope for This Test Plan

- A mandatory gate for any condition — explicitly deferred to a future story
- Tracking/measuring the suggestion's actual effect on Meta Metric 3 — an ongoing measurement activity, not a build-time test
- Suggesting the agent-driven mode before Story 4 ships — covered by the "names correct mode" test above, not a separate exclusion

---

## Test Gaps and Risks

None identified — this is the epic's lowest-complexity story (Complexity Rating 1) with no manual-judgment ACs.
