## Test Plan: Build the agent-driven Playwright review and validate it against a seeded issue set

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s3-agent-driven-review-validation-set.md
**Epic reference:** artefacts/2026-08-09-rubber-duck-review-capture/epics/epic-1-rubber-duck-review-capture-mvp.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Agent-driven review runs against fixtures, produces narrated commentary | — | 2 tests | — | — | — | 🟢 |
| AC2 | Commentary flags at least one of the two seeded fixtures' known gap | — | — | — | 1 scenario | Untestable-by-nature | 🔴 |
| AC3 | ≥50% detection rate on the full validation set | — | — | — | 1 scenario | Untestable-by-nature | 🔴 |
| AC4 | No false positive on a clean fixture | — | 1 test | — | — | — | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in an automated test | Handling |
|-----|----|----------|--------------------------|---------|
| Whether the agent's commentary actually names the real known gap (vs. generic praise, or a plausible-sounding but wrong observation) | AC2, AC3 | Untestable-by-nature | Judging whether free-text agent commentary correctly identifies a specific known issue is an editorial/semantic judgment, not a string-match a unit test can reliably make (a keyword-match heuristic would produce false confidence — the whole point of AC2/AC3 is measuring real detection, not keyword presence) | Manual scenario — operator reads the commentary against each fixture's known gap and records a match/no-match judgment, same as `benefit-metric.md`'s own Meta Metric 2 measurement method |

---

## Test Data Strategy

**Source:** Fixtures — the validation set is explicitly seeded from this session's own 2 confirmed real gaps (`lphf-s1`'s undeleted golden-trace candidate, `lphf-s4`'s wrong live learnings-count), reintroduced as local/preview fixtures per the story's own AC1, plus a "clean" fixture with neither injected issue for AC4.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — both seed fixtures reproduce already-well-understood, already-fixed real bugs (`gtcl-s1`/`lcdf-s1`, this same session) whose broken and fixed states are both fully known and reproducible.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A local/preview build reproducing at least the 2 seed fixture states | Real code checkout, at specific commits (pre-`gtcl-s1`/pre-`lcdf-s1` for the broken versions) | None | Reuses this repo's own git history as the fixture source — no synthetic data invented |
| AC2/AC3 | Same fixtures as AC1, plus additional known-gap fixtures added later per the story's own AC3 wording ("plus any others found later") | Same | None | Validation set may grow over time; this test plan covers the 2 seed fixtures as the MVP set |
| AC4 | A "clean," correctly-behaving version of the same feature (post-`gtcl-s1`/post-`lcdf-s1` fix) | Real code checkout, current `master` | None | The false-positive guard fixture |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — this story's mechanism (an agent narrating observations while driving a real browser) has no meaningful unit-level seam; its behaviour only exists at the integration level (a real or near-real browser session). See Integration Tests below.

---

## Integration Tests

### agentDrivenReview_runsAgainstKnownBrokenFixture_producesCommentary

- **Verifies:** AC1
- **Components involved:** The agent-driven review mechanism (built on `skill-turn-executor.js`, per the story's Architecture Constraints) → a local/preview build checked out at a pre-`gtcl-s1` commit (both golden-trace candidates still present, `ACTIVE_CANDIDATE` toggle live) → mocked LLM invocation via this repo's existing `mock-llm-gateway`
- **Precondition:** Local build checked out at the pre-`gtcl-s1` state; mock gateway on (per `mgar-s1`'s safety net — this test must never make a real LLM call)
- **Action:** Run the agent-driven review against the landing page
- **Expected result:** The mechanism completes and returns non-empty narrated commentary text — proves the run-and-produce-output mechanism works at all, before AC2/AC3's detection-quality judgment is assessed
- **Edge case:** No

### agentDrivenReview_runsAgainstSecondKnownBrokenFixture_producesCommentary

- **Verifies:** AC1
- **Components involved:** Same as above, against the pre-`lcdf-s1` state (learnings count shows `0`, not the real value)
- **Precondition:** Local build checked out at the pre-`lcdf-s1` state; mock gateway on
- **Action:** Run the agent-driven review against the landing page
- **Expected result:** Returns non-empty narrated commentary — proves the mechanism generalises across at least two different real feature areas, not hardcoded to one page/bug shape
- **Edge case:** No

### agentDrivenReview_cleanFixture_doesNotFabricateFinding

- **Verifies:** AC4
- **Components involved:** Same mechanism, against current `master` (post-fix, clean)
- **Precondition:** Local build checked out at current `master`; mock gateway on
- **Action:** Run the agent-driven review against the same landing page, now correctly behaving
- **Expected result:** The commentary does not claim there is a bug/gap in the golden-trace or learnings-count areas — a mechanical check that the commentary text does not contain a false claim of brokenness about the specific things `gtcl-s1`/`lcdf-s1` fixed (e.g. does not say both candidates are visible, does not say the count shows 0), while still allowing the agent to comment on unrelated, real things elsewhere on the page
- **Edge case:** Yes — this is the AC4 false-positive guard itself

---

## NFR Tests

### agentDrivenReview_reusesSkillTurnExecutor_notASeparateInvocationPath

- **NFR addressed:** Security / Architecture Constraints (reuse of existing LLM-invocation infrastructure, subject to the same `mgar-s1` mock-gateway safety net as every other LLM-invoking path)
- **Measurement method:** Source-level assertion that the agent-driven review's invocation code path calls into `skill-turn-executor.js` (or its exported functions) rather than constructing a separate, parallel LLM-calling mechanism
- **Pass threshold:** No second/parallel LLM-invocation code path exists outside `skill-turn-executor.js`'s own
- **Tool:** Node `fs`/`require` source inspection, following this repo's own established "shared-mechanism proof via source assertion" pattern (`.github/architecture-guardrails.md` Approved Patterns)

---

## Out of Scope for This Test Plan

- CI integration for this mode — this story runs manually/locally or via a one-off script (Story 4, `rdrc-s4`, covers CI wiring)
- Real staging — this story validates against local/preview fixtures only
- The human-narrated mode (Stories 1-2)
- Expanding the validation set beyond the 2 seed fixtures + 1 clean fixture — a future addition, not blocking this story's own MVP validation

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC2/AC3's actual detection-rate judgment is manual | Semantic correctness of free-text commentary against a known bug is not mechanically checkable without risking false confidence from a keyword-match heuristic | Manual scenario in the verification script; the N/total count itself is the audit record for Meta Metric 2, same measurement method already defined in `benefit-metric.md` |
