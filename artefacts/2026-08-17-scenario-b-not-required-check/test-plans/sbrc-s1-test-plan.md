# Test Plan: Add "Scenario B E2E (staging)" to master's required status checks (sbrc-s1)

**Story:** artefacts/2026-08-17-scenario-b-not-required-check/stories/sbrc-s1-add-scenario-b-to-required-checks.md
**Track:** Short-track (config-only, no source files touched)

---

## Test Cases

Per the story's own Architecture Constraints, this reuses existing test files — no new test file is written.

| Test | AC | Type | Description |
|------|----|------|-------------|
| `check-b2-ci-gate-config.js` T12 | AC1, AC2 | Live GitHub API check | `"Scenario B E2E (staging)"` is present in the master ruleset's `required_status_checks` |
| `check-a5-ci-gate-config.js` T12 (regression) | AC1 (no removal) | Live GitHub API check | `"Scenario A E2E (staging)"` remains present, unaffected by this story's addition |
| Manual inspection | AC3 | Config verification | Ruleset `enforcement: "active"` and the `required_status_checks` rule type block merge when a listed check fails (GitHub's own documented ruleset semantics) — not verified via an actual broken PR, per the story's own explicit instruction that this would be unnecessarily disruptive |

## Out of Scope (per story)

- Any change to Scenario A's required-check status.
- Any change to the Scenario B E2E job itself (workflow YAML).
- Auditing whether any other CI job should also be required.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
