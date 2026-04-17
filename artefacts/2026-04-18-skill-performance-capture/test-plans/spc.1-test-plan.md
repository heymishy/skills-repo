## Test Plan: Define `context.yml` instrumentation config schema

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.1-context-yml-instrumentation-config.md
**Epic reference:** artefacts/2026-04-18-skill-performance-capture/epics/e1-skill-performance-capture.md
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `contexts/personal.yml` contains `instrumentation:` block with 4 documented fields | 2 tests | — | — | — | — | 🟢 |
| AC2 | context.yml with enabled:true and all fields present — all 4 fields parseable | 1 test | — | — | — | — | 🟢 |
| AC3 | context.yml with enabled:true and missing experiment_id — field is absent/null (schema permits detection) | 1 test | — | — | — | — | 🟢 |
| AC4 | enabled:false — no capture blocks expected (runtime behaviour) | — | — | — | 1 scenario | Cross-story-dependency | 🟡 |
| AC5 | `contexts/personal.yml` has instrumentation off by default with workflow documented in comment | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Runtime no-block-produced behaviour | AC4 | Cross-story-dependency | AC4 describes behaviour produced by spc.3 (the agent instruction), not by the config schema addition. The schema cannot be unit-tested for "no blocks produced" — that is runtime conditional behaviour. RISK-ACCEPT logged: decisions.md entry 1-M1 | Manual scenario — see verification script. spc.3 test plan owns the automated test for this behaviour. |

---

## Test Data Strategy

**Source:** Synthetic — tests read the actual committed `contexts/personal.yml` file and construct minimal in-memory YAML strings for AC2 and AC3.
**PCI/sensitivity in scope:** No
**Availability:** Available once spc.1 is implemented (the file is the deliverable)
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `contexts/personal.yml` at repo root | Filesystem read | None | File is the deliverable — tests fail until it exists and has the correct content |
| AC2 | Minimal YAML string: `instrumentation: {enabled: true, experiment_id: "test-exp", model_label: "claude-sonnet-4-6", cost_tier: "premium"}` | Inline in test | None | |
| AC3 | Minimal YAML string: `instrumentation: {enabled: true, model_label: "claude-sonnet-4-6", cost_tier: "premium"}` (no experiment_id) | Inline in test | None | |
| AC5 | `contexts/personal.yml` | Filesystem read | None | Same file as AC1 |

### PCI / sensitivity constraints

None.

### Gaps

AC4 gap — see gap table above. Handled as manual scenario.

---

## Unit Tests

All tests are plain Node.js (no external dependencies). Test file: `tests/check-spc1-config-schema.js`.

**T1 — AC1: instrumentation block present in personal.yml**
- Name: `contexts/personal.yml contains instrumentation: block`
- Covers: AC1
- Precondition: `contexts/personal.yml` exists in repo
- Action: Read and parse the file contents (YAML parse or regex match)
- Expected result: The string `instrumentation:` appears in the file (block is present)
- Fails before implementation: yes — file has no `instrumentation:` block today

**T2 — AC1: all 4 fields documented in personal.yml instrumentation block**
- Name: `instrumentation block in personal.yml contains all 4 required fields`
- Covers: AC1
- Precondition: `contexts/personal.yml` contains `instrumentation:` block
- Action: Check file content for each of: `enabled`, `experiment_id`, `model_label`, `cost_tier`
- Expected result: All 4 field names are present in the file
- Fails before implementation: yes — fields not yet defined

**T3 — AC2: all 4 fields accessible when enabled:true**
- Name: `instrumentation block with all fields present is fully parseable`
- Covers: AC2
- Precondition: None — uses inline YAML string
- Action: Parse `instrumentation: {enabled: true, experiment_id: "exp-1", model_label: "test-model", cost_tier: "standard"}` with js-yaml or manual parse
- Expected result: `enabled === true`, `experiment_id === "exp-1"`, `model_label === "test-model"`, `cost_tier === "standard"` — all 4 accessible
- Note: Because the repo avoids external deps for check scripts, use a lightweight YAML read (or treat it as a structured string check against the actual file)
- Fails before implementation: yes — values not present in file

**T4 — AC3: missing experiment_id is detectable as absent**
- Name: `context.yml with missing experiment_id has experiment_id as absent/null`
- Covers: AC3 (schema permits detection — the field is optional by YAML structure, so absence is detectable)
- Precondition: None — uses inline YAML string
- Action: Parse YAML string with no `experiment_id` key; attempt to access `instrumentation.experiment_id`
- Expected result: Value is `undefined` or `null` — not throwing, detectable as absent
- Fails before implementation: no — this is inherent YAML behaviour, BUT the test serves as documentation that the schema design does not make experiment_id mandatory-sinker (doesn't throw; allows graceful absence detection). This test is primarily a contract test.
- Edge case flag: This AC's primary verification is via spc.5's script, per RISK-ACCEPT 1-M2

**T5 — AC5: instrumentation block is disabled by default**
- Name: `instrumentation.enabled defaults to false (or commented) in personal.yml`
- Covers: AC5
- Precondition: `contexts/personal.yml` exists with `instrumentation:` block
- Action: Read file and check that `enabled: false` or the whole block is commented out (# prefixed)
- Expected result: Block is inactive — either `enabled: false` is set, or the block lines start with `#`
- Fails before implementation: yes — block not yet present

**T6 — AC5: workflow documented in comment**
- Name: `personal.yml instrumentation block includes workflow documentation comment`
- Covers: AC5
- Precondition: `contexts/personal.yml` exists with `instrumentation:` block
- Action: Check that a comment in the instrumentation block explains how to enable it (enable by uncommenting, fill in three required fields)
- Expected result: File contains a comment with text describing the enable workflow (presence of `#` comment lines near the instrumentation block)
- Fails before implementation: yes

---

## Integration Tests

None required. spc.1 is a static template file addition with no inter-component handoffs within its own scope.

---

## NFR Tests

**NFR: Security — model_label and cost_tier are descriptive strings, no credentials**
- Name: `instrumentation fields in personal.yml are safe string types — no secret-like patterns`
- Action: Read `contexts/personal.yml`; check that none of the instrumentation field values contain patterns matching API key formats (long alphanumeric sequences, `sk-`, `Bearer`, etc.)
- Expected result: All field value placeholders or defaults are clearly descriptive strings (e.g. `"claude-sonnet-4-6"`, `"standard"`) — no secret-resembling values present

**NFR: Consistency — MC-CONSIST-02**
- This NFR is verified at spc.5 test time (field names match between schema and script). Not testable at spc.1's unit level with pre-implementation tests. Noted here for completeness; spc.5's test plan owns it.

---

## Gap table

| Gap | AC | Gap type | Reason untestable as unit | Handling |
|-----|----|----------|--------------------------|---------|
| No-blocks-produced behaviour when disabled | AC4 | Cross-story-dependency | Runtime behaviour produced by agent following spc.3 instruction, not by schema structure | Manual scenario in verification script; spc.3 test plan owns automated coverage |
