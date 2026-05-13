# Definition of Ready: src.1 — Integrate CLI observability tools into skill routing

**Story:** artefacts/2026-04-21-skill-routing-cli-tools/stories/src.1-skill-routing-cli-integration.md
**Review:** PASS — Short-track inline review, 2026-04-21 (see inline review notes below)
**Test plan:** 10 tests (T1–T8, T-NFR1a, T-NFR1b) covering 5 ACs
**Verification script:** 5 scenarios

---

## Inline Review Notes (Short-track exemption from full /review)

Short-track path confirmed per copilot-instructions.md: `/test-plan → /definition-of-ready → coding agent`. Full `/review` is waived for this story. Inline review applied:

- **Category A (Spec):** ACs are bounded, testable, and unambiguous. No scope drift from the identified gap.
- **Category B (Security):** No security surface — SKILL.md text changes only. No data handling, no network calls, no credentials, no user input. MC-SEC-02 is not applicable.
- **Category C (Architecture):** Changes are to `.github/skills/` files; PR policy applies. No src/, scripts/, or schema changes. ADR-004 not applicable (no context.yml reads added). No new pipeline-state.json fields.
- **Category D (Tests):** 10 governance tests using `fs.readFileSync` only — no external deps. All tests fail before implementation. Test data is the actual SKILL.md file content.
- **Category E (Completeness):** Out-of-scope is explicit. Dependencies are DoD-complete. Complexity 1/Stable.

**Finding count: 0 HIGH, 0 MEDIUM, 0 LOW.**

---

## Contract Proposal

**What will be built:**
Two text additions to existing SKILL.md files: (1) a callout block in `.github/skills/workflow/SKILL.md` in the session start section that surfaces `node scripts/generate-status-report.js --daily` and `--weekly` with trigger routing phrases; (2) a `## Benefit Measurement` callout block in `.github/skills/improve/SKILL.md` in the completion section that surfaces `node scripts/record-benefit-comparison.js --feature <slug>` with EXP-001 reference and explicit deferral option. One new governance test file `tests/check-sro1-skill-routing.js`.

**What will NOT be built:**
- No changes to `generate-status-report.js` or `record-benefit-comparison.js`
- No changes to `copilot-instructions.md`
- No changes to any skill other than `/workflow` and `/improve`
- No automation — both tools remain operator-run CLI commands
- No `--summary` flag reference in `/improve`

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — workflow session start callout | T1: workflow SKILL.md contains `generate-status-report.js`; T2: contains `--daily` | Unit (file content) |
| AC2 — workflow --daily/--weekly with routing | T3: contains `--weekly`; T4: contains status report trigger phrase | Unit |
| AC3 — improve benefit measurement callout | T5: improve SKILL.md contains `record-benefit-comparison.js`; T6: contains `--feature`; T7: contains `EXP-001` or `Benefit Measurement` | Unit |
| AC4 — improve callout is non-blocking | T8: contains `defer`/`skip`/`optional`/`non-blocking` near comparison section | Unit |
| AC5 — correct node invocation prefix | T-NFR1a: workflow contains `node scripts/generate-status-report.js`; T-NFR1b: improve contains `node scripts/record-benefit-comparison.js` | Unit |

**Assumptions:**
- SKILL.md file encoding is UTF-8 — consistent with all other files in `.github/skills/`
- The section headings in workflow/SKILL.md and improve/SKILL.md are not renamed as part of this change

**Estimated touch points:**
- Files: `.github/skills/workflow/SKILL.md` (text addition), `.github/skills/improve/SKILL.md` (text addition), `tests/check-sro1-skill-routing.js` (new), `package.json` (test entry append), `.github/pipeline-state.json` (new feature entry)
- Services: None
- APIs: None

---

## Contract Review

✅ Contract review passed — proposed implementation aligns with all 5 ACs.

---

## Hard Blocks

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As/Want/So format with named persona | ✅ PASS — "platform operator running the skills pipeline" |
| H2 | At least 3 ACs in Given/When/Then format | ✅ PASS — 5 ACs |
| H3 | Every AC has at least one test | ✅ PASS — all 5 ACs mapped in coverage table |
| H4 | Out-of-scope populated | ✅ PASS — 5 explicit items |
| H5 | Benefit linkage references named metric | ✅ PASS — M1 (CLI observability tool discovery rate) |
| H6 | Complexity rated | ✅ PASS — 1/Stable |
| H7 | No unresolved HIGH findings | ✅ PASS — short-track inline review, 0 findings (see inline review notes above) |
| H8 | No uncovered ACs in test plan | ✅ PASS — all 5 ACs in coverage table |
| H8-ext | Schema dependency check | ✅ PASS — no upstream dependencies declared requiring schema fields |
| H9 | Architecture constraints populated | ✅ PASS — PR policy, no-src constraint, exact path constraint, non-blocking constraint |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS — no layout-dependent ACs; file content checks only |
| H-NFR | NFR profile or explicit NFRs | ✅ PASS — "None — confirmed 2026-04-21" in story |
| H-NFR-profile | NFR profile presence | ✅ PASS — story declares "None"; H-NFR-profile check not triggered |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS — no compliance NFRs |
| H-NFR3 | Data classification | ✅ PASS — no sensitive data; SKILL.md files are public repository content |

