# Validation Playbook — Skills Platform Phase 1 + Phase 2

**Audience:** Second operator with no prior knowledge of this platform. Written for clean Windows or macOS.
**Purpose:** Confirm the platform is installable, functionally correct, and meets its stated benefit metrics before proceeding to Westpac pilot or Phase 3 scoping.
**Total estimated time:** 2–3 hours (30 min + 60–90 min + 20 min)
**References:** `MODEL-RISK.md`, `HANDOFF.md`, `.github/architecture-guardrails.md`

---

## Prerequisites

- Git ≥ 2.39
- Node.js ≥ 20 (LTS)
- A text editor or browser — no IDE required for Parts 2 and 3
- A GitHub account (read-only) to view PRs referenced in HANDOFF.md

---

## Part 1 — Clean Install Validation (~30 min)

This part confirms the platform installs correctly and all governance checks pass from a cold start. Run every step in order. Do not skip or reorder.

### Step 1 — Clone (fresh copy, not your existing clone)

```bash
git clone https://github.com/heymishy/skills-repo.git skills-platform-val
cd skills-platform-val
```

**Pass:** Clone succeeds, directory `skills-platform-val` exists.
**Fail:** Any network error or authentication failure — resolve network access before proceeding.

### Step 2 — Run the full governance test suite

```bash
npm test
```

**Expected outcome (as of Phase 2 close):**
- `[viz-check]` — 1 script block(s) OK — pipeline-viz.html is clean
- `[governance-sync]` — 13 gate(s) in sync ✓
- `[viz-behaviour]` — 70 passed, 0 failed
- `[skill-contracts]` — 36 skill(s), 155 contract(s) OK ✓
- `[pipeline-paths]` — 14 path(s), 32 reader link(s) OK ✓
- All remaining checks: passed with 0 failures

**Pass:** All checks report passed, zero failures, zero errors in output.
**Fail:** Any line containing `FAIL`, `ERROR`, or a non-zero exit code. Record the exact failing check name and output line — do not proceed with Parts 2–3 until resolved.

> `npm test` runs 21 individual governance checks covering: pipeline-viz syntax, governance gate sync, skill contracts (SKILL.md mandatory sections), pipeline artefact paths, changelog/README consistency, workspace state schema, skill assembly, surface adapter routing, MODEL-RISK schema, suite schema, standards model structure, assurance gate, watermark gate, viz behaviour (70 unit tests), definition skill, fleet aggregation, DoR approval, Bitbucket Cloud CI, Bitbucket DC CI, improvement agent, and challenger.

### Step 3 — Open the pipeline visualiser in a browser

Open `.github/pipeline-viz.html` directly in any browser (double-click, or `open .github/pipeline-viz.html` on macOS / `start .github/pipeline-viz.html` on Windows).

**Pass:** Page renders without error. The feature list shows at least two features labelled `2026-04-09-skills-platform-phase1` and `2026-04-11-skills-platform-phase2`. Story counts are visible. Fleet panel shows at least two squad entries.
**Fail (check):** Page is blank or shows a JS error in browser console — check that you opened the file from the repo root (not a downloaded copy with blocked assets).
**Fail (content):** Only one feature appears, or fleet panel is empty — this indicates a data regression; file a bug before proceeding.

### Step 4 — Confirm MODEL-RISK.md Section 4 sign-off is populated

Open `MODEL-RISK.md` and scroll to **Section 4 — Sign-off Record**.

**Pass:** The sign-off block contains a reviewer name, a review date, and a verdict value of `approved for adoption` or `approved with conditions`. No placeholder text (e.g. `[FILL IN]`) appears in the block.
**Fail:** Sign-off block contains placeholder text or is absent — the platform has not been cleared for non-dogfood adoption. Do not proceed with a Westpac pilot until the block is complete and signed.

### Step 5 — Confirm HANDOFF.md enterprise architecture section

Open `HANDOFF.md` and locate **Section 2 — Architectural Decisions**.

**Pass:** Section 2 lists ADR-001 through at least ADR-006 with titles and status fields. The list is not truncated with a placeholder.
**Fail:** ADRs are missing or show `[FILL IN]` — handoff document is incomplete.

### Step 6 — Validate trace file exists and is parseable

No extra tools needed — open the trace file directly:

```
workspace/traces/2026-04-11T21-33-02-002Z-ci-84f82370.jsonl
```

