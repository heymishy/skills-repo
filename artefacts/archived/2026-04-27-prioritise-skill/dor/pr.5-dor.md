# Definition of Ready: Produce a ranked markdown artefact with enforced rationale fields, divergence record, and v2 extension point, and save it to disk

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.5.md
**Test plan reference:** artefacts/2026-04-27-prioritise-skill/test-plans/pr.5-test-plan.md
**Verification script:** artefacts/2026-04-27-prioritise-skill/verification-scripts/pr.5-verification.md
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-27

---

## Contract Proposal

### What will be built

The coding agent will complete `.github/skills/prioritise/SKILL.md` by adding the output format, rationale enforcement, extension point, and artefact-save sections; add the `prioritise` entry to `CONTRACTS[]` in `.github/scripts/check-skill-contracts.js`; and create `tests/check-pr.5.js`.

**SKILL.md content (sections authored in this story):**

1. **Output artefact format** — markdown document containing: (a) candidate list with final rankings, (b) scores per item per framework used, (c) a rationale field per item per framework (elicited or "[rationale not provided]" placeholder from pr.2), (d) session metadata block (date, framework(s) used, operator-confirmed resolution if divergence was present)
2. **Missing rationale warning** — highlights each "[rationale not provided]" item explicitly (e.g. "⚠ 2 items are missing rationale — the artefact is complete but these gaps are visible to stakeholders") and offers operator a chance to fill them before saving; does not silently omit the warning
3. **Divergence section** — when divergence was present (pr.3), output artefact includes a divergence section naming the items that ranked differently, the model-level explanation, and the operator's resolution choice
4. **Save with path confirmation** — skill suggests default path (`artefacts/prioritise-[YYYY-MM-DD]-[topic-slug].md`) and accepts any operator-provided path; does not save without confirming path
5. **Clean exit** — after save, displays confirmed path, states session is complete, does not prompt for further actions
6. **Framework abbreviation expansion** — all framework abbreviations (WSJF, RICE, MoSCoW) expanded on first use in the artefact header or legend section (full names: Weighted Shortest Job First, Reach-Impact-Confidence-Effort, Must-have/Should-have/Could-have/Won't-have)
7. **Extension point section** — explicit instructions for adding a new framework in v2: names sections to add, scoring dimension structure to follow, output format field to extend

**`check-skill-contracts.js` change:**

Add a `prioritise` entry to the `CONTRACTS[]` array in `.github/scripts/check-skill-contracts.js` naming at minimum the required structural section markers:
- Framework names section (e.g. `## Frameworks` or `## Available Frameworks`)
- Output format marker (e.g. `## Output Format` or `## Artefact Format`)
- Extension point section (e.g. `## Extension Point` or `## Adding a New Framework`)
- State update section (e.g. `## State update` — following the standard SKILL.md pattern)

**Test script (`tests/check-pr.5.js`):**

Node.js script asserting text patterns in `.github/skills/prioritise/SKILL.md` for each AC, plus verifying the `prioritise` entry in `CONTRACTS[]`:
- AC1: output format fields present (rankings, scores, rationale, session metadata)
- AC2: missing rationale warning marker
- AC3: divergence section presence in output format description
- AC4: default save path pattern (`artefacts/prioritise-`) + confirm-before-save language
- AC5: clean exit marker
- AC6: full SKILL.md passes `check-skill-contracts.js` with 0 violations (integration test + verify prioritise entry exists in CONTRACTS[])
- AC7: framework expansion on first use (WSJF expanded, RICE expanded, MoSCoW expanded)
- AC8: extension point section with required content

`schemaDepends: []` — upstream dependencies are pr.2, pr.3, pr.4 (SKILL.md content); no pipeline-state.json schema fields involved.

### What will NOT be built

- Dashboard integration or pipeline-state.json writeback of prioritisation result
- Automatic git commit of the artefact
- Publishing to external tools (Jira, Confluence, GitHub Issues)
- Executive summary or non-markdown output format

### Open accepted deviation

- **1-L2 (LOW):** Default save path uses `artefacts/` root (`artefacts/prioritise-[YYYY-MM-DD]-[topic-slug].md`) rather than a feature-specific sub-path. The ideal path would be `artefacts/[feature-slug]/prioritisation/[...]`. Accepted for v1. The SKILL.md instructs use of `artefacts/` root; the extension point section can document the sub-path pattern for v2.

### AC → test mapping

| AC | Test(s) in test plan | Coverage |
|----|---------------------|---------|
| AC1 | T5.1 (rankings field), T5.2 (scores per framework), T5.3 (rationale field), T5.4 (session metadata block) | Full |
| AC2 | T5.5 (missing rationale warning marker — "⚠" or "warning" + "missing rationale") | Full |
| AC3 | T5.6 (divergence section in output format) | Full |
| AC4 | T5.7 (default path `artefacts/prioritise-`), T5.8 (confirm-before-save language) | Full; 1-L2 gap accepted |
| AC5 | T5.9 (clean exit — "session is complete" or "complete" + no-further-actions) | Full |
| AC6 | T5.10 (full SKILL.md contracts script exits 0), T5.11 (prioritise entry exists in CONTRACTS[]) | Full |
| AC7 | T5.12 (WSJF full name expanded), T5.13 (RICE full name or factors), T5.14 (MoSCoW full name or buckets) | Full |
| AC8 | T5.15 (extension point section with "v2" or "how to add" + sections to add) | Full |
| NFR | T5.16 (integration: contracts script 0 violations) | Full |

### Assumptions

- pr.1 through pr.4 complete before this story is implemented.
- The `prioritise` CONTRACTS entry must name structural markers that match section headings actually used in the SKILL.md — the coding agent must ensure consistency between the entry and the sections authored across pr.1–pr.5.

### Touch points

| File | Action | Notes |
|------|--------|-------|
| `.github/skills/prioritise/SKILL.md` | Extend + complete | Add output/save/extension-point sections; ensure complete file passes contracts |
| `.github/scripts/check-skill-contracts.js` | Modify | Add `prioritise` entry to `CONTRACTS[]` array |
| `tests/check-pr.5.js` | Create | Node.js test script for pr.5 ACs |

---

## Contract Review

- AC1: output format structure — testable via field-presence patterns. ✅
- AC2: warning for missing rationale — testable via "⚠" + "missing rationale" or warning pattern. ✅
- AC3: divergence section in output — testable via section header pattern. ✅
- AC4: default path + confirm-before-save — testable; 1-L2 gap (path at root not sub-folder) explicitly accepted. ✅
- AC5: clean exit — testable via "session is complete" or equivalent pattern. ✅
- AC6 (post-fix): requires `prioritise` entry in CONTRACTS[] — testable via script output AND direct array inspection. ✅ (1-H2 HIGH finding from review resolved: contract entry now required in AC6.)
- AC7: framework expansion — testable via full-name presence in artefact header context. ✅
- AC8: extension point with required content — testable via section presence + required keywords. ✅
- No mismatches. Contract clean.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a tech lead, product manager, or business lead / I want / So that" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 8 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | All 8 ACs covered (T5.1–T5.16) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit out-of-scope items |
| H5 | Benefit linkage field references a named metric | ✅ | References M1 (Session completion rate), M2 (Input quality / rationale completeness), MM1 (Cold-start replication) |
| H6 | Complexity is rated | ✅ | Complexity: 1; scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | 1-H1 (script path) and 1-H2 (AC6 vacuous pass) both RESOLVED in Run 1. Review verdict: PASS. |
| H8 | Test plan has no uncovered ACs | ✅ | All 8 ACs covered; 1-L2 gap (default path location) acknowledged in test plan gap table |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream = pr.2, pr.3, pr.4 (SKILL.md content only); schemaDepends: [] — no schema fields involved |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | ADR-011, C6, C5, markdown-only, architecture pattern cited; review Category E: PASS |
| H-E2E | CSS-layout-dependent AC check | ✅ | No CSS-layout-dependent ACs |
| H-NFR | NFR profile or explicit None | ✅ | All NFR categories explicitly None in story |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | "No credentials, tokens, or personal identifiers in the output artefact" confirmed |
| H-NFR-profile | NFR profile presence | ✅ | All NFR categories explicitly None; profile not required |

**All 15 hard blocks: PASS**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly None — confirmed | ✅ | — | All categories explicitly None |
| W2 | Scope stability declared | ✅ | — | Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | — | No MEDIUM findings for pr.5. Both findings were HIGH and RESOLVED in Run 1. |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss edge cases | Solo project — operator is domain expert; acknowledged for all 5 stories |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | 1-L2 gap (default path location) is documented as accepted design limitation, not UNCERTAIN |

**W4 acknowledged:** Same acknowledgement as pr.1–pr.4 — solo project.

---

## Oversight Level

**Oversight: High**
Rationale: Inherited from epic pr-e1. This story completes the SKILL.md and adds the `prioritise` entry to `CONTRACTS[]`. Per ADR-011 and C2, the complete SKILL.md requires a PR with explicit human review before merging. This is the final story in the epic — the operator must verify the complete SKILL.md end-to-end.

🔴 **High oversight** — operator reviews the complete SKILL.md from end to end and runs a full verification script walkthrough (all 8 scenarios) before merging the draft PR.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Produce a ranked markdown artefact with enforced rationale fields, divergence record, and v2 extension point, and save it to disk — artefacts/2026-04-27-prioritise-skill/stories/pr.5.md
Test plan: artefacts/2026-04-27-prioritise-skill/test-plans/pr.5-test-plan.md
DoR contract: artefacts/2026-04-27-prioritise-skill/dor/pr.5-dor.md

Goal:
Make every test in tests/check-pr.5.js pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Pre-condition:
pr.1, pr.2, pr.3, and pr.4 must all be complete. .github/skills/prioritise/SKILL.md
must exist with intake, scoring, divergence, and workshopping sections.

Files to modify/create:
1. .github/skills/prioritise/SKILL.md
   - EXTEND (do not rewrite any prior section). Add the output format, save, and extension point sections.
   - Output artefact format (AC1):
     * The output is a markdown document. Describe its structure explicitly with all four required fields:
       (a) candidate list with FINAL RANKINGS
       (b) SCORES per item per framework used
       (c) RATIONALE field per item per framework (elicited or "[rationale not provided]" placeholder)
       (d) SESSION METADATA block: date, framework(s) used, operator-confirmed resolution if divergence present
   - Missing rationale warning (AC2):
     * When the output contains "[rationale not provided]" entries, the skill MUST highlight them explicitly.
     * Use language like: "⚠ [N] items are missing rationale — the artefact is complete but these gaps are visible to stakeholders."
     * Offer the operator a chance to fill in missing rationales before saving.
     * Do NOT silently omit this warning.
   - Divergence section (AC3):
     * When a multi-framework session with divergence was run, include a divergence section in the output artefact.
     * Section must name: (1) items that ranked differently, (2) model-level explanation of why they diverged, (3) operator's resolution choice.
   - Save with path confirmation (AC4):
     * Suggest default path: `artefacts/prioritise-[YYYY-MM-DD]-[topic-slug].md`
     * Accept any operator-provided path.
     * Do NOT save without confirming the path with the operator.
   - Clean exit (AC5):
     * After save, display the confirmed path and state "the session is complete" (or equivalent).
     * Do NOT prompt for further actions within the session.
   - Framework abbreviation expansion (AC7):
     * ALL framework abbreviations must be expanded on FIRST USE in the artefact header or a brief legend section.
     * WSJF → "Weighted Shortest Job First (WSJF)"
     * RICE → "Reach, Impact, Confidence, Effort (RICE)"
     * MoSCoW → "Must-have, Should-have, Could-have, Won't-have (MoSCoW)"
   - Extension point section (AC8):
     * Add a clearly headed section (e.g. "## Adding a New Framework (v2 Extension Point)").
     * Must contain explicit instructions covering: (1) which sections to add, (2) the scoring dimension structure to follow, (3) the output format field to extend.
     * Must name at least one example framework (e.g. Kano or ICE) to make the instructions concrete.
   - State update section:
     * Include a "## State update — mandatory final step" section (standard SKILL.md pattern) as the last section.
     * This is required for the CONTRACTS[] entry and for consistency with other skills.

2. .github/scripts/check-skill-contracts.js
   - ADD a `prioritise` entry to the `CONTRACTS[]` array (do NOT remove or modify any existing entry).
   - The entry must name at minimum FOUR required structural section markers that will be present in the completed SKILL.md:
     * A framework names/description section (e.g. "## Available Frameworks" or "## Frameworks")
     * An output format section (e.g. "## Output Format" or "## Output Artefact")
     * An extension point section (e.g. "## Adding a New Framework" or "## Extension Point")
     * A State update section (e.g. "## State update")
   - IMPORTANT: The marker text in the CONTRACTS[] entry must EXACTLY match the section headings you use in SKILL.md. Verify this before opening the PR.
   - Do NOT change any other entry in CONTRACTS[].

3. tests/check-pr.5.js
   - Create this file. Node.js script (CommonJS, no external dependencies).
   - Tests to implement:
     * T5.1: SKILL.md contains "final rankings" or "ranked" in output format description (AC1 — rankings)
     * T5.2: SKILL.md contains "scores per" or "score per" or "scores for" in output format context (AC1 — scores)
     * T5.3: SKILL.md contains "rationale" field description in output format (AC1 — rationale field)
     * T5.4: SKILL.md contains "session metadata" or "date" AND "framework" in output header context (AC1 — metadata)
     * T5.5: SKILL.md contains missing-rationale warning pattern — "⚠" or "warning" AND "missing rationale" or "rationale not provided" in output context (AC2)
     * T5.6: SKILL.md contains divergence section in output format ("divergence section" or "divergence record" in output description) (AC3)
     * T5.7: SKILL.md contains default save path `artefacts/prioritise-` (AC4)
     * T5.8: SKILL.md contains confirm-before-save language ("confirm" and "path" near save instruction) (AC4)
     * T5.9: SKILL.md contains clean-exit language ("session is complete" or "complete" and "path" in save-confirm context) (AC5)
     * T5.10: Integration — run `node .github/scripts/check-skill-contracts.js`; assert exit code 0 AND output contains "0 violations" or "All contracts passed" (AC6)
     * T5.11: Read .github/scripts/check-skill-contracts.js and assert that the CONTRACTS array contains an entry with name "prioritise" or key "prioritise" (AC6 — entry exists)
     * T5.12: SKILL.md contains "Weighted Shortest Job First" or "Weighted Shortest Job" (AC7 — WSJF expansion)
     * T5.13: SKILL.md contains "Reach, Impact, Confidence, Effort" or "Reach-Impact-Confidence-Effort" (AC7 — RICE expansion)
     * T5.14: SKILL.md contains "Must-have, Should-have, Could-have, Won't-have" or "Must have" and "Should have" and "Could have" (AC7 — MoSCoW expansion)
     * T5.15: SKILL.md contains extension point section header AND at least one of: "sections to add" or "scoring dimension" or "output format field" or "how to add" (AC8)
     * T5.16: Integration (same as T5.10) — confirm 0 violations (NFR)
   - Script must exit 0 on pass, non-zero on fail.

Constraints:
- ONLY touch: .github/skills/prioritise/SKILL.md (extend), .github/scripts/check-skill-contracts.js (add entry only), tests/check-pr.5.js (create)
- Do NOT rewrite or remove any prior section in SKILL.md
- Do NOT modify any existing CONTRACTS[] entry — only add the new `prioritise` entry
- Do NOT implement dashboard integration, git commit automation, or external publishing
- Accepted LOW deviation (1-L2): default save path uses artefacts/ root, not a feature sub-path — this is by design
- Architecture standards: read .github/architecture-guardrails.md. SKILL.md = Markdown only. Scripts = plain Node.js CommonJS.
- Open a draft PR when tests pass — do not mark ready for review
- Oversight: High — operator reviews the complete SKILL.md end-to-end and runs all 8 verification scenarios before merging
- If you encounter an ambiguity: add a PR comment and do not mark ready for review

Oversight level: High
schemaDepends: []
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — human review of complete SKILL.md end-to-end; all 8 verification script scenarios executed by operator at PR review (this is the final story in the epic; the complete SKILL.md is the deliverable)
**Signed off by:** Operator review required at PR stage
