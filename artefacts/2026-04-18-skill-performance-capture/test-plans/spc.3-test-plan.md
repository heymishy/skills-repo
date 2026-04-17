## Test Plan: Add instrumentation instruction to `copilot-instructions.md`

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.3-agent-instruction-integration.md
**Epic reference:** artefacts/2026-04-18-skill-performance-capture/epics/e1-skill-performance-capture.md
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `copilot-instructions.md` contains `## Skill Performance Capture (instrumentation)` section with 3 required instructions | 4 tests | — | — | — | — | 🟢 |
| AC2 | Agent appends capture block to phase output artefacts when enabled:true | — | — | — | 1 scenario | Agent-runtime-behaviour | 🔴 |
| AC3 | Agent does not append capture block when enabled:false | — | — | — | 1 scenario | Agent-runtime-behaviour | 🔴 |
| AC4 | Instruction explicitly states appendix-only constraint | 1 test | — | — | — | — | 🟢 |
| AC5 | Instruction names 5 artefact types and explicitly excludes gate artefacts | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Agent appends capture block when instrumentation enabled | AC2 | Agent-runtime-behaviour | Cannot be tested by inspecting the static instruction text — requires a live agent session following the instruction. No automated test framework in this repo tests agent instruction compliance. | Manual scenario 🔴 — see verification script |
| Agent does not append capture block when instrumentation disabled | AC3 | Agent-runtime-behaviour | Same as AC2. | Manual scenario 🔴 — see verification script |

---

## Test Data Strategy

**Source:** Synthetic — tests read `.github/copilot-instructions.md` from the repo filesystem. Manual scenarios require a live context.yml configuration.
**PCI/sensitivity in scope:** No
**Availability:** Available once spc.3 is implemented.
**Owner:** Self-contained for unit tests; human operator for manual scenarios.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1, AC4, AC5 | `.github/copilot-instructions.md` | Filesystem read | None | File is the deliverable |
| AC2 | context.yml with `instrumentation.enabled: true`, a live agent session | Human operator | None | Manual verification only |
| AC3 | context.yml with `instrumentation.enabled: false`, a live agent session | Human operator | None | Manual verification only |

### PCI / sensitivity constraints

None.

### Gaps

AC2, AC3 — agent-runtime-behaviour gaps, handled as manual scenarios. Operator verifies post-implementation using a live session.

---

## Unit Tests

All tests are plain Node.js. Test file: `tests/check-spc3-instruction-integration.js`.

**T1 — AC1: section heading present**
- Name: `copilot-instructions.md contains ## Skill Performance Capture (instrumentation) heading`
- Covers: AC1
- Precondition: `.github/copilot-instructions.md` exists (it already exists in this repo)
- Action: Read file; check content includes `## Skill Performance Capture (instrumentation)`
- Expected result: heading found
- Fails before implementation: yes

**T2 — AC1: instruction to read context.yml present**
- Name: `instrumentation section instructs agent to read .github/context.yml`
- Covers: AC1 (instruction (a))
- Action: Read file; within the instrumentation section, check for text instructing the agent to read `.github/context.yml` at session start
- Expected result: text found in the section
- Fails before implementation: yes

**T3 — AC1: instruction to check instrumentation.enabled flag present**
- Name: `instrumentation section instructs agent to check instrumentation.enabled`
- Covers: AC1 (instruction (b))
- Action: Read file; within the instrumentation section, check for text referencing `instrumentation.enabled`
- Expected result: text found
- Fails before implementation: yes

**T4 — AC1: instruction to append capture block when enabled present**
- Name: `instrumentation section instructs agent to append capture block when enabled:true`
- Covers: AC1 (instruction (c))
- Action: Read file; within the instrumentation section, check for text instructing the agent to append the capture block template when enabled
- Expected result: text found
- Fails before implementation: yes

**T5 — AC4: appendix-only constraint explicitly stated**
- Name: `instrumentation section contains explicit appendix-only constraint text`
- Covers: AC4
- Action: Read file; check that the section contains the text "appendix" AND "do not modify" (or equivalent phrase stating the primary artefact body must not be altered)
- Expected result: both terms (or the explicit constraint sentence from AC4) found
- Fails before implementation: yes

**T6 — AC5: five artefact types named**
- Name: `instrumentation section names discovery.md, benefit-metric.md, story artefacts, test plan artefacts`
- Covers: AC5
- Action: Read file; check that the section references all 4 of: `discovery.md`, `benefit-metric.md`, story artefact type, test plan artefact type
- Expected result: all 4 references found
- Fails before implementation: yes

**T7 — AC5: gate artefacts explicitly excluded**
- Name: `instrumentation section explicitly excludes gate artefacts (DoR, DoD)`
- Covers: AC5
- Action: Read file; within the instrumentation section, check that gate artefacts are explicitly excluded (text referencing DoR and/or DoD as excluded)
- Expected result: exclusion text found
- Fails before implementation: yes

---

## Integration Tests

None required for static instruction text verification.

---

## NFR Tests

**NFR: Security — instruction states fidelity_self_report must not contain credentials**
- Name: `instrumentation instruction explicitly warns against session tokens/credentials in fidelity_self_report`
- Covers: NFR Security
- Action: Read file; within the instrumentation section, check for text warning against session tokens, user identifiers, or API credentials in fidelity_self_report
- Expected result: warning text found
- Fails before implementation: yes

**NFR: Consistency — field names referenced in instruction match capture block template**
- Name: `field names in instrumentation instruction match those defined in capture-block.md template`
- Covers: NFR Consistency
- Action: Read `.github/copilot-instructions.md` instrumentation section; extract field names referenced (`experiment_id`, `model_label`, `cost_tier`, `skill_name`, `artefact_path`, `run_timestamp`); verify each appears in `.github/templates/capture-block.md`
- Expected result: all 6 field names present in both files
- Fails before implementation: no (pre-implementation both are absent); passes only when both spc.2 and spc.3 are implemented
- Note: Tests for cross-story consistency — requires spc.2 to be implemented first

---

## Gap table

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Agent appends capture block in live session | AC2 | Agent-runtime-behaviour | Cannot be automated — requires a live agent session following the instruction | Manual scenario 🔴 in verification script |
| Agent suppresses capture block when disabled | AC3 | Agent-runtime-behaviour | Cannot be automated — requires a live agent session | Manual scenario 🔴 in verification script |
