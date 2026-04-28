# Test Plan: asd.1 — Audit gate story dispatch cross-check

**Story reference:** `artefacts/2026-04-29-audit-story-dispatch-crosscheck/stories/asd.1-audit-story-dispatch-crosscheck.md`
**Test framework:** Node.js built-ins (`assert`, `child_process`) — no external dependencies
**Test data strategy:** Synthetic — all test inputs are inline strings constructed in test setup. No real PR bodies, pipeline-state files, or external calls.
**E2E / browser-layout check:** Not applicable — CLI script and module only.

---

## Test list

| ID | AC | Test description | Type | Status |
|----|-----|-----------------|------|--------|
| T1 | AC1 | `extractStorySlug` returns story ID from backtick-wrapped stories/ path | Unit | Failing (RED) |
| T2 | AC1 | `extractStorySlug` returns story ID from plain (non-backtick) stories/ path | Unit | Failing (RED) |
| T3 | AC2 | `extractStorySlug` returns `""` when no stories/ path for the given feature slug | Unit | Failing (RED) |
| T4 | AC2 | `extractStorySlug` returns `""` when body contains stories/ path for a different feature slug | Unit | Failing (RED) |
| T5 | AC3 | `extractStorySlug` returns `""` and does not throw for null body | Unit | Failing (RED) |
| T6 | AC3 | `extractStorySlug` returns `""` and does not throw for empty body | Unit | Failing (RED) |
| T7 | AC4 | `buildDispatchNote("verified", storyId, issueUrl)` contains "Dispatch verified", "✅", and "Issue #207" | Unit | Failing (RED) |
| T8 | AC5 | `buildDispatchNote("not-found", storyId)` contains "⚠️" and "not found in pipeline-state" | Unit | Failing (RED) |
| T9 | AC6 | `buildDispatchNote("no-dispatch", storyId)` contains "⚠️" and "No dispatch record" | Unit | Failing (RED) |

---

## Test details

### T1 — extractStorySlug from backtick-wrapped path

**Arrange:** Body = `| Story | \`artefacts/2026-04-24-platform-onboarding-distribution/stories/p11.6-start-skill.md\` |`; featureSlug = `"2026-04-24-platform-onboarding-distribution"`
**Act:** Call `extractStorySlug(body, featureSlug)`
**Assert:** Returns `"p11.6"`

### T2 — extractStorySlug from plain (non-backtick) path

**Arrange:** Body = `See artefacts/2026-04-24-platform-onboarding-distribution/stories/sar.1-audit-record-slug-fix.md for context`; featureSlug = `"2026-04-24-platform-onboarding-distribution"`
**Act:** Call `extractStorySlug(body, featureSlug)`
**Assert:** Returns `"sar.1"`

### T3 — returns empty string when no stories/ path at all

**Arrange:** Body = `| Discovery | \`artefacts/2026-04-24-platform-onboarding-distribution/\` |`; featureSlug = `"2026-04-24-platform-onboarding-distribution"`
**Act:** Call `extractStorySlug(body, featureSlug)`
**Assert:** Returns `""`

### T4 — returns empty string when stories/ path belongs to different feature

**Arrange:** Body = `| Story | \`artefacts/2026-04-23-ci-artefact-attachment/stories/caa.1-collect-flag.md\` |`; featureSlug = `"2026-04-24-platform-onboarding-distribution"`
**Act:** Call `extractStorySlug(body, featureSlug)`
**Assert:** Returns `""`

### T5 — null body does not throw

**Arrange:** body = `null`; featureSlug = `"2026-04-24-platform-onboarding-distribution"`
**Act:** Call `extractStorySlug(null, featureSlug)`
**Assert:** Returns `""`, no exception thrown

### T6 — empty body does not throw

**Arrange:** body = `""`; featureSlug = `"2026-04-24-platform-onboarding-distribution"`
**Act:** Call `extractStorySlug("", featureSlug)`
**Assert:** Returns `""`, no exception thrown

### T7 — buildDispatchNote for verified dispatch

**Arrange:** status = `"verified"`, storyId = `"p11.6"`, issueUrl = `"https://github.com/heymishy/skills-repo/issues/207"`
**Act:** Call `buildDispatchNote("verified", "p11.6", "https://github.com/heymishy/skills-repo/issues/207")`
**Assert:** Result contains `"Dispatch verified"`, `"✅"`, and `"Issue #207"`

### T8 — buildDispatchNote for story not found

**Arrange:** status = `"not-found"`, storyId = `"p11.6"`
**Act:** Call `buildDispatchNote("not-found", "p11.6")`
**Assert:** Result contains `"⚠️"` and `"not found in pipeline-state"`

### T9 — buildDispatchNote for story with no dispatch record

**Arrange:** status = `"no-dispatch"`, storyId = `"p11.6"`
**Act:** Call `buildDispatchNote("no-dispatch", "p11.6")`
**Assert:** Result contains `"⚠️"` and `"No dispatch record"`

---

## Gap table

| Gap | AC affected | Risk | Mitigation |
|-----|-------------|------|------------|
| Workflow integration (extractStorySlug + buildDispatchNote wired into Post governed artefact chain comment step) | AC4–AC6 | Low | Verified by running the gate on a real PR after merge and inspecting the audit comment |
| pipeline-state.json lookup at runtime (finding the story by ID) | AC4–AC6 | Low | Logic is a simple array `.find()` — no test needed beyond integration check |

Both gaps acknowledged. Manual verification scenarios in verification script cover them.
