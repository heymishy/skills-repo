## Test Plan: `/discovery` Reference Corpus Integration

**Story reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.3-discovery-integration.md`
**Epic reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/epics/rrc-epic-1.md`
**Test plan author:** Copilot
**Date:** 2026-04-30

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | /discovery SKILL.md checks for `discovery-seed.md` in `artefacts/[system-slug]/reference/` and pre-populates problem framing if found | 2 tests | — | — | — | — | 🟢 |
| AC2 | Pre-populates existing Constraints section from `constraint-index.md` (not a new heading) | 2 tests | — | — | — | — | 🟢 |
| AC3 | Check is conditional — no error if corpus absent | 1 test | — | — | — | — | 🟢 |
| AC4 | check-skill-contracts.js contract markers for /discovery unchanged | 1 test | — | — | — | — | 🟢 |
| AC5 | Operator can override pre-populated constraints | 1 test | — | — | — | — | 🟢 |
| 3-L1 | Uses existing Constraints section heading, not new "Known legacy constraints" heading | 1 test | — | — | — | — | 🟢 |
| 3-L2 | SKILL.md includes disambiguation instruction for system slug | 1 test | — | — | — | — | 🟢 |
| NFR | Additions ≤ ~20 lines (no hard NFR, reasonableness check only) | 1 test | — | — | — | — | 🟡 |

**Note on 3-L1:** Review finding 3-L1 flagged that the constraint pre-population must use the existing `## Constraints` section in the discovery template — it must NOT introduce a new heading like "Known legacy constraints". This is tested explicitly.

**Note on 3-L2:** Review finding 3-L2 flagged that when an operator doesn't name a system, /discovery must ask for clarification. This disambiguation instruction must appear in the SKILL.md.

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| NFR line budget | NFR | Partial | Total additions not precisely constrained — test asserts a maximum of 50 lines added relative to the pre-implementation baseline | Note in script; acceptability is operator judgement |

---

## Test Data Strategy

**Source:** Synthetic — test scripts read `.github/skills/discovery/SKILL.md` content.
**PCI/sensitivity in scope:** No
**Availability:** File exists; tests fail on pre-implementation content.
**Owner:** Self-contained.

---

## Unit Tests

**Test file:** `tests/check-rrc3-discovery-integration.js`
**Framework:** Node.js built-ins only (`fs`, `path`) — zero external dependencies.

---

### T3.1 — SKILL.md references reading `discovery-seed.md` from the reference corpus (AC1)
**Covers:** AC1
**Action:** Search `discovery/SKILL.md` for "discovery-seed".
**Expected:** SKILL.md contains "discovery-seed" — indicating it reads or checks for this file.
**Fails before implementation:** Yes.

---

### T3.2 — SKILL.md references the `artefacts/[system-slug]/reference/` path (AC1)
**Covers:** AC1
**Action:** Search `discovery/SKILL.md` for "reference/" or "reference corpus" path reference near discovery-seed.
**Expected:** SKILL.md contains a reference to reading from `artefacts/[slug]/reference/` or equivalent.
**Fails before implementation:** Yes.

---

### T3.3 — Pre-population targets the Constraints section (not a new heading) (AC2, 3-L1)
**Covers:** AC2, 3-L1
**Action:** Search `discovery/SKILL.md` for "constraint-index" near "Constraints" section context.
**Expected:** SKILL.md references pre-populating the Constraints section; it must NOT introduce a "Known legacy constraints" heading.
**Fails before implementation:** Yes.

---

### T3.4 — `Known legacy constraints` heading does NOT appear (3-L1)
**Covers:** 3-L1 (low finding carry-forward)
**Action:** Search `discovery/SKILL.md` for "Known legacy constraints".
**Expected:** This heading does NOT appear in the file. Constraints from the corpus must populate the existing `## Constraints` (or equivalent) section, not a new sub-section.
**Fails before implementation:** No (pre-implementation file should not have this heading either; failure = regression or incorrect implementation).

---

### T3.5 — Check is conditional: "if present" or equivalent guard (AC3)
**Covers:** AC3
**Action:** Search `discovery/SKILL.md` near discovery-seed/constraint-index references for conditional language.
**Expected:** SKILL.md uses language like "if present", "if found", "if corpus exists", or "when available" for the corpus check — the skill does not fail when no corpus exists.
**Fails before implementation:** Yes.

---

### T3.6 — /discovery contract markers intact (AC4)
**Covers:** AC4
**Action:** Verify `name:`, `description:`, `triggers:`, and outputs section all present in `discovery/SKILL.md`.
**Expected:** All four markers present — implementation must not remove or break them.
**Fails before implementation:** No — pre-implementation file should have them; failure = regression.

---

### T3.7 — Operator override instruction present (AC5)
**Covers:** AC5
**Action:** Search `discovery/SKILL.md` for language about overriding or adjusting pre-populated constraints.
**Expected:** SKILL.md contains instruction that the operator can override or change the pre-populated values (e.g. "the operator can edit", "override", "adjust", or "confirm or change").
**Fails before implementation:** Yes.

---

### T3.8 — System-slug disambiguation instruction present (3-L2)
**Covers:** 3-L2 (low finding carry-forward)
**Action:** Search `discovery/SKILL.md` for disambiguation language — asking the operator to clarify which system when not named.
**Expected:** SKILL.md includes instruction to ask for the system slug or name when the operator has not specified one. This prevents ambiguous corpus lookups.
**Fails before implementation:** Yes.

---

### T3.9 — NFR: additions do not bloat the file unreasonably
**Covers:** NFR
**Action:** Count lines in `discovery/SKILL.md`; assert total ≤ 700 (reasonableness bound, not a hard contract).
**Expected:** Line count ≤ 700. rrc.3 adds corpus-check instructions (~10–20 lines); anything beyond 50 additional lines warrants review.
**Fails before implementation:** No. Fails after implementation if implementation added excessive content.

---

## Integration Tests

None — changes are to a single SKILL.md file. No component integration seams.

---

## Gap table

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Cannot directly test whether /discovery actually reads a physical file during a live run | AC1 | Runtime behaviour | /discovery is a skill (instruction file), not executable code | Covered by manual verification script scenario 1 |
| Operator override cannot be simulated without a live agent run | AC5 | Runtime behaviour | Same — instruction-only | Covered by manual verification script scenario 5 |

---

## NFR Tests

| NFR | Test | Pass condition |
|-----|------|----------------|
| Additions ≤ ~20 lines | T3.9 | Total SKILL.md ≤ 700 lines (reasonableness bound) |

---

## Implementation notes for the coding agent

1. Edit `.github/skills/discovery/SKILL.md` to add a corpus-check step at the start of the discovery session.
2. The step checks for `artefacts/[system-slug]/reference/discovery-seed.md` and `artefacts/[system-slug]/reference/constraint-index.md`.
3. If `discovery-seed.md` is present: pre-populate the Problem framing section with content from the seed.
4. If `constraint-index.md` is present: pre-populate the existing `## Constraints` section (do NOT add a new heading).
5. Both checks must be conditional ("if present") — the skill must work when no corpus exists.
6. If the operator has not specified which system, prompt for the system name before the corpus lookup.
7. Add a note that the operator can review and override any pre-populated content.
8. Keep additions to ~20 lines maximum.
