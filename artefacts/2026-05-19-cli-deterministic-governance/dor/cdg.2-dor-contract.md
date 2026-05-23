# DoR Contract: cdg.2 — H1-H9 DoR deterministic checks

**Story:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.2.md
**DoR artefact:** artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.2-dor.md
**Date:** 2026-05-23

---

## Scope Contract

### Files in scope (the coding agent MUST touch these)

| File | Change |
|------|--------|
| `src/enforcement/cli-outer-loop.js` | Add EXIT constants; add STORY_REF_HEADER_RE, TESTPLAN_REF_HEADER_RE, REVIEW_REF_HEADER_RE; implement H2-H9 checks |
| `tests/check-cli-outer-loop.js` | Add T8 (3 assertions), T9 (3 assertions), T10 (3 assertions), T11 (1 assertion) — total assertions ≥33 |
| `tests/check-cli-governance.js` | Add G2a (assert count of "assert(" in check-cli-outer-loop.js ≥33) and G2b (assert EXIT error message format in cli-outer-loop.js) |

### Files out of scope (the coding agent MUST NOT touch these)

| File / Path | Reason |
|-------------|--------|
| `artefacts/**` | Pipeline specification — read-only inputs |
| `.github/pipeline-state.json` | State advancement is Phase 2 (skills advance); out of scope |
| `.github/pipeline-state.schema.json` | Schema evolution is governed separately |
| `bin/skills` | CLI entry point already established by cdg.1; no changes needed |
| `src/enforcement/cli-outer-loop.js` lines implementing H1 and path traversal guard | Preserve exactly — do not refactor H1 logic |
| `tests/check-cli-outer-loop.js` tests T1-T7b | Preserve exactly — no regressions |
| `tests/check-cli-governance.js` tests G1a-G1c | Preserve exactly — no regressions |
| `tests/check-assurance-gate.js` | Out of scope |
| `tests/check-caa3-config.js` | Out of scope |
| `.github/skills/**` | Platform infrastructure |
| `.github/templates/**` | Platform infrastructure |
| `standards/**` | Platform infrastructure |
| `scripts/**` | Out of scope |
| `dashboards/**` | Out of scope |
| `docs/**` | Out of scope |
| `package.json` | Test chain update is automatic — do NOT manually add; handled by cdg.2 story task or coding agent instruction |

---

## Test Chain Update

After making tests pass, append to `package.json` `scripts.test`:

```
&& node tests/check-cli-outer-loop.js
```

Wait — `check-cli-outer-loop.js` is already in the test chain (added by cdg.1). Do not add it again. The coding agent should NOT modify `package.json` unless:
- G2a or G2b governance checks need to be added to the chain AND they are not already in `tests/check-cli-governance.js` which should already be in the chain from cdg.1.

Verify by reading `package.json` before modifying.

---

## Exit Code Contract

| Exit code | Category | When |
|-----------|----------|------|
| 0 | OK | All H-priority checks pass |
| 1 | H1 | Story format violation |
| 2 | H2 | AC count < 3 or AC missing Given/When/Then |
| 3 | H3 | Test plan file missing or AC not covered |
| 4 | H4 | Out-of-scope section absent or blank |
| 5 | H5 | Benefit linkage missing named metric or contains disqualifying phrase |
| 6 | H6 | Complexity not rated |
| 7 | H7/H8/H8-ext/H9 | Review HIGH finding, AC coverage gap, schema dep missing, or architecture constraint absent |
| 8 | SYSTEM | Path traversal violation, file unreadable, unexpected exception |

Source: `artefacts/2026-05-19-cli-deterministic-governance/reference/dor-h1-h9-check-catalogue.md`

---

## Test Fixture Contract

All temporary fixture files must be written to a path inside the repository root (process.cwd() or equivalent) so the path traversal guard passes. Pattern: `process.cwd() + '/.tmp-test-cdg2-' + randomSuffix + '/'`. Clean up in try/finally.

**T8 fixtures required:**
- A DoR-format markdown file containing `**Story reference:** .tmp-test-cdg2-XXXX/story-h2-few-acs.md`
- A story file at that path with exactly 2 ACs (AC1, AC2) both in GWT format

**T9 fixtures required:**
- A DoR-format markdown file containing `**Story reference:** .tmp-test-cdg2-XXXX/story-h2-bad-gwt.md`
- A story file with 3 ACs where AC2 has no Given/When/Then sections

**T10 fixtures required:**
- A DoR-format markdown file containing `**Story reference:** .tmp-test-cdg2-XXXX/story-h5-disqualify.md`
- A story file with 3+ GWT ACs and Benefit Linkage containing "needed for the next feature to proceed"

**T11 fixtures required:**
- A DoR-format markdown file containing `**Story reference:** .tmp-test-cdg2-XXXX/story-clean.md`
- A well-formed story with: 3+ GWT ACs, non-blank Out-of-Scope, benefit linkage naming "M99 — dummy metric", Complexity Rating: 2, Architecture Constraints: "ADR-011 — pure function"
- Supporting stub files (test plan, review) in the same tmpDir as needed for H3/H7/H8 checks to resolve without failure

---

## Definition of Done for cdg.2

The story is complete when ALL of the following hold:
- [ ] `npm test` exits 0 with ≥33 assertions in `tests/check-cli-outer-loop.js`
- [ ] T8, T9, T10, T11 all pass
- [ ] G2a assertion passes (count ≥33)
- [ ] G2b assertion passes (error message format present)
- [ ] No regression in T1-T7b, IT1a-IT2b, NFR1-NFR3, G1a-G1c
- [ ] `node bin/skills validate <artefact> definition-of-ready` exits with typed codes 1-7 for each violation category
- [ ] No state files written by the validate command
- [ ] Draft PR opened — not marked ready for review