**Pass:** File opens. It contains two lines (objects): one with `"status": "inProgress"` and one with `"status": "completed"`. The `completed` entry contains `traceHash`, `commitSha`, and `"verdict": "pass"`.
**Fail:** File is missing or contains fewer entries — the assurance gate did not write correctly. Check `tests/check-assurance-gate.js` output from Step 2.

### Step 7 — Confirm watermark baseline exists

Open `workspace/results.tsv` in a text editor.

**Pass:** File contains a header row and at least one data row. The `verdict` column in the data row is `baseline`, `pass`, or `blocked` (not empty).
**Fail:** File is empty or missing — watermark gate has never run. This is a regression; `npm test` should have caught it in Step 2.

---

**Part 1 summary — record your results:**

| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Clone | ☐ | ☐ | |
| npm test | ☐ | ☐ | |
| Pipeline viz | ☐ | ☐ | |
| MODEL-RISK sign-off | ☐ | ☐ | |
| HANDOFF ADRs | ☐ | ☐ | |
| Trace file | ☐ | ☐ | |
| Watermark baseline | ☐ | ☐ | |

**Gate:** All 7 checks must pass before proceeding to Part 2. Any failure is a platform defect — note it, stop, notify the platform maintainer.

---

## Part 2 — Benefit Validation (~60–90 min)

This part tests whether the five most important platform benefits are present and measurable. Each metric has an expected result, a measurement method, and a pass/fail criterion.

> **Note on M1:** M1 requires a real second-operator run and cannot be completed by the same operator who delivered Phase 2. If you are the platform maintainer, record M1 as "pending second-operator run" and proceed to M2.

---

### M1 — Second-operator replication rate (unassisted outer loop)

**What you are measuring:** Does the platform's own reference material allow a different operator to complete the full outer loop (discovery → benefit-metric → definition → review → test-plan → DoR) without contacting the platform team?

**How to measure:**
1. Using only the platform's own reference material (README.md, HANDOFF.md, `.github/copilot-instructions.md`, skill files), choose an unrelated idea (not related to the skills platform).
2. Run the full outer loop: `/discovery` → `/benefit-metric` → `/definition` → `/review` → `/test-plan` → `/definition-of-ready`.
3. Record for each stage: completed without blocking lookup (Y/N), any blocking lookup (description).
4. Record total focus time in hours (not elapsed calendar time — active working time only).

**Expected:** All six stages complete in a single session. Zero blocking lookups requiring platform team contact. Total focus time < 3h.
**Minimum passing signal:** All stages complete, even if some blocking lookups were needed — any blocking lookup is a platform gap, not a fail, but must be logged.
**Fail:** Any stage fails to complete even after a genuine attempt, requiring platform maintainer intervention. This means the platform is not self-sufficient for second-operator use.

| Field | Expected | Actual | Verdict |
|-------|----------|--------|---------|
| Stages completed | 6 of 6 | | |
| Blocking lookups | 0 | | |
| Focus time | < 3h | | |

---

### M2 — Non-git-native surface adapter — assurance verdict

**What you are measuring:** Does at least one non-git-native surface adapter type (IaC, SaaS-API, SaaS-GUI, M365-admin, or manual) produce a correct assurance gate selection?

**How to measure:**
1. Open `src/surface-adapter/` — confirm at least five adapter subdirectories exist beyond `git-native`.
2. Open `src/surface-adapter/resolver.js` — confirm a dispatch table mapping surface types to adapters.
3. Open `workspace/traces/2026-04-11T21-33-02-002Z-ci-84f82370.jsonl` — check the `completed` entry's `surfaceType` field.
4. Open any merged Phase 2 story in `artefacts/2026-04-11-skills-platform-phase2/stories/` for a surface adapter story (p2.5a, p2.5b, p2.4) — confirm DoD is marked complete.

**Expected:** At minimum 5 surface adapters present in `src/surface-adapter/adapters/`. Resolver dispatches correctly. At least one non-git-native adapter story is DoD-complete.
**Fail:** Only `git-native` adapter present, or resolver has no dispatch table, or all surface adapter stories lack DoD artefacts.

| Field | Expected | Actual | Verdict |
|-------|----------|--------|---------|
| Adapter types present | ≥ 5 (inc. git-native) | | |
| Resolver dispatch table present | Y | | |
| Non-git-native story DoD-complete | Y (p2.4, p2.5a, or p2.5b) | | |

---

### M4 — Fleet observability — ≥2 squad states visible

**What you are measuring:** Does the fleet aggregation produce at least two squad entries without manual data entry?

