## Story: Extract inline workflow JS to tested modules

**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-02-ci-enforcement-compliance.md`
**Discovery reference:** `artefacts/2026-05-24-governance-platform-architecture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-05-24-governance-platform-architecture/benefit-metric.md`

## User Story

As a **platform operator** maintaining the CI assurance gate,
I want the audit comment construction logic and `sourceIntegrity` file-read function — currently in untested inline `github-script` JS in assurance-gate.yml — extracted into `scripts/ci-audit-comment.js` as exported, testable functions covered by the test suite,
So that the class of bugs represented by the 4 asd.1 post-merge findings (all from the same untested inline block: pipelineStories TDZ, wildcard slug extraction, epic-nested stories, and audit comment construction) cannot recur — and so that SC-06 can add the path traversal guard to `sourceIntegrity` with test coverage.

**Scope note:** SC-07 was promoted from R2 (risk note in discovery) to an explicit story candidate during the benefit-metric stage, with operator approval. It is load-bearing: it is a prerequisite for SC-06, and it is the root-cause fix for M3's inline-JS blind-spot category (not just a patch). SC-06 without SC-07 would add a guard to a still-untested inline block — patching without closing the structural blind spot.

## Benefit Linkage

**Metric moved:** M3 — Architecture blind-spot recurrence rate (primary); M5 — Path traversal attack surface (prerequisite move: extracts `sourceIntegrity` so SC-06 can guard it with test coverage).
**How:** Extracting all audit comment and `sourceIntegrity` logic to a tested module eliminates the blind spot that produced 4 asd.1 bugs. After SC-07, `npm test` exercises the same code path that runs in CI — the blind spot is structurally closed.

## Architecture Constraints

- ADR-011: new or modified `scripts/ci-audit-comment.js` module — this story artefact satisfies artefact-first.
- ADR-009: the extraction does not change workflow trigger separation — both workflows keep their existing trigger events and permission grants; the thin YAML `github-script` step that calls the extracted module retains its existing trigger context.
- Extracted module must be `require()`-able by Node.js without GitHub Actions context dependency (`@actions/core` must not be a hard dependency of the exported functions themselves).
- Plain Node.js, CommonJS, no external npm dependencies.
- Checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** None.
- **Downstream:** SC-06 (`gpa-sc-06-source-path-guard.md`) — the path traversal guard in SC-06 is added to the `sourceIntegrity` function extracted by this story.

## Acceptance Criteria

**AC1:** Given assurance-gate.yml contains inline `github-script` JS that builds the audit comment, when SC-07 is complete, then `scripts/ci-audit-comment.js` exports a `buildComment(inputs)` function containing all audit comment construction logic, and the inline step in assurance-gate.yml invokes it via a `node scripts/ci-audit-comment.js` call or thin `require()` wrapper — zero audit comment construction logic remains only in YAML inline JS.

**AC2:** Given assurance-gate.yml contains inline `sourceIntegrity(sourcePath)` logic (or equivalent inline file-read), when SC-07 is complete, then `sourceIntegrity` is exported from `scripts/ci-audit-comment.js` (or a named export in the same module), the inline call in assurance-gate.yml is replaced by an invocation of the exported function, and the function is callable from a test file without requiring GitHub Actions context variables to be set.

**AC3:** Given `scripts/ci-audit-comment.js` exports `buildComment` and `sourceIntegrity`, when `npm test` runs, then at least one test file exercises: (a) `buildComment` with a feature slug and story fixture — asserting the output contains the expected comment structure, (b) `sourceIntegrity` with a valid file path — asserting it returns without error, (c) `pipelineStories` resolution for a feature with flat `stories[]` — asserting the correct stories are found (happy path), (d) `pipelineStories` resolution for a feature with `epics[].stories[]` — asserting the correct stories are found (the asd.1 epic-nested bug case that was silently unreachable before extraction).

**AC4:** Given `npm test` runs after SC-07 is merged, then 0 tests fail — no regression from the extraction.

**AC5:** Given the inline step now calls the extracted module, when CI runs on a PR with a valid feature slug, then the audit comment posted is functionally equivalent to the output before the extraction (same content structure, same story-level data, same check verdicts).

## Out of Scope

- Adding the path traversal guard to `sourceIntegrity` — that is SC-06 (this story extracts the function with no logic changes).
- Extracting other workflow steps (dependency graph building, artifact upload) — separate stories if warranted.
- Changing the behaviour of any extracted function — extraction only; logic changes are SC-06's scope.

## NFRs

- **Functional equivalence:** CI audit comments must have identical content structure before and after extraction.
- **No external npm dependencies.**
- **Importability:** Extracted module must be `require()`-able from a test runner without needing GitHub Actions context variables set.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
