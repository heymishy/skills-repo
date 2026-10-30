# Review Report: Stub the real git-commit adapter in the 14 remaining skill-turn test files — Run 1

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s8-skill-turn-git-commit-adapter-stubbing.md
**Date:** 2026-10-31
**Categories run:** A (Traceability), B (Scope), C (AC quality), D (Completeness), E (Architecture compliance), F (journey.js fixture hygiene), G (skills.js fixture hygiene)
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category C (AC quality) — AC1's 14-file list, copied verbatim from `tfhc-s6`'s spike, contains one file that does not actually need the fix. Direct inspection of `tests/check-isc-s1-ideate-success-lens-cycling.js` shows it never calls `handlePostTurnStreamHtml` in executable code — the two matches for that name are both in comments (a block-comment header note at line 12, and an inline comment at line 137). The file's only `require` targets are `assert`, `path`, and `src/web-ui/modules/mock-llm-gateway.js` (verified via `grep -n "require("`) — it exercises `mockGateway.getMockResponse(...)`, a pure fixture-data accessor, never the real route handler. It therefore cannot reach the `_skillTurnGitCommit` adapter call site at all, and adding a `setSkillTurnGitCommitAdapter` stub to it would be a no-op with nothing to stub. AC2's own structural check, as worded ("scans every `tests/*.js` file that calls `handlePostTurnStreamHtml` with an `---ARTEFACT-END---`-bearing fixture response"), would correctly exclude this file from needing a stub in the first place — it only matches files that genuinely call the handler, which this one does not — so AC1 and AC2 are internally inconsistent about this one file. Spot-checked 8 of the other 13 files directly (`check-alrf-s8-journey-slug-priority.js`, `check-mfc1-model-first-chat-session.js`, `check-ral-s1-audit-log-journey-id-and-timestamp.js`, `check-dsh-s1-persist-session-turns.js`, `check-wsd-s4-pipeline-state-owner-repo-resolution.js`, `check-wsap-s3-multi-story-commit-and-no-review-rerun.js`, `check-csgc-s1-story-extraction-and-gate-confirm.js`, `check-res-s3-suggest-revision-materiality.js`) — all genuinely call `handlePostTurnStreamHtml` 2-8 times each in executable code, confirming this is an isolated miss in the spike's own enumeration, not a pattern affecting the whole list.

  Risk if proceeding: the implementer either adds a meaningless stub call to this file (harmless but pointless, and masks the real discrepancy), or discovers the inconsistency mid-implementation and has to make an unscoped judgment call the story doesn't specify. `tfhc-s8`'s own m9 metric baseline/target ("14 of 41 unstubbed" / "0 of 41 unstubbed") would also be off by one if left uncorrected.

  To acknowledge: run `/decisions`, category RISK-ACCEPT — or fix directly: drop `check-isc-s1-ideate-success-lens-cycling.js` from AC1's file list (13 files, not 14), and correct `benefit-metric.md` m9's baseline/target counts accordingly.

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 1 MEDIUM, 0 LOW.
**Outcome:** PASS

### Category A: Traceability

