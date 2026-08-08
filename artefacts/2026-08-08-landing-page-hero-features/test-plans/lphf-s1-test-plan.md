## Test Plan: Golden trace demo — a real idea-to-shipped-code chain, walked in four frames

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s1-golden-trace-demo.md
**Epic reference:** artefacts/2026-08-08-landing-page-hero-features/epics/epic-1-landing-page-hero-features.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Exactly 4 frames, one real feature | 1 test | — | — | — | — | 🟢 |
| AC2 | Config flip swaps candidate content | 2 tests | — | — | — | — | 🟢 |
| AC3 | Losing candidate deleted before merge | — | — | — | 1 scenario | Untestable-by-nature | 🔴 |
| AC4 | Content matches real artefact files verbatim | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest/node | Handling |
|-----|----|----------|--------------------------------|---------|
| "Losing candidate's content deleted" is a pre-merge code-review fact, not a runtime behaviour | AC3 | Untestable-by-nature | There is no running system state that distinguishes "deleted" from "never existed" — this is a diff/repo-hygiene fact checkable only by inspecting the merged PR's file list | Manual scenario — pre-merge checklist item in the verification script 🔴 |

---

## Test Data Strategy

**Source:** Synthetic — the two candidate content sets are hand-authored from real repo artefact files (`interactive-kanban-boards`/`s3.1` and `code-shape-diagrams`/`csd-s2`), no live data fetch.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | The 4-frame content set for whichever candidate is currently configured | `artefacts/2026-07-24-interactive-kanban-boards/` or `artefacts/2026-07-25-code-shape-diagrams/` real files | None (confirmed via discovery `/clarify`) | Test must be candidate-agnostic — read whichever candidate the config currently selects |
| AC2 | Both candidates' content sets | Same as above, both | None | |
| AC4 | Real artefact file content for the configured candidate | Same real repo files | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### goldenTraceDemo_rendersExactly4Frames_forConfiguredCandidate

- **Verifies:** AC1
- **Precondition:** Config set to either candidate
- **Action:** Render the golden-trace hero section
- **Expected result:** Exactly 4 frame elements are present, in order: prompt, discovery snapshot, DoR snapshot, shipped feature
- **Edge case:** No

### goldenTraceDemo_switchesToKanbanContent_whenConfigSetToKanban

- **Verifies:** AC2
- **Precondition:** Config set to `interactive-kanban-boards`
- **Action:** Render the golden-trace hero section
- **Expected result:** Frame content references the real kanban story content (e.g. the operator quote from `2026-07-24-interactive-kanban-boards/discovery.md`)
- **Edge case:** No

### goldenTraceDemo_switchesToDiagramContent_whenConfigSetToDiagram

- **Verifies:** AC2
- **Precondition:** Config set to `code-shape-diagrams`
- **Action:** Render the golden-trace hero section
- **Expected result:** Frame content references the real `csd-s2` story content, and no other page behaviour (nav, auth panel, other hero cards) changes between the two config states
- **Edge case:** Yes — confirms the swap is isolated to this one section

### goldenTraceDemo_frameContentMatchesRealArtefactFile_notFabricated

- **Verifies:** AC4
- **Precondition:** Config set to either candidate
- **Action:** Compare each frame's rendered text against the actual corresponding real artefact file (discovery.md excerpt, story.md excerpt, DoR excerpt) for the configured candidate
- **Expected result:** Frame content is a verbatim (or only cosmetically truncated) substring of the real file — not paraphrased or invented text
- **Edge case:** No

---

## Integration Tests

None — this story has no cross-component handoff beyond static content rendering, already covered by the unit tests above.

---

## NFR Tests

### goldenTraceDemo_containsNoCredentialsOrPII

- **NFR addressed:** Security
- **Measurement method:** Grep the rendered frame content for credential/token/PII patterns (same check pattern already used elsewhere in this repo, e.g. `check-p4-enf-second-line.js`'s T-NFR1)
- **Pass threshold:** Zero matches for Bearer tokens, password assignments, secret assignments, API keys
- **Tool:** Node.js regex assertion in the unit test file

### goldenTraceDemo_framesReachableViaKeyboard

- **NFR addressed:** Accessibility
- **Measurement method:** Playwright Tab-walk test (same pattern as `csd-s2`'s AC4 keyboard-navigation spec)
- **Pass threshold:** Tab-only navigation reaches all 4 frames and does not trap focus (no single element focused for more than 3 consecutive Tab presses)
- **Tool:** Playwright

---

## Out of Scope for This Test Plan

- Testing the actual content decision (which candidate wins) — that's an operator judgement call, not a test assertion.
- Live regeneration/live-query behaviour — explicitly out of scope for this story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3 (losing candidate deleted) | No runtime state distinguishes "deleted" from "never existed" | Manual pre-merge checklist scenario in the verification script, marked 🔴 so it's never skipped |
