---
title: Quality Assurance Core Standards
discipline: quality-assurance
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-10
---

# Quality Assurance Core Standards

**Discipline:** quality-assurance
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-10

These standards define the universal baselines for quality assurance across all surfaces and domains. Domain and squad extensions may add requirements; they may not relax these baselines.

## Requirements

- MUST have a test plan authored and approved before implementation begins
- MUST maintain the automated regression suite — the suite must not shrink without an approved justification recorded in a decision log entry
- MUST produce test evidence in a format that allows independent verification of coverage claims
- SHOULD classify tests according to the test pyramid layers with explicit counts per layer recorded
- SHOULD automate regression tests for any defect whose root cause has been identified and resolved
- MAY use manual test checklists for surface types where automated execution is not available, provided each execution is signed off with a named reviewer
- MUST, when a story reads a file written by another story, document at DoR time the exact field names and types required from that file. The obligation sits with the consuming story — the producing story cannot know what future consumers will need. Schema requirements must be listed in the consuming story's DoR contract before the producing story is merged.
- MUST create NFR guardrail entries (e.g. `NFR-[story-id]-*` in `pipeline-state.json`) at inner-loop branch-setup time. Stories delivered without NFR guardrail entries in state represent a gap in the compliance record.
- MUST run governance preflight checks before implementation when changing skills, templates, schema, or state-write logic. At minimum run `node .github/scripts/check-governance-sync.js` and the trace/schema validator path used in CI. Do not start implementation on a red governance baseline.
- MUST enforce story isolation at PR review for DoR-scoped stories. If a PR includes unrelated story payload outside the declared contract touch points, record a scope deviation and block merge until the payload is split or explicitly risk-accepted.
- MUST, when writing a test that extracts a window of text from a SKILL.md file, anchor the search on the section's `##` heading line (e.g. `indexOf('## Entry C')`) rather than on the concept phrase alone. A concept phrase (e.g. `"Entry C"`) may appear in an earlier section's boundary text before the target section heading, producing a window that silently omits the actual section content. Anchor on heading; never on free-text concept.
- SHOULD, when a story's acceptance criterion depends on VS Code extension loading behaviour (slash command availability, Copilot panel rendering, IDE-injected telemetry), flag this as an IDE-dependent gap at test-plan authoring time. Document the architectural guarantee instead (files are correctly placed; IDE extension loads them). Record as an accepted-gap test-plan entry and accepted deviation in the DoD. Do not leave IDE-dependency discovery to the implementing agent.
