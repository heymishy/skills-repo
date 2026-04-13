# Skill Smoke Tests — Tier 2

These prompts are used to manually verify that each skill behaves correctly
after significant changes to its instructions. They are not run automatically.

## When to run

Run a smoke test when you:
- Change the core logic or output format of a skill (not just wording)
- Add a new step or category to a skill
- Want to verify a new structural contract before adding it to check-skill-contracts.js

## How to run

1. Open a new Copilot chat
2. Paste the fixture content + prompt below
3. Verify the output contains the required assertions listed under each test
4. Cost estimate: ~300–600 tokens per test using a small model

## Minimal fixture files

- `tests/fixtures/minimal-discovery.md` — discovery artefact (~20 lines)
- `tests/fixtures/minimal-story.md` — story artefact (~30 lines)
- `tests/fixtures/minimal-benefit-metric.md` — benefit metric artefact (~20 lines)
- `tests/fixtures/minimal-test-plan.md` — test plan artefact (~40 lines)

## Coverage

| Skill | Tier 1 contract | Tier 2 smoke test |
|-------|----------------|-------------------|
| /discovery | ✅ | T5 |
| /clarify | ✅ | T3 |
| /benefit-metric | ✅ | T6 |
| /definition | ✅ | T7 |
| /review | ✅ | T1 |
| /test-plan | ✅ | T8 |
| /definition-of-ready | ✅ | T2 |
| /branch-setup | ✅ | — (requires live git repo) |
| /implementation-plan | ✅ | T9 |
| /tdd | ✅ | — (requires live code) |
| /subagent-execution | ✅ | — (requires live code) |
| /verify-completion | ✅ | — (requires live test suite) |
| /branch-complete | ✅ | — (requires live git repo) |
| /definition-of-done | ✅ | — (requires merged PR) |
| /trace | ✅ | T10 |
| /release | ✅ | — (requires DoD artefacts) |
| /improve | ✅ | — (requires merged PR) |
| /systematic-debugging | ✅ | — (requires failing test) |
| /implementation-review | ✅ | — (requires code) |
| /spike | ✅ | — (requires specific question) |
| /decisions | ✅ | — |
| /coverage-map | ✅ | — (requires multiple test plans) |
| /record-signal | ✅ | — |
| /metric-review | ✅ | — (requires live metric data) |
| /programme | ✅ | — (requires multi-workstream context) |
| /ea-registry | ✅ | — (requires registry repo) |
| /reverse-engineer | ✅ | — (requires legacy codebase) |
| /ideate | ✅ | — |
| /bootstrap | ✅ | — (destructive, test in scratch repo) |
| /loop-design | ✅ | — |
| /token-optimization | ✅ | — |
| /org-mapping | ✅ | — |
| /scale-pipeline | ✅ | — |
| /workflow | ✅ | T4 |

Skills marked `—` are either environment-dependent (require live code/git/data), destructive, or low-change-frequency. Add smoke tests for them when you modify their logic.

---

## T1 — /review smoke test

**Fixture:** paste `minimal-story.md`

**Prompt:**
```
Run /review on this story artefact. Treat it as a real review — apply your full skill.

[paste minimal-story.md here]
```

**Required assertions (check manually):**
- [ ] Output opens with findings, not praise
- [ ] Each of the 4 criteria (Traceability, Scope integrity, AC quality, Completeness) has a score in the range 1–5
- [ ] FINDINGS section appears before SCORE section, which appears before VERDICT
- [ ] VERDICT is either PASS or FAIL with a one-sentence justification
- [ ] If any criterion score < 3: specific line-level issues are listed for that criterion

---

## T2 — /definition-of-ready smoke test

**Fixture:** paste `minimal-story.md` and tell the skill a test plan exists

**Prompt:**
```
Run /definition-of-ready on this story. Assume a test plan and review report (PASS) exist.

[paste minimal-story.md here]
```

**Required assertions (check manually):**
- [ ] Contract Proposal appears before the H1–H13 checklist
- [ ] Contract Proposal includes: "What will be built", "What will NOT be built", per-AC test approach table, Assumptions, Estimated touch points
- [ ] Contract Review step appears after Contract Proposal
- [ ] Output format label "CONTRACT PROPOSAL → CONTRACT REVIEW → CHECKLIST → READY/BLOCKED" is referenced or followed
- [ ] dor-contract.md is mentioned as an output artefact

---

## T3 — /clarify smoke test

**Fixture:** paste `minimal-discovery.md`

**Prompt:**
```
Run /clarify on this discovery artefact.

[paste minimal-discovery.md here]
```

**Required assertions (check manually):**
- [ ] Gap assessment uses categories SCOPE, INTEGRATION, CONSTRAINTS, USER JOURNEY
- [ ] First question includes: the question, why it's blocking (downstream step named), 2–3 answer options
- [ ] If a question is not answered: output includes BLOCKED — [specific question]
- [ ] If questions are resolved: completion output says "N questions resolved. discovery.md updated. Ready for /benefit-metric."