**How to measure:**
1. Open `fleet/squads/` — confirm at least two JSON files (e.g. `squad-alpha.json`, `squad-beta.json`).
2. Open `fleet-state.json` at repo root — confirm at least two squad entries are present.
3. Open `.github/pipeline-viz.html` in a browser — confirm the fleet panel renders both squad cards.

**Expected:** Two squad JSON files in `fleet/squads/`, two entries in `fleet-state.json`, two squad cards visible in the fleet panel.
**Fail:** `fleet-state.json` is missing, has fewer than two entries, or was last edited manually (check `git log fleet-state.json` — the committer should be the CI job or platform maintainer running the aggregator, not an ad-hoc edit).

| Field | Expected | Actual | Verdict |
|-------|----------|--------|---------|
| Squad files in fleet/squads/ | ≥ 2 | | |
| Entries in fleet-state.json | ≥ 2 | | |
| Cards visible in pipeline-viz | ≥ 2 | | |

---

### MM1 — ADR-001 compliance: pipeline-viz.html is self-contained

**What you are measuring:** Pipeline-viz.html has no external CDN dependencies and no build step (ADR-001 from `.github/architecture-guardrails.md`).

**How to measure:**
1. Open `.github/pipeline-viz.html` in a browser with no internet access (disable wifi/ethernet), or use browser developer tools to block all external requests.
2. Confirm the viz renders fully — all panels visible, all features shown, fleet panel rendered.
3. In the browser developer tools Network tab, confirm zero external HTTP requests fired. All resources must be inline.

**Expected:** Full render with zero external requests. No CDN calls, no font imports from external sources.
**Fail:** Any external request fires, any content fails to load — ADR-001 is violated. This is a regression requiring an immediate fix.

| Field | Expected | Actual | Verdict |
|-------|----------|--------|---------|
| Renders with no internet | Y | | |
| External HTTP requests | 0 | | |

---

### MM2 — T3M1 honest baseline documented

**What you are measuring:** Whether the T3M1 partial result (3/8 Y) is honestly documented in MODEL-RISK.md, with the five unanswered questions identified by name.

**How to measure:**
1. Open `MODEL-RISK.md`, Section 3 — T3M1 Acceptance Test Record.
2. Confirm the status reads `PARTIAL — 3 of 8 questions answered Y at Phase 2 close`.
3. Confirm Q1, Q3, Q4 are marked Y and Q2, Q5, Q6, Q7, Q8 are marked N with a reason for each N.
4. Confirm the N answers each include a phrase identifying the Phase 3 gap closure.

**Expected:** Status block present, 3/8 Y, five N answers with Phase 3 gap references.
**Fail:** Section 3 is a placeholder, or all eight are marked Y (implying fabrication), or the N answers have no gap closure reference.

| Field | Expected | Actual | Verdict |
|-------|----------|--------|---------|
| T3M1 status block present | Y | | |
| Score recorded | 3/8 Y | | |
| N answers include Phase 3 references | Y (5 of 5) | | |

---

**Part 2 summary — record your results:**

| Metric | Expected | Actual | Verdict | Validator |
|--------|----------|--------|---------|-----------|
| M1 — second-operator replication | 6/6 stages, < 3h | | pass / fail / pending | |
| M2 — surface adapter assurance | ≥5 adapters, DoD-complete | | pass / fail | |
| M4 — fleet observability | ≥2 squads visible | | pass / fail | |
| MM1 — ADR-001 self-contained viz | 0 external requests | | pass / fail | |
| MM2 — T3M1 honest baseline | 3/8 Y documented | | pass / fail | |

**Gate:** M2, M4, MM1, MM2 must pass. M1 may be marked "pending second-operator run" if you are the platform maintainer — but it must be run and recorded before the Westpac pilot begins.

---

## Part 3 — T3M1 Independent Audit (~20 min)

**Audience:** This part is designed for a non-engineer (programme manager, risk lead, or designated auditor). No command-line access required. All steps involve reading files in a text editor or browser.

**What this audit measures:** Whether a non-engineering reviewer can locate and evaluate all eight T3M1 audit questions using the trace file and watermark log alone, without asking an engineer for help.

**Honest baseline:** At Phase 2 close, 3 of 8 questions are answerable Y. This is the expected result. If you find 8/8 Y, pause — either Phase 3 has been delivered, or an answer has been fabricated. Do not mark N as Y to show a better result.

---

### What to open

