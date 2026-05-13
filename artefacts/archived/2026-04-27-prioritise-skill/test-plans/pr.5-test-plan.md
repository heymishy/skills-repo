# Test Plan: Output format, rationale enforcement, extension point, and artefact save

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.5.md
**Epic reference:** artefacts/2026-04-27-prioritise-skill/epics/pr-e1.md
**Test plan author:** Copilot
**Date:** 2026-04-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Output includes all required sections: rankings, scores, rationale, session metadata | 3 tests | — | — | — | — | 🟢 |
| AC2 | Missing rationale highlighted with warning and offer to fill before saving | 2 tests | — | — | — | — | 🟢 |
| AC3 | Divergence section present when multi-framework pass ran | 2 tests | — | — | — | — | 🟢 |
| AC4 | Default save path suggested with operator confirmation before write | 2 tests | — | — | — | — | 🟢 |
| AC5 | Clean exit after save: no further prompts | 1 test | — | — | — | — | 🟢 |
| AC6 | Complete SKILL.md passes check-skill-contracts.js | — | 1 test | — | — | — | 🟢 |
| AC7 | Framework abbreviations expanded on first use in output | 2 tests | — | — | — | — | 🟢 |
| AC8 | Extension point section documents how to add new frameworks | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Default save path goes to artefacts/ root (accepted LOW 1-L2) | AC4 | Accepted design limitation | Ideal path would be `artefacts/[feature-slug]/prioritisation/[...]` rather than `artefacts/` root — accepted as LOW risk for v1, does not block | Noted in test gap table; no test written against the exact sub-path since this is an accepted deviation |

---

## Test Data Strategy

**Source:** Synthetic / self-contained — `.github/skills/prioritise/SKILL.md` is the artifact under test.
**PCI/sensitivity in scope:** No
**Availability:** Available when implementation exists (tests written to fail before implementation)
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC5, AC7–AC8 | SKILL.md file contents | File system read | None | Text pattern assertions |
| AC6 | SKILL.md + `.github/scripts/check-skill-contracts.js` | File system read | None | Integration: requires `prioritise` entry in `CONTRACTS[]` |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### instructs the output to include a rankings section

- **Verifies:** AC1
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for a rankings section in the output (check for: `## Rankings`, `rankings section`, `ranked list`)
- **Expected result:** Rankings section instruction present
- **Edge case:** No

### instructs the output to include scores and rationale alongside each ranked item

- **Verifies:** AC1
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for scores and rationale to appear with each ranked item (check for both: `scores` and `rationale` in the output format section)
- **Expected result:** Both scores and rationale required in output format
- **Edge case:** No

### instructs the output to include session metadata

- **Verifies:** AC1
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for session metadata in the output — check for: `session metadata`, `framework used`, `date`, `session date`
- **Expected result:** Session metadata section or field instruction present
- **Edge case:** No

### instructs the skill to highlight missing rationale with a warning before saving

- **Verifies:** AC2
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to highlight missing rationale at save time (check for: `highlights`, `warning`, `missing rationale`, `[rationale not provided].*warning`)
- **Expected result:** Missing-rationale highlight instruction present with warning language
- **Edge case:** No

### instructs the skill to offer to fill missing rationale before proceeding to save

- **Verifies:** AC2
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to offer rationale completion before save (check for: `offer.*fill`, `fill.*before saving`, `complete rationale`, `offers to fill`)
- **Expected result:** Offer-to-fill instruction present before save action
- **Edge case:** No

### instructs the output to include a divergence section when multi-framework

- **Verifies:** AC3
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for a divergence section in multi-framework output (check for: `divergence section`, `## Divergence`, `when.*multiple.*frameworks`, `multi-framework`)
- **Expected result:** Divergence section instruction present, conditioned on multi-framework pass
- **Edge case:** No

### instructs the divergence section to be omitted for single-framework output

- **Verifies:** AC3
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to omit the divergence section when only one framework was run (check for: `omitted.*single framework`, `only.*when.*multiple`, `does not include.*single`)
- **Expected result:** Single-framework omission instruction present
- **Edge case:** No

### instructs the skill to suggest the default save path `artefacts/prioritise-`

