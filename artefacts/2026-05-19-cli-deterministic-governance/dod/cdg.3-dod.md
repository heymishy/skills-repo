# Definition of Done: skills advance CLI command — CI-facing state write with typed exit codes

**PR:** https://github.com/heymishy/skills-repo/pull/355 | **Merged:** 2026-05-24
**Story:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.3-*.md
**Test plan:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.3-test-plan.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| All ACs (`skills advance` CLI command, typed exit codes, atomic writes) | ✅ | `check-cdg3-advance-cli.js`, 23/23 assertions incl. "IT1b: both fields written to disk in final state" and "IT1c: no leftover .tmp file after atomic write" | Automated test, re-run fresh on current master 2026-08-17 | None |

---

## Scope Deviations

None identified in this retroactive pass.

---

## Test Plan Coverage

**Tests passing in CI:** 23/23, re-run fresh 2026-08-17.
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Atomicity: no leftover `.tmp` file after write, both fields present in final state | ✅ | IT1b/IT1c, re-run fresh, passing |

---

## Metric Signal

No formal benefit-metric artefact traced in this pass beyond the feature-level DoD (`cdg-feature-dod.md`).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. **This is the exact CLI command this session's own CLAUDE.md instructs using** ("skills advance harness rule (cdg.6)": "use `node bin/skills advance <feature-slug> <story-id> <field>=<value>...` rather than writing the JSON directly"). This entire DoD backlog pass has instead used raw Node scripts for pipeline-state.json writes throughout — a documented, deliberate deviation from this story's own established convention, justified by the scale of this backlog (161 stories) and validated each time via `check-pipeline-state-integrity.js` per CLAUDE.md's own permitted-exception clause ("bulk repairs run via an explicitly named one-off script... validate the result with `node scripts/check-pipeline-state-integrity.js` immediately after").
2. ~13 weeks live, no incidents reported. Closes out the 4-story `2026-05-19-cli-deterministic-governance` cluster gap (`cdg.5`/`cdg.6`/`cdg.7` already had real DoD artefacts, synced not re-derived).
