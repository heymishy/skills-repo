# Definition of Ready: Extend `buildSystemPrompt` with optional `priorArtefacts` handoff block (ougl.1)

**Story reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-1-buildsystemprompt-handoff.md
**Test plan reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-1-test-plan.md
**Verification script:** artefacts/2026-05-06-web-ui-guided-outer-loop/verification-scripts/ougl-1-verification.md
**Review report:** artefacts/2026-05-06-web-ui-guided-outer-loop/review/ougl-1-review-1.md
**Epic:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-1-journey-foundation.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-14

---

## Contract Proposal

**What will be built:**
Add an optional 4th parameter `priorArtefacts` (array of `{path, content}` objects) to `buildSystemPrompt` in `src/web-ui/routes/skills.js`. When the array is non-null and non-empty, the function assembles a `--- HANDOFF CONTEXT ---` block (containing one `--- PRIOR ARTEFACT: [path] ---` / content / `--- END PRIOR ARTEFACT ---` section per item) and injects it into the assembled system prompt string before the `--- WEB UI PROTOCOL ---` section. When the array is absent, null, or empty, the function behaviour is unchanged.

**What will NOT be built:**
- Path traversal validation inside `buildSystemPrompt` (caller's responsibility)
- Content normalisation or length limits
- Reading artefact files from disk inside this function
- Any changes to callers that do not pass the 4th argument

**AC verification table:**

| AC | Test | Verification approach |
|----|------|-----------------------|
| AC1 | T1.1 | Call with 3 args; assert no `--- HANDOFF CONTEXT ---` in result |
| AC2 | T1.2 | Call with 1-item `priorArtefacts`; assert `--- HANDOFF CONTEXT ---` present |
| AC3 | T1.3 | Assert `--- PRIOR ARTEFACT: artefacts/test/discovery.md ---` in result |
| AC4 | T1.4 | Assert content appears between header and `--- END PRIOR ARTEFACT ---` |
| AC5 | T1.5 | Assert `indexOf('--- HANDOFF CONTEXT ---') < indexOf('--- WEB UI PROTOCOL ---')` |
| AC6 | T1.6 | Two-item array → two distinct blocks in result |
| AC7 | T1.7 | Empty array → no `--- HANDOFF CONTEXT ---` |
| AC8 | T1.8 | 3-arg call → `--- WEB UI PROTOCOL ---` still present (regression guard) |

**Assumptions:**
- `buildSystemPrompt` already assembles the `--- WEB UI PROTOCOL ---` section as the final block
- `os.tmpdir()` as `repoRoot` produces a minimal result (no SKILL.md files) — isolates handoff logic

**Estimated touchpoints:**
- Files: `src/web-ui/routes/skills.js` (modify `buildSystemPrompt` function)
- Tests: `tests/check-ougl1-buildsystemprompt-handoff.js` (already exists as failing baseline)

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. The 4th-parameter approach is additive; all existing 3-argument call sites remain unchanged. No mismatch between proposed approach and ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format with named persona | ✅ PASS | "As a **platform maintainer**" |
| H2 | ≥3 ACs in Given/When/Then format | ✅ PASS | 8 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T1.1–T1.8 map 1:1 to AC1–AC8 |
| H4 | Out-of-scope populated | ✅ PASS | 3 explicit exclusions |
| H5 | Benefit linkage references named metric | ✅ PASS | MM1 (Artefact quality parity) named |
| H6 | Complexity rated | ✅ PASS | Epic 1 rates Complexity 1, Scope Stable (story omits field — noted as 1-L1 LOW; epic rating adopted) |
| H7 | No unresolved HIGH findings | ✅ PASS | 0 HIGH, 0 MEDIUM, 2 LOW across review |
| H8 | No uncovered ACs | ✅ PASS | All 8 ACs covered in test plan; 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ PASS | Dependencies: None — schema check not required |
| H9 | Architecture constraints populated; no Cat-E HIGH findings | ✅ PASS | ADR-019 cited, additive parameter, zero new deps, ordering constraint. Review Cat-E score 5/5. |
| H-E2E | CSS-layout-dependent ACs without E2E/RISK-ACCEPT | ✅ PASS | No CSS-layout ACs — function returns a string, no HTML rendering |
| H-NFR | NFR profile or story-level NFRs reviewed | ✅ PASS | `nfr-profile.md` created. NFR-perf-buildsystemprompt entry covers this story. |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ PASS | No compliance NFRs |
| H-NFR3 | Data classification not blank in NFR profile | ✅ PASS | Classification: Internal tooling, no PII |
| H-NFR-profile | NFR profile exists | ✅ PASS | `artefacts/2026-05-06-web-ui-guided-outer-loop/nfr-profile.md` created this session |
| H-GOV | Approved By ≥1 non-blank entry | ✅ PASS | `Hamis — 2026-05-06` present in discovery.md. M1 signal: role not explicitly non-engineering, but present and named. |
| H-ADAPTER | Injectable adapters with wiring AC | ✅ PASS (N/A) | No injectable adapters introduced. Parameter addition only. |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | NFR-perf-buildsystemprompt in nfr-profile.md | — |
| W2 | Scope stability declared | ✅ | Epic 1: Stable | — |
| W3 | MEDIUM findings acknowledged | ✅ (N/A) | 0 MEDIUM findings for ougl.1 | — |
| W4 | Verification script reviewed | ✅ | Script confirmed in baseline — covers all 8 ACs | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Coverage gaps: None | — |

**No warnings apply — proceed.**

---

## Oversight Level

**Oversight:** Medium (Epic 1 setting)
**Rationale:** Changes to `buildSystemPrompt` affect every HTML skill session (existing and journey). The parameter is additive and backward-compatible, but regressions in the core system prompt would break all sessions.

⚠️ **Medium oversight** — share this DoR artefact with the tech lead before assigning to the coding agent. (Solo repo: operator = tech lead — self-confirm before dispatch.)

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extend buildSystemPrompt with optional priorArtefacts handoff block — artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-1-buildsystemprompt-handoff.md
Test plan: artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-1-test-plan.md

Goal:
Make every test in tests/check-ougl1-buildsystemprompt-handoff.js pass.
Current baseline: T1.1, T1.7, T1.8 pass; T1.2–T1.6 fail (handoff block not yet implemented).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS (require). No TypeScript. No transpilation.
- Zero new npm dependencies. String concatenation only.
- Single file change: src/web-ui/routes/skills.js (buildSystemPrompt function only).
- The 4th parameter `priorArtefacts` is strictly optional. All existing 3-argument call sites must continue to work identically. Do NOT change the function signature in a breaking way.
- Handoff block order: HANDOFF CONTEXT block MUST appear before --- WEB UI PROTOCOL --- in the assembled string. The WEB UI PROTOCOL section must remain the last section.
- Empty array or absent/null 4th arg → no handoff block injected (AC1, AC7).
- Architecture standards: read .github/architecture-guardrails.md before implementing. ADR-019 applies: priorArtefacts injected once at session creation into systemPrompt (immutable per session).
- Run: node tests/check-ougl1-buildsystemprompt-handoff.js after each change to verify. All 8 tests must pass.
- Run: npm test to verify zero regressions in the full suite before opening PR.
- Open a draft PR when all tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

Files in scope:
- src/web-ui/routes/skills.js — modify buildSystemPrompt function (lines ~1042–1100 area)

Files out of scope (do not touch):
- Any test file other than the existing check-ougl1-buildsystemprompt-handoff.js
- Any other function in skills.js
- server.js
- Any artefact files under artefacts/

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness (solo repo: operator self-confirms)
**Signed off by:** Hamis — 2026-05-14