**Result: 15/15 hard blocks passed**

---

## Warnings

| # | Check | Result |
|---|-------|--------|
| W1 | NFRs populated | ✅ — "None — confirmed 2026-04-21" |
| W2 | Scope stability declared | ✅ — Stable |
| W3 | MEDIUM review findings acknowledged | ✅ — 0 findings from inline review |
| W4 | Verification script reviewed by domain expert | ⚠️ Acknowledged — operator is the domain expert for platform tooling and skill routing |
| W5 | No UNCERTAIN items in gap table | ✅ — one gap acknowledged (AC4 runtime deferral behaviour); structural check T8 provides best available coverage |

---

## Oversight Level

**Low** — single-story short-track feature, personal repo, non-regulated, complexity 1, operator is sole stakeholder.

---

## Coding Agent Instructions

### Story
src.1 — Integrate CLI observability tools into skill routing

### Track
Short-track (no discovery or benefit-metric artefacts required)

### Acceptance Criteria

**AC1:** Given a platform operator invokes `/workflow` at session start when `pipeline-state.json` contains at least one feature that is not DoD-complete, When the pipeline status table is presented, Then the output includes a callout instructing the operator to run `node scripts/generate-status-report.js --daily` — appearing before the prompt asking which feature to work on.

**AC2:** Given a platform operator invokes `/workflow` with an intent phrase matching "daily report", "weekly report", or "pipeline status report", When the skill processes the trigger, Then the skill responds with the exact invocation `node scripts/generate-status-report.js --daily` or `node scripts/generate-status-report.js --weekly` and describes the output contents.

**AC3:** Given a platform operator runs `/improve` after a feature is DoD-confirmed, When the skill outputs the completion section, Then the output includes a `## Benefit Measurement` callout with the command `node scripts/record-benefit-comparison.js --feature <slug>` (feature slug substituted) and a note that this records actuals for EXP-001.

**AC4:** Given the `/improve` benefit measurement callout has been shown, When the operator indicates they want to skip or defer the comparison run, Then the skill acknowledges the deferral and continues to the learning extraction steps — explicitly non-blocking.

**AC5:** Given either SKILL.md change has been applied, Then workflow SKILL.md contains `node scripts/generate-status-report.js` with `--daily` and `--weekly` variants, and improve SKILL.md contains `node scripts/record-benefit-comparison.js` with `--feature` flag.

### Test Plan
10 tests — see `artefacts/2026-04-21-skill-routing-cli-tools/test-plans/src.1-skill-routing-cli-integration-test-plan.md`

### Files to change
1. `.github/skills/workflow/SKILL.md` — add status report callout in session start section and trigger routing phrases
2. `.github/skills/improve/SKILL.md` — add `## Benefit Measurement` callout block in completion section after Category E
3. `tests/check-sro1-skill-routing.js` — new governance test file (10 tests)
4. `package.json` — append `&& node tests/check-sro1-skill-routing.js` to the test script chain
5. `.github/pipeline-state.json` — update src.1 story entry with dorStatus: "signed-off"

### Files NOT to change
- `scripts/generate-status-report.js` — DoD-complete, do not modify
- `scripts/record-benefit-comparison.js` — DoD-complete, do not modify
- `.github/copilot-instructions.md` — routing is in SKILL.md, not here
- Any other skill files, src/, standards/, dashboards/, artefacts/

### Constraints
- `tests/check-sro1-skill-routing.js` must use only Node.js built-ins (`fs`, `path`) — no external dependencies
- All 10 tests must fail before SKILL.md changes are applied (TDD baseline)
- The benefit comparison callout in `/improve` must be non-blocking — include explicit defer/skip path
- SKILL.md changes go via PR — open as draft, do not merge, do not mark ready for review

### Verification
Run `node tests/check-sro1-skill-routing.js` — all 10 tests must pass.
Run `npm test` — the new test must appear in the chain and pass with all other tests.
