# Definition of Ready Checklist

## Definition of Ready: Batch skill-metadata extraction to close the `--with-outer-loop` performance NFR gap

**Story reference:** artefacts/2026-09-12-outer-loop-bootstrap-perf-fix/stories/obpf-s1-batch-skill-metadata-extraction.md
**Test plan reference:** artefacts/2026-09-12-outer-loop-bootstrap-perf-fix/test-plans/obpf-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-12

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "an operator or CI job running `npx skills-repo-init --with-outer-loop`" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 6/6 tests map to the 4 ACs |
| H4 | Out-of-scope section is populated | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | Closes `rb-s5`'s own NFR: `--with-outer-loop` overhead under 3000ms |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — byte-parity of the new extraction approach against all 8 real skill files already verified in a scratch prototype before this DoR was written |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Backend/CLI tooling, no CSS |
| H-NFR | NFR profile or explicit "None" field | ✅ | Performance is this story's entire purpose; Security/Accessibility/Audit explicitly N/A |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No adapter involved — pure script-internal refactor |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track, no review | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Byte-parity pre-verified against all 8 real production skill files before this DoR, including known messy edge cases (malformed multi-line triggers in `benefit-metric`/`decisions`) — stronger evidence than a typical short-track story has at DoR time | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Standards injection

**Domain tags:** `[skills-pipeline, cli-tooling]`
**Matched standards files:** Platform Change Policy (CLAUDE.md) — `scripts/assemble-copilot-instructions.sh` changes require a PR, no direct master commit.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Batch skill-metadata extraction to close the --with-outer-loop performance NFR gap — artefacts/2026-09-12-outer-loop-bootstrap-perf-fix/stories/obpf-s1-batch-skill-metadata-extraction.md
Test plan: artefacts/2026-09-12-outer-loop-bootstrap-perf-fix/test-plans/obpf-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- ONLY touch scripts/assemble-copilot-instructions.sh (plus the one obsolete test assertion named in AC4).
- Replace get_skill_description/get_skill_triggers's per-skill invocation with ONE batched awk call across all OUTER_LOOP_SKILLS files, embedded inline (no new .awk file).
- Preserve the awk regex logic itself byte-for-byte -- only change the invocation/output-collection strategy.
- Reimplement the two downstream sed/tr reformatting steps (leading-space strip, trigger comma-join) in pure bash -- these are simple, already-understood string transforms, low risk to reimplement natively.
- Before finalizing, diff the new implementation's actual output against the OLD per-skill functions' output for all 8 real skill files -- must be byte-identical, matching the pre-verified prototype in this story's own Background section.
- Update tests/check-scr-s1-skill-categorization-reconciliation.js per AC4 -- do not just delete its regression coverage, assert the new invariant instead.
- Re-run tests/check-rb-s3-harness-agnostic-instructions.js and tests/check-rb-s5-optional-outer-loop-install.js unmodified -- both must still pass.
- Measure real wall-clock runInit({withOuterLoop:true}) timing post-fix, in isolation, and record it in this feature's own decisions.md.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — the diagnostic work and byte-parity verification are already done and documented before this DoR was signed; operator explicitly authorized this fix after reviewing the root-cause finding and approach)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-12

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