- **Verifies:** AC4
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for the default save path starting with `artefacts/prioritise-` (check for: `artefacts/prioritise-`, `default path`, `save path`)
- **Expected result:** Default path pattern `artefacts/prioritise-` present in save instruction
- **Edge case:** No

### instructs the skill to ask the operator to confirm before saving

- **Verifies:** AC4
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for operator confirmation before file write (check for: `confirm before`, `confirms the path`, `operator confirms`, `ask.*before saving`)
- **Expected result:** Confirm-before-save instruction present
- **Edge case:** No

### instructs the skill to exit cleanly after save with no further prompts

- **Verifies:** AC5
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for a clean exit after save (check for: `clean exit`, `no further prompts`, `session is complete`, `exits after saving`)
- **Expected result:** Clean-exit instruction present after save action
- **Edge case:** No

### instructs framework abbreviations to be expanded on first use in the output artefact

- **Verifies:** AC7
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to expand WSJF, RICE, and MoSCoW abbreviations on first use in the artefact (check for: `expand.*abbreviation`, `first use.*expanded`, `WSJF.*Weighted Shortest Job First`, `RICE.*Reach, Impact`)
- **Expected result:** Abbreviation expansion instruction present naming at least WSJF and RICE
- **Edge case:** No

### instructs that abbreviations may be used after first expansion

- **Verifies:** AC7
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction that abbreviated forms can be used after first expansion (check for: `abbreviated form.*subsequent`, `subsequent.*use.*abbreviated`, `after first use`, `may be abbreviated`)
- **Expected result:** Subsequent-use abbreviation permission instruction present
- **Edge case:** No

### instructs the SKILL.md to include an extension point section

- **Verifies:** AC8
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an extension point section (check for: `## Extension`, `## Adding new frameworks`, `extension point`, `v2 framework`)
- **Expected result:** Extension point section heading present in SKILL.md
- **Edge case:** No

### instructs the extension point section to name the steps for adding a new framework

- **Verifies:** AC8
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check the extension point section describes how to add a framework (check for any of: `add a new framework`, `adding a framework`, `to add v2 frameworks`, `add.*scoring logic`, `copy.*framework section`)
- **Expected result:** Extension point section contains actionable guidance for adding frameworks
- **Edge case:** No

---

## Integration Tests

### Complete SKILL.md passes check-skill-contracts.js with `prioritise` contract entry

- **Verifies:** AC6
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists AND `.github/scripts/check-skill-contracts.js` contains a `prioritise` entry in its `CONTRACTS[]` array
- **Action:**
  1. Read `.github/scripts/check-skill-contracts.js`
  2. Assert `CONTRACTS` array contains an entry with `skill: 'prioritise'` (or equivalent key)
  3. Run `node .github/scripts/check-skill-contracts.js` — assert exit code 0
- **Expected result:** Exit code 0 — all contracts pass including the new `prioritise` entry
- **Edge case:** If the `prioritise` entry does not yet exist in `CONTRACTS[]`, this test fails as expected (TDD RED state) — it is the implementer's responsibility to add it as part of this story

---

## NFR Tests

### SKILL.md additions contain no embedded HTML except HTML comments

- **NFR addressed:** Architecture constraint — Markdown only
- **Measurement method:** Read SKILL.md; assert no non-comment HTML tags present (cumulative check)
- **Pass threshold:** 0 non-comment HTML tags found
- **Tool:** Node.js regex check

---

## Out of Scope for This Test Plan

- Whether the saved artefact renders correctly in VS Code's Markdown preview — a rendering concern, not a skill instruction concern
- Whether the default path `artefacts/prioritise-` is the ideal sub-path (accepted LOW 1-L2 — see gaps table)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Default save path granularity (accepted LOW 1-L2) | The default path points to `artefacts/` root; the ideal path would include a feature sub-folder. Accepted as v1 limitation. | Documented in open LOW; no test written against the sub-path. Future story can tighten the default. |
| Extension point completeness (quality) | Text pattern check confirms the section exists; cannot validate whether the guidance is clear enough for a future engineer to actually add a framework | Manual verification scenario 8 in verification script — domain expert reviews extension point wording |
