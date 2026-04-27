# Story: Produce a ranked markdown artefact with enforced rationale fields, divergence record, and v2 extension point, and save it to disk

**Epic reference:** artefacts/2026-04-27-prioritise-skill/epics/pr-e1.md
**Discovery reference:** artefacts/2026-04-27-prioritise-skill/discovery.md
**Benefit-metric reference:** artefacts/2026-04-27-prioritise-skill/benefit-metric.md

## User Story

As a **tech lead, product manager, or business lead**,
I want to **receive a clean ranked markdown artefact with scores, rationale, and any divergence record, and have the skill save it to a named file on disk**,
So that **I have a stakeholder-shareable decision record that does not require editing before sharing, and that persists beyond the chat session**.

## Benefit Linkage

**Metric moved:** M1 — Session completion rate; M2 — Input quality / rationale completeness; MM1 — Cold-start replication
**How:** A session is only counted as complete (M1) when an artefact is written to disk — this story provides the mechanism. The output format enforces a rationale field per item per framework (M2) — absence is visible in the artefact structure, not hidden. The extension-point documentation for v2 frameworks makes the skill self-contained for a cold-start operator who wants to know how to add Kano or ICE without asking the original author (MM1).

## Architecture Constraints

- ADR-011: This story produces the final committed SKILL.md at `.github/skills/prioritise/SKILL.md`. It must be merged via PR with human review (C2 from discovery).
- C6 (from discovery): The complete SKILL.md must pass `scripts/check-skill-contracts.js` — this story's AC6 verifies this.
- C5 (from discovery): Output format is plain markdown — self-contained, no runtime dependencies, readable without the pipeline dashboard.
- Architecture pattern: *"Group instruction-text-only changes at the same exit point into a single story"* — output format, rationale enforcement, extension point, and save are all session-close concerns grouped here.

## Dependencies

- **Upstream:** pr.2 (scoring), pr.3 (divergence record), pr.4 (workshopping notes) must all be complete — this story's output format consumes all three inputs. pr.1 and pr.4 are implicitly covered by the prior stories.
- **Downstream:** None — this is the last story in the epic.

## Acceptance Criteria

**AC1:** Given a completed scoring session (one or more framework passes), when the skill presents the output artefact, then it is formatted as a markdown document containing: (a) the candidate list with final rankings, (b) scores per item per framework used, (c) a rationale field per item per framework (containing the elicited rationale or the "[rationale not provided]" placeholder from pr.2), and (d) a session metadata block (date, framework(s) used, operator-confirmed resolution if divergence was present).

**AC2:** Given the output artefact contains one or more items with "[rationale not provided]" in a rationale field, when the skill presents the artefact for review, then it highlights each missing rationale explicitly (e.g. "⚠ 2 items are missing rationale — the artefact is complete but these gaps are visible to stakeholders") and offers the operator a chance to fill them before saving — it does not silently omit the warning.

**AC3:** Given a multi-framework session where divergence was detected and explained (pr.3), when the output artefact is produced, then it includes a divergence section naming the items that ranked differently across frameworks, the model-level explanation of why they diverged, and the operator's resolution choice.

**AC4:** Given the operator is ready to save, when the skill prompts for a filename, then it suggests a default path (`artefacts/prioritise-[YYYY-MM-DD]-[topic-slug].md`) and accepts any operator-provided path — it does not save without confirming the path with the operator.

**AC5:** Given the artefact is saved to disk, when the skill confirms the save, then it displays the confirmed path, states that the session is complete, and does not prompt for further actions within this session — it exits cleanly.

**AC6:** Given all five pr.* stories have been implemented and the complete SKILL.md at `.github/skills/prioritise/SKILL.md` exists, when `node scripts/check-skill-contracts.js` is run, then it reports 0 contract violations for the new skill.

**AC7:** Given the output artefact, when a non-engineer stakeholder with no pipeline context reads it, then the artefact contains no unexplained pipeline jargon — all framework abbreviations (WSJF, RICE, MoSCoW) are expanded on first use in the artefact header or a brief legend section.

**AC8:** Given the completed SKILL.md, when any operator reads the extension point section at the bottom of the file, then it contains explicit instructions for how to add a new framework in v2 — naming the sections to add, the scoring dimension structure to follow, and the output format field to extend — sufficient for a contributor who was not part of this feature's delivery to add Kano without asking the original author.

## Out of Scope

- Dashboard integration or pipeline-state.json writeback of the prioritisation result — the artefact is a decision record, not a pipeline state update
- Automatic commit of the artefact to git — the operator saves the file; committing is a deliberate human action
- Publishing the artefact to any external tool (Jira, Confluence, GitHub Issues)
- Generating an executive summary or a format other than markdown

## NFRs

- **Performance:** None — conversational skill; file save is a local operation.
- **Security:** No credentials, tokens, or personal identifiers in the output artefact — scores and rationale are operator-authored content.
- **Accessibility:** Not applicable — instruction text and markdown output.
- **Audit:** None beyond the artefact itself being the decision record.
- **Skill contract:** Complete SKILL.md must pass `check-skill-contracts.js` with 0 violations (AC6).

## Complexity Rating

**Rating:** 1
**Rationale:** The output format is well-defined by the ACs; the save mechanism is a simple file-write instruction in the SKILL.md. No ambiguity in scope or implementation path. The contract check (AC6) provides an objective completion gate.
**Scope stability:** Stable
