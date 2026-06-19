---
name: coverage-map
description: >
  Produce a visual coverage map across all stories in a feature. Reads from
  existing pipeline artefacts (test plan .md files + pipeline-state.json).
  Answers two questions at a glance: what is tested, and by what kind of test?
  Where are the gaps, and how risky are they?
  Does not run tests. Does not read test results - reads test plans.
  Does not generate test plans - that is /test-plan.
  Does not fix gaps - reports them for humans to action.
triggers:
  - "show coverage"
  - "coverage map"
  - "what's covered"
  - "test coverage for"
  - "where are the gaps"
  - "/coverage-map"
---

# Coverage Map Skill

## Entry condition

None. Can run at any point after at least one test plan exists for the feature.
If no test plans exist yet, output:

> ⚠️ **No test plans found for this feature.**
> Run /test-plan for each story before generating a coverage map.
> Run /workflow to see the current pipeline state.

---

## Step 1 - Confirm scope

State what was found:

> **Feature:** [feature-name]
> **Stories with test plans:** [n of total]
> **Stories without test plans:** [names]
>
> Generate coverage map for all stories with test plans?
> Reply: yes — or name specific stories

---

## Step 2 - Read artefacts

For each story with a test plan, parse:

1. **AC coverage table** from the test plan `.md` file
  - Columns: AC, Description, Unit, Integration, E2E, Manual, Gap type, Risk
  - If the table uses the old format (Unit tests / Integration tests / NFR tests / Manual), adapt it gracefully - treat any `-` value as uncovered for that column
2. **Gap table** from the test plan
   - Columns: Gap, AC, Gap type, Reason, Handling
3. **Story title** from the story artefact

**Risk assignment logic (derive if not explicit in the table):**
- 🟢 green - AC has at least one automated test (Unit, Integration, or E2E)
- 🟡 yellow - Manual-only, gap type `render-only` or `external-service` or not specified
- 🔴 red - Manual-only, gap type `CSS-layout-dependent`; or any AC with no coverage at all

**Coverage rollup per story:**
- `ACs`: total count
- `Automated`: ACs with at least one Unit, Integration, or E2E test
- `Manual-only`: ACs with only Manual coverage (no automated test)
- `🔴 High risk gaps`: count of 🔴 ACs
- `🟡 Medium gaps`: count of 🟡 ACs
- `Status`: ✅ if no gaps; ⚠️ if any 🟡; 🔴 if any 🔴

---

## Output 1 — Terminal (ANSI coloured ASCII table)

**Node.js projects only** (i.e. `package.json` exists, or `context.yml` has `runtime.language: typescript` or `runtime.language: javascript`):

Add a script entry to the consuming repo's `package.json`:
```json
"coverage-map": "node .github/scripts/coverage-map.js"
```

Create `.github/scripts/coverage-map.js` with content to reproduce the terminal output.
The script reads `artefacts/[feature-slug]/test-plans/*.md` and
`.github/pipeline-state.json`, and prints:

**For non-Node.js projects**, skip the `package.json` entry and the `.js` script.
Produce Output 2 (markdown) and Output 3 (HTML) only — those are runtime-agnostic.

**Section A — Per-story, per-AC detail:**
```
 FEATURE: [feature-slug] ─────────────────────────────────────────────

 [Story: Story title]
 AC  Description                              Unit  Intg  E2E  Manual  Risk
 1   Card dropped stays at freeform pos       —     —     —    ✓       🔴 CSS-layout
 2   Drop sends move-card-freeform WS msg     ✓     ✓     —    —       🟢

 [Story: Next story title]
 ...

 ROLLUP ──────────────────────────────────────────────────────────────
 Story                              ACs  Automated  Manual-only  Risk
 Story title                        7    6          1            🔴
```

**Colour codes (ANSI):**
- 🟢 rows: green background (`\x1b[42m`)
- 🟡 rows: yellow background (`\x1b[43m`)
- 🔴 rows: red background (`\x1b[41m`)
- Manual-only, no gap-type rows: dim grey (`\x1b[2m`)

**Section B — Feature-level rollup (plain English, no test names or paths):**
```
 COVERAGE SUMMARY — [feature-slug]
 ──────────────────────────────────
 [n] of [total] ACs fully automated
 [n] ACs covered by manual verification only
 [n] ACs at high risk — CSS-layout-dependent with no E2E test

 Stories with red gaps: [names]
 Recommended action: run /coverage-map --html to generate shareable report
```

---

## Output 2 — Markdown artefact

Save to `artefacts/[feature-slug]/coverage/coverage-map.md`.

**View 1 — Per-AC table (collapsed by story using `<details>` tags):**

```markdown
## Coverage Map — [feature name]

**Generated:** [date]
**Stories:** [n] | **ACs:** [total] | **Automated:** [n] | **Manual-only:** [n] | **🔴 High risk:** [n]

---

### Feature rollup

| Story | ACs | Automated | Manual-only | 🔴 High risk gaps | 🟡 Medium | Status |
|-------|-----|-----------|-------------|------------------|-----------|--------|
| [story title] | 7 | 6 | 1 | 1 | 0 | ⚠️ |

---

<details>
<summary>Story: [story title] (6/7 automated ⚠️ 1 gap 🔴)</summary>

| AC | Description | Unit | Intg | E2E | Manual | Gap type | Risk |
|----|-------------|------|------|-----|--------|----------|------|
| 1  | [description] | — | — | — | ✓ | CSS-layout-dependent | 🔴 |
| 2  | [description] | ✓ | ✓ | — | — | — | 🟢 |

**Gaps:**
- AC1: CSS-layout-dependent — [reason]. Handling: [manual/E2E/risk-accept].

</details>
```