You need two files:

**File A — Trace file:** `workspace/traces/2026-04-11T21-33-02-002Z-ci-84f82370.jsonl`
Read the second line (the `completed` entry). This is a JSON object. You are looking for named fields.

**File B — Watermark log:** `workspace/results.tsv`
This is a tab-separated file. Open it in a text editor. The columns are: `timestamp`, `skillSetHash`, `surfaceType`, `passRate`, `fullTestScore`, `verdict`, `trigger`.

**File C — Audit question guide:** `MODEL-RISK.md`, Section 2 — Audit Question Mapping Table
Use this to locate the answer to each question if you are unsure where to look.

---

### The audit — answer each question Y or N

| # | Audit Question | Field to check | File | Your answer (Y/N) |
|---|----------------|----------------|------|-------------------|
| Q1 | What instruction set governed this action? | `traceHash` present and non-empty | File A (completed entry) | |
| Q2 | Which standards applied? | `standardsInjected` array present with ≥1 entry | File A (completed entry) | |
| Q3 | Which model/commit produced the output? | `commitSha` present and non-empty | File A (completed entry) | |
| Q4 | Was the output validated? | `verdict` is `pass` or `fail` | File A (completed entry) | |
| Q5 | Was regression detected? | Row in File B with matching `skillSetHash`, `verdict` column present | File B | |
| Q6 | Was staleness flagged? | `stalenessFlag` field present in completed entry | File A (completed entry) | |
| Q7 | Was agent independence evidenced? | Three separate trace entries with `trigger: manual` (×2) and `trigger: ci` (×1) | File A | |
| Q8 | Is the hash verifiable against the registry? | `traceHash` value can be independently recomputed by comparing `.github/skills/` git history at `commitSha` | File A + git log | |

**Expected Phase 2 close result:** Q1=Y, Q2=N, Q3=Y, Q4=Y, Q5=N, Q6=N, Q7=N, Q8=N → **3/8 Y**

If your result differs from 3/8 Y, note the discrepancy here:
> Discrepancy note: _____________________________________________

---

### Sign the audit record

Complete this block and add it as a new row to **MODEL-RISK.md Section 3** immediately below the Phase 2 baseline record:

```
| Independent audit by | [Your name] |
| Audit date           | [YYYY-MM-DD] |
| Trace file used      | workspace/traces/2026-04-11T21-33-02-002Z-ci-84f82370.jsonl |
| Q1 result            | [Y/N] |
| Q2 result            | [Y/N] |
| Q3 result            | [Y/N] |
| Q4 result            | [Y/N] |
| Q5 result            | [Y/N] |
| Q6 result            | [Y/N] |
| Q7 result            | [Y/N] |
| Q8 result            | [Y/N] |
| Overall score        | [X/8 Y] |
| Notes                | [Any discrepancies or observations] |
```

**Pass:** You can complete the audit from the files alone, without asking an engineer for help, within 20 minutes.
**Fail:** Any question requires engineering assistance or system access beyond reading the two files. This is a T3M1 gap — log it in MODEL-RISK.md alongside the question number.

---

## Results Summary

Complete this table at the end of the full playbook run.

| Part | Check | Expected | Actual | Verdict | Validator name | Date |
|------|-------|----------|--------|---------|----------------|------|
| 1 | Clone | Clean | | | | |
| 1 | npm test | All pass | | | | |
| 1 | Pipeline viz | 2 features, 2 squads | | | | |
| 1 | MODEL-RISK sign-off | Signed, not placeholder | | | | |
| 1 | HANDOFF ADRs | ADR-001 to ADR-006+ | | | | |
| 1 | Trace file | 2 entries, verdict=pass | | | | |
| 1 | Watermark baseline | ≥1 row | | | | |
| 2 | M1 | 6/6 stages, <3h (or pending) | | | | |
| 2 | M2 | ≥5 adapters, DoD-complete | | | | |
| 2 | M4 | ≥2 squads visible | | | | |
| 2 | MM1 | 0 external requests | | | | |
| 2 | MM2 | 3/8 Y documented | | | | |
| 3 | T3M1 audit | 3/8 Y (honest baseline) | | | | |

**Platform adoption gate:** All Part 1 checks pass + M2, M4, MM1, MM2 pass + T3M1 audit signed → platform is cleared for Westpac pilot.
**Blocked items before full clearance:** M1 requires a real second-operator outer loop run (pending). T3M1 full 8/8 requires Phase 3 delivery.
