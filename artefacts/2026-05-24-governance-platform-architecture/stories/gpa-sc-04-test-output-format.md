## Story: Write test output format standards document

**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-01-governance-foundation.md`
**Discovery reference:** `artefacts/2026-05-24-governance-platform-architecture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-05-24-governance-platform-architecture/benefit-metric.md`

## User Story

As a **platform operator** adding a new governance check script,
I want a canonical `standards/governance/test-output-format.md` document that specifies the `[suite-prefix] Results: N passed, N failed` output convention and the exact regex that assurance-gate.yml uses to parse it,
So that the test output format principle (currently implicit in assurance-gate.yml regex parsing logic) is documented, and any new check script is correctly parsed by the assurance gate without the author needing to reverse-engineer the convention from YAML.

## Benefit Linkage

**Metric moved:** M1 — Architecture documentation coverage (completes the principles not covered by SC-01); M3 — Architecture blind-spot recurrence rate (formally closes the test-output-format blind-spot category surfaced by trw.1).
**How:** The trw.1 post-merge story found that the test output prefix was non-conforming, causing the assurance gate to silently skip the check result. This story writes the standard that would have prevented that miss, closing the second of the three documented blind-spot categories.

## Architecture Constraints

- ADR-011: new `standards/governance/test-output-format.md` — this story artefact satisfies artefact-first.
- No enforcement module changes. Checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** None.
- **Downstream:** SC-07 (`gpa-sc-07-inline-js-extraction.md`) benefits from this standard existing (the extracted module's test output should conform), but does not formally depend on SC-04.

## Acceptance Criteria

**AC1:** Given a contributor needs to write a new governance check script, when they read `standards/governance/test-output-format.md`, then they find: (a) the required output prefix format (`[suite-name] Results: N passed, N failed`), (b) the exact regex used by assurance-gate.yml to parse it (quoted verbatim from the source), (c) at least one example of conforming output and one of non-conforming output, and (d) a clear statement of what happens when the format does not match (the check result is silently skipped — the most important consequence for a contributor to know).

**AC2:** Given test-output-format.md is committed, when `npm test` runs, then all existing tests continue to pass — no regression.

**AC3:** Given test-output-format.md references the historical trw.1 prefix fix (context: the trw1 test had an incorrect prefix that caused silent skip), when the document is read by a contributor unfamiliar with trw.1, then they understand: (a) the fix that was applied, and (b) why the format matters for gate parsing — without needing to read the trw.1 PR history.

**AC4:** Given the format standard exists, when a contributor writes a new governance check script and runs it locally, then they can verify format compliance by comparing their script's output against the examples in the standard before committing.

## Out of Scope

- Changes to the assurance-gate.yml parsing logic or regex — documentation only.
- Adding or modifying governance check scripts — separate stories.
- Changing the output format of any existing check script.

## NFRs

- **Accuracy:** The regex quoted in the document must be verbatim from the current assurance-gate.yml source at commit time.
- **No new npm dependencies.**

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