---

## T4 — /workflow smoke test

**No fixture required**

**Prompt:**
```
Run /workflow. I have a small bug fix: the CSV export button is not visible on mobile screens. Single file change expected.
```

**Required assertions (check manually):**
- [ ] Short-track confirmation gate appears before routing (asks to confirm this is genuinely short-track)
- [ ] Prompt includes: "Is the change bounded?", "Are all ACs well understood?", "No risk of unintended downstream impact?"
- [ ] Pipeline health note appears in the routing section

---

## Adding new tests

When a new skill structural contract is added to `check-skill-contracts.js`,
add a corresponding smoke test entry here with:
- Which fixture to use (or note "no fixture required")
- The exact prompt
- The required assertions to check manually

---

## T5 — /discovery smoke test

**No fixture required**

**Prompt:**
```
Run /discovery. I want to build a feature that lets workshop facilitators export session results to CSV.
```

**Required assertions (check manually):**
- [ ] Skill asks clarifying questions ONE AT A TIME — does not present a form or all questions at once
- [ ] First question is about the problem, not the solution
- [ ] Skill references product context if `product/` files are mentioned
- [ ] Output artefact path mentions `artefacts/[feature-slug]/discovery.md`
- [ ] Reference materials section and `reference-index.md` are mentioned as output artefacts

---

## T6 — /benefit-metric smoke test

**Fixture:** paste `minimal-discovery.md`

**Prompt:**
```
Run /benefit-metric. The discovery has been approved.

[paste minimal-discovery.md here]
```

**Required assertions (check manually):**
- [ ] Skill explicitly runs a Meta-benefit check before defining metrics
- [ ] Output includes at least one primary metric with: name, baseline, target, measurement method
- [ ] Directional indicators are defined separately from the primary metric
- [ ] Output artefact path is `artefacts/[feature]/benefit-metric.md`
- [ ] Skill confirms the directional indicators step (Step 2) appears in the output

---

## T7 — /definition smoke test

**Fixture:** paste `minimal-discovery.md` + `minimal-benefit-metric.md`

**Prompt:**
```
Run /definition. Discovery and benefit-metric are both approved.

[paste minimal-discovery.md here]
[paste minimal-benefit-metric.md here]
```

**Required assertions (check manually):**
- [ ] Skill offers a slicing strategy choice before decomposing (e.g. Walking skeleton, vertical slice, thin slice)
- [ ] Skill runs an Architecture constraints scan (Step 1.5) before writing stories
- [ ] Each story produced has: As/Want/So user story, ACs in GWT, Out of scope, Benefit linkage
- [ ] Scope accumulator runs at the end — compares total story scope against discovery MVP
- [ ] Output paths include `artefacts/[feature]/stories/[story-slug].md`

---

## T8 — /test-plan smoke test

**Fixture:** paste `minimal-story.md`

**Prompt:**
```
Run /test-plan for this story. Review has passed.

[paste minimal-story.md here]
```

**Required assertions (check manually):**
- [ ] Skill produces TWO outputs: technical test plan AND AC verification script
- [ ] Test data strategy section is present
- [ ] PCI scope is mentioned (even if not applicable — must be acknowledged)
- [ ] Tests are written to fail first (TDD discipline stated)
- [ ] Output paths: `artefacts/[feature]/test-plans/[story-slug]-test-plan.md` and `artefacts/[feature]/verification-scripts/[story-slug]-verification.md`

---

## T9 — /implementation-plan smoke test

**Fixture:** paste `minimal-story.md` + `minimal-test-plan.md`

**Prompt:**
```
Run /implementation-plan. DoR sign-off is complete.

[paste minimal-story.md here]
[paste minimal-test-plan.md here]
```

**Required assertions (check manually):**
- [ ] Output includes a File map section listing files to create/modify
- [ ] Each task has: file path, complete code, TDD steps (RED/GREEN), run command, expected output, commit message
- [ ] Skill explicitly states it assumes zero codebase context
- [ ] Output artefact path is `artefacts/[feature]/plans/[story-slug]-plan.md`
- [ ] Plan conforms to `templates/implementation-plan.md`

---

## T10 — /trace smoke test

**Fixture:** paste `minimal-discovery.md` + `minimal-story.md` + `minimal-benefit-metric.md`

**Prompt:**
```
Run /trace on this feature. The story has passed review and has a test plan.

[paste minimal-discovery.md here]
[paste minimal-benefit-metric.md here]
[paste minimal-story.md here]
```

**Required assertions (check manually):**
- [ ] Skill runs a Chain structure check
- [ ] Skill runs a Metric orphan check — flags any metrics in benefit-metric not referenced in stories
- [ ] Skill runs a Chain walk per story — traces discovery → epic → story → test → DoR
- [ ] Output explicitly lists broken links, orphaned artefacts, and scope deviations (or confirms none)
- [ ] Report is read-only — skill does not attempt to fix any gaps it finds