---

## Output 3 — HTML

**If `.github/pipeline-viz.html` (or equivalent pipeline visualisation HTML) exists
in the repo**, generate a standalone HTML file and note in its header:

```html
<!-- Coverage map for [feature-slug] — [date]
     This file is intended to be embedded in the pipeline visualization (pipeline-viz.html).
     To embed: paste the <section id="coverage-[feature-slug]"> block into the visualisation. -->
```

**Always generate:** `artefacts/[feature-slug]/coverage/coverage-map.html`

**HTML structure:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Coverage Map — [feature name]</title>
  <style>
    /* Inline only — no external dependencies, works offline */
    body { font-family: system-ui, sans-serif; max-width: 960px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.25rem; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
    th, td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; text-align: left; }
    th { background: #f4f4f4; }
    .green  { background: #d4edda; }
    .amber  { background: #fff3cd; }
    .red    { background: #f8d7da; }
    .manual { color: #666; }
    .rollup-table th { background: #e9ecef; }
    details summary { cursor: pointer; padding: 0.4rem; background: #f8f9fa;
                      border: 1px solid #dee2e6; border-radius: 4px; margin-bottom: 0.5rem; }
    .btn-toggle { margin: 1rem 0; padding: 0.4rem 0.8rem; cursor: pointer; }
    .tech-col { } /* shown by default, hidden in stakeholder view */
    body.stakeholder .tech-col { display: none; }
  </style>
</head>
<body>
  <h1>Coverage Map — [feature name]</h1>
  <p>Generated: [date] | Stories: [n] | ACs: [total] | Automated: [n] | 🔴 High risk: [n]</p>

  <button class="btn-toggle" onclick="document.body.classList.toggle('stakeholder')">
    Toggle technical detail
  </button>

  <!-- Feature rollup — always visible -->
  <h2>Feature rollup</h2>
  <table class="rollup-table">
    <thead>
      <tr>
        <th>Story</th><th>ACs</th><th>Automated</th>
        <th>Manual-only</th><th>🔴 High risk gaps</th><th>🟡 Medium</th><th>Status</th>
      </tr>
    </thead>
    <tbody>
      <!-- one row per story -->
      <tr class="[green|amber|red]">
        <td>[story title]</td><td>[n]</td><td>[n]</td><td>[n]</td><td>[n]</td><td>[n]</td>
        <td>[✅|⚠️|🔴]</td>
      </tr>
    </tbody>
  </table>

  <!-- Per-story detail -->
  <h2>Story detail</h2>
  <details>
    <summary>[story title] — [n]/[n] automated [status emoji] [n] gap(s)</summary>
    <table>
      <thead>
        <tr>
          <th>AC</th>
          <th>Description</th>
          <th class="tech-col">Unit</th>
          <th class="tech-col">Intg</th>
          <th class="tech-col">E2E</th>
          <th class="tech-col">Manual</th>
          <th>Gap type</th>
          <th>Risk</th>
        </tr>
      </thead>
      <tbody>
        <!-- 🔴 row example (CSS-layout-dependent) -->
        <tr class="red">
          <td>1</td>
          <td title="This check requires a real browser — it cannot be run automatically with Jest">
            [AC description] ⓘ
          </td>
          <td class="tech-col">—</td>
          <td class="tech-col">—</td>
          <td class="tech-col">—</td>
          <td class="tech-col">✓</td>
          <td>CSS-layout-dependent</td>
          <td>🔴</td>
        </tr>
      </tbody>
    </table>
  </details>
</body>
</html>
```

**Stakeholder view toggle** (`Toggle technical detail` button):
- Hides/shows columns: Unit, Intg, E2E, Manual (`tech-col` class)
- Leaves visible: Description, Gap type, Risk, and summary counts
- Both views available from the same page without reloading

**Every 🔴 row must include** `title="This check requires a real browser — it cannot be reliably tested in a DOM simulation environment"` on the description cell.

---

## When to run

- On demand
- Automatically suggested (not forced) by /workflow after /test-plan completes for the
  last story in a feature (when `coverageMapPath` is not yet set)
- Called as part of /trace chain health report
- Before /definition-of-ready if `hasLayoutDependentGaps: true` on any story

---

## What this skill does NOT do

- Does not run tests
- Does not read test results — reads test plans only
- Does not generate test plans — that is /test-plan
- Does not fix gaps — reports them for humans to action
- Does not configure the pipeline visualisation HTML page — integrates with it
  if it exists, generates standalone HTML if it does not
- Does not change the test plan — findings are read-only

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** on the feature object:

- Set `coverageMapPath: "artefacts/[feature-slug]/coverage/coverage-map.md"`
- Set `coverageRisk: "red"` if any story has any 🔴 AC; `"yellow"` if any 🟡 AC and no 🔴; `"green"` if all ACs are 🟢
- Set `updatedAt: [now]` on the feature record
