# DoR Contract: src.1 — Integrate CLI observability tools into skill routing

**Story:** artefacts/2026-04-21-skill-routing-cli-tools/stories/src.1-skill-routing-cli-integration.md
**DoR artefact:** artefacts/2026-04-21-skill-routing-cli-tools/dor/src.1-skill-routing-cli-integration-dor.md
**Signed off:** 2026-04-21

---

## Scope contract

### In scope — exact files to touch

| File | Change type | AC(s) |
|------|-------------|-------|
| `.github/skills/workflow/SKILL.md` | Text addition — callout block in session start section; trigger routing phrases | AC1, AC2, AC5 |
| `.github/skills/improve/SKILL.md` | Text addition — `## Benefit Measurement` callout block in completion section after Category E | AC3, AC4, AC5 |
| `tests/check-sro1-skill-routing.js` | New file — 10 governance tests (T1–T8, T-NFR1a, T-NFR1b) | All ACs |
| `package.json` | Append `&& node tests/check-sro1-skill-routing.js` to test script | CI coverage |
| `.github/pipeline-state.json` | Update src.1 story `dorStatus: "signed-off"`, `dorArtefact`, `dorContractArtefact`, `dorSignedOffAt` | Bookkeeping |

### Out of scope — must not touch

| File/area | Reason |
|-----------|--------|
| `scripts/generate-status-report.js` | DoD-complete, no changes required |
| `scripts/record-benefit-comparison.js` | DoD-complete, no changes required |
| `.github/copilot-instructions.md` | Skill routing lives in SKILL.md files, not copilot-instructions |
| Any other `.github/skills/*.md` | Only workflow and improve are in scope |
| `src/`, `standards/`, `dashboards/` | No changes to application code or standards |
| `artefacts/` (other than pipeline-state.json) | Pipeline artefacts are read-only to the coding agent |
| `.github/templates/`, `.github/governance-gates.yml` | Platform infrastructure — requires platform team PR |

---

## Schema dependency declaration

`schemaDepends:` none — no new fields written to `pipeline-state.json`. The `dorStatus`, `dorArtefact`, `dorContractArtefact`, and `dorSignedOffAt` fields already exist in the schema.

---

## Key implementation notes for the coding agent

**workflow/SKILL.md — where to insert:** In the session start behaviour section (the block that describes what to output when `/workflow` is run at the start of a session and a status table is presented). Insert the status report callout after the status table block and before the route selection question.

**workflow/SKILL.md — trigger routing:** In the triggers section or the route selector block, add `"daily report"`, `"weekly report"`, and `"pipeline status report"` as trigger phrases that route to the status report commands.

**improve/SKILL.md — where to insert:** At the end of the Category E (estimation actuals) section or immediately after it, before the `## Completion output` block. The new section heading is `## Benefit Measurement`.

**improve/SKILL.md — non-blocking requirement:** The benefit measurement section must explicitly offer a defer path, e.g.: "Reply: run now — or defer, and I'll continue to learning extraction." The skill must not pause and wait indefinitely.

**Test file structure:** Follow the pattern in `tests/check-p4-enf-decision.js` — `'use strict'`, `fs.readFileSync`, named `assert` function, labelled test blocks with `console.log`, final pass/fail summary, `process.exit(failed > 0 ? 1 : 0)`.