- Story references parent epic ✓
- Story references discovery artefact ✓
- Story references benefit-metric artefact ✓
- "So that..." connects to m9 (parallelization risk resolution, implementation half) ✓
- Benefit linkage field contains a real mechanism sentence (cites the specific real adapter and call site found by `tfhc-s6`'s spike) ✓
- Metric m9 exists in the benefit coverage matrix (confirmed: added at /definition, 2026-10-31) ✓

**Traceability score: 5**

### Category B: Scope discipline

- Story doesn't implement anything in epic out-of-scope ✓ — parallelization implementation itself is correctly excluded and named as a separate, gated story
- Story doesn't implement anything in discovery out-of-scope ✓
- Story's own out-of-scope section names 3 excluded behaviours with reasons, not "N/A" ✓
- Scope addition has an approved scope note — logged as a SCOPE entry in decisions.md both at the spike's own completion (2026-10-30) and at /definition (2026-10-31) ✓

**Scope integrity score: 5**

### Category C: AC quality

- 4 ACs, all in Given/When/Then format ✓
- No "should"/"would" language ✓
- Independently testable in principle — but see finding 1-M1: AC1's file list embeds a factual inaccuracy (1 of 14 named files cannot reach the code path the AC claims it must be protected against), which undermines "independently testable" for that one file specifically, and creates an internal inconsistency against AC2's own more precise criteria
- Minimum 3 ACs: 4 present ✓
- No edge case buried in a sub-bullet ✓

**AC quality score: 3** — issue present (1-M1) but addressable without story rework (a one-line file-list and metric-count correction, not a redesign).

### Category D: Completeness

- User story in As/Want/So format ✓
- Named persona: "the platform maintainer who owns the long-term health of this repo's test infrastructure" — matches the established precedent persona (identical to `tfhc-s4`'s own wording), not generic ✓
- Benefit linkage populated ✓
- Out of scope populated (3 items) ✓
- NFRs populated — "Not applicable"/"None identified" phrasing matches the precedent already accepted for `tfhc-s4`'s own equivalently-shaped investigation/infra story ✓
- Complexity rated (1) ✓
- Scope stability declared (Stable) ✓

**Completeness score: 5**

### Category E: Architecture compliance

`.github/architecture-guardrails.md` exists.

- Architecture Constraints field populated: cites the D37 injectable adapter rule from CLAUDE.md "Coding standards" ✓
- Correctly disclaims that this story does NOT introduce a new adapter ("it applies [the existing adapter] to 14 more call sites") — verified accurate: `setSkillTurnGitCommitAdapter` already exists (`stis-s1`), so D37's 4 mandatory points (which apply specifically when a story introduces a new adapter) are correctly not re-litigated here ✓
- No approved pattern violated; no anti-pattern used ✓
- No applicable Active ADR conflict found ✓

No findings.

### Category F: journey.js fixture hygiene

Applies — 3 of the 14 named files require `src/web-ui/routes/journey` (confirmed via grep: `check-wsd-s4-pipeline-state-owner-repo-resolution.js`, `check-wsap-s3-multi-story-commit-and-no-review-rerun.js`, `check-csgc-s1-story-extraction-and-gate-confirm.js`). Ran `node scripts/check-journey-fixture-usage.js <file>` against each:

```
check-journey-fixture-usage PASS: no hand-rolled fixture found in tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js
check-journey-fixture-usage PASS: no hand-rolled fixture found in tests/check-wsap-s3-multi-story-commit-and-no-review-rerun.js
check-journey-fixture-usage PASS: no hand-rolled fixture found in tests/check-csgc-s1-story-extraction-and-gate-confirm.js
```

**journey.js fixture hygiene score: 5** — no finding.

### Category G: skills.js fixture hygiene

Applies — 13 of the 14 named files require `src/web-ui/routes/skills` (all except `check-isc-s1-ideate-success-lens-cycling.js`, which — consistent with finding 1-M1 — requires `modules/mock-llm-gateway.js` instead, not `routes/skills` at all, reinforcing that it is a genuinely different kind of file than the other 13). Ran `node scripts/check-skills-fixture-usage.js <file>` against each of the 13 — all PASS, no hand-rolled fixture found.

**skills.js fixture hygiene score: 5** — no finding.

---

## Verdict

PASS — 0 HIGH, 1 MEDIUM (1-M1). All 4 primary criteria scored ≥3 (AC quality scored 3 due to 1-M1, still passing). Architecture and both fixture-hygiene categories clean. 1-M1 should be resolved (drop `check-isc-s1-ideate-success-lens-cycling.js` from AC1's file list, correct m9's counts to 13/41 baseline) or explicitly RISK-ACCEPTed before `/test-plan`, since the test plan will otherwise be written against the uncorrected 14-file premise.

---

## Resolution (2026-10-31)

**1-M1: RESOLVED.** `check-isc-s1-ideate-success-lens-cycling.js` removed from the story's AC1 file list. Story title, AC1-AC4, Architecture Constraints, and the User Story/Benefit Linkage prose all corrected from 14 to 13 files. `benefit-metric.md` m9's baseline corrected to "13 of 41" (was "14 of 41"); the epic's own Benefit Metrics Addressed table and `pipeline-state.json`'s `m9.baseline` corrected to match. No story rework needed beyond this count correction — the underlying approach (mirror the 12-file stubbing pattern, add a structural check) is unaffected. Cleared to proceed to `/test-plan`.
