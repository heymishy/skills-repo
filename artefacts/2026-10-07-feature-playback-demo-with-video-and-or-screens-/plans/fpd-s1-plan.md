# Produce a structured, DoD-sourced walkthrough document with AC-mapped screenshots — Implementation Plan

> **For agent execution:** Single session — use /tdd task by task (no subagents dispatched this run).

**Goal:** Make every test in fpd-s1-test-plan.md pass. Build `scripts/playback-capture.js` (reads a DoD artefact's AC Coverage table + Metric Signal section, drives Playwright screenshot capture, writes `walkthrough.md`) and `skills/feature-playback/SKILL.md` (pure instruction file). Playwright's own `page` object is passed as a plain function argument — not a D37 adapter.
**Branch:** `feature/fpd-s1`
**Worktree:** `.worktrees/fpd-s1`
**Test command:** `node scripts/run-all-tests.js` (unit/integration); `npx playwright test tests/e2e/fpd-s1-walkthrough-capture.spec.js` (E2E, RISK-ACCEPT for execution per test plan)

---

## File map

```
Create:
  scripts/playback-capture.js                                  — DoD/benefit-metric parsing, walkthrough generation, screenshot capture, package status
  skills/feature-playback/SKILL.md                             — pure instruction file for running the package skill
  tests/check-fpd-s1-walkthrough-document-and-screenshots.js   — unit + integration tests (AC1–AC5)
  tests/e2e/fpd-s1-walkthrough-capture.spec.js                 — real-browser capture E2E (RISK-ACCEPT execution)

Modify:
  .github/scripts/check-skill-contracts.js                     — new CONTRACTS entry for `feature-playback`
```

---

## Task 1: DoD/benefit-metric parsing + AC gate check (AC5)

**Files:**
- Create: `scripts/playback-capture.js`
- Test: `tests/check-fpd-s1-walkthrough-document-and-screenshots.js`

- [ ] **Step 1: Write the failing test**

```js
// AC5 (unit): skill refuses to run against a non-DoD-validated feature
(function () {
  const { checkDodGate } = require('../scripts/playback-capture');
  const state = { features: [{ slug: 'not-ready-feature', dodStatus: 'in-progress' }] };
  try {
    checkDodGate(state, 'not-ready-feature');
    fail('AC5', new Error('expected checkDodGate to throw'));
  } catch (e) {
    assert.ok(/dodStatus/.test(e.message) && /in-progress/.test(e.message), 'error must name the unmet gate');
    pass('AC5 (unit): skill refuses to run against a non-DoD-validated feature');
  }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
```

Expected output: `Error: Cannot find module '../scripts/playback-capture'`

- [ ] **Step 3: Write minimal implementation**

```js
'use strict';
// scripts/playback-capture.js
// Reads a DoD-validated feature's own DoD artefact(s) and benefit-metric.md,
// generates artefacts/[feature-slug]/playback/walkthrough.md, and drives
// Playwright screenshot capture at each AC's stable UI state.
// Reuses Playwright as a plain function argument (ADR-018, ADR-026) — not a
// D37 adapter: `page` is ordinary dependency injection, not a hidden
// module-level default.

const fs = require('fs');
const path = require('path');

function checkDodGate(state, featureSlug) {
  const feature = (state.features || []).find(f => f.slug === featureSlug);
  if (!feature) {
    throw new Error(`Feature not found: ${featureSlug}`);
  }
  if (feature.dodStatus !== 'complete') {
    throw new Error(
      `Feature playback refused: dodStatus for "${featureSlug}" is "${feature.dodStatus}", not "complete". Run /definition-of-done first.`
    );
  }
  return { ok: true, feature };
}

module.exports = { checkDodGate };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
```

Expected output: `[PASS] AC5 (unit): skill refuses to run against a non-DoD-validated feature`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (baseline count + 1)

- [ ] **Step 6: Commit**

```bash
git add scripts/playback-capture.js tests/check-fpd-s1-walkthrough-document-and-screenshots.js
git commit -m "feat(fpd-s1): add DoD gate check for feature playback capture"
```

---

## Task 2: Parse DoD AC Coverage table + generate walkthrough sections (AC1)

**Files:**
- Modify: `scripts/playback-capture.js`
- Test: `tests/check-fpd-s1-walkthrough-document-and-screenshots.js`

- [ ] **Step 1: Write the failing test**

```js
// AC1 (unit): walkthrough doc has one section per AC, sourced from the DoD table verbatim
(function () {
  const { parseDodAcCoverage, generateWalkthroughMarkdown } = require('../scripts/playback-capture');
  const fixtureDod = [
    '## AC Coverage',
    '',
    '| AC | Satisfied? | Evidence | Verification method | Deviation |',
    '|----|-----------|----------|---------------------|-----------|',
    '| AC1 — Widget renders on load | ✅ | widget-renders-on-load test passes | Automated test | None |',
    '| AC2 — Widget updates on click | ✅ | widget-updates-on-click test passes | Automated test | None |',
    '| AC3 — Widget persists state | ✅ | widget-persists-state test passes | Automated test | None |',
  ].join('\n');
  const rows = parseDodAcCoverage(fixtureDod);
  assert.strictEqual(rows.length, 3, 'expected 3 AC rows parsed');
  const doc = generateWalkthroughMarkdown({ featureSlug: 'f1', storyDods: [{ storySlug: 's1', content: fixtureDod }], benefitMetricContent: '' });
  const sections = doc.split(/^## /m).filter(s => /^AC\d/.test(s));
  assert.strictEqual(sections.length, 3, 'expected 3 AC sections in generated doc');
  assert.ok(doc.includes('widget-renders-on-load test passes'), 'narrative must be sourced verbatim from the DoD row, not re-authored');
  pass('AC1 (unit): walkthrough doc has one section per AC, sourced from the DoD table verbatim');
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
```

Expected output: `TypeError: parseDodAcCoverage is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
function parseMarkdownTable(markdown, headingText) {
  const lines = markdown.split('\n');
  const headingIdx = lines.findIndex(l => l.trim() === `## ${headingText}`);
  if (headingIdx === -1) return [];
  let i = headingIdx + 1;
  while (i < lines.length && !lines[i].trim().startsWith('|')) i++;
  if (i >= lines.length) return [];
  const headerCells = lines[i].split('|').map(c => c.trim()).filter(Boolean);
  i += 2; // skip header + separator row
  const rows = [];
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    const cells = lines[i].split('|').map(c => c.trim()).filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));
    const row = {};
    headerCells.forEach((h, idx) => { row[h] = cells[idx] || ''; });
    rows.push(row);
    i++;
  }
  return rows;
}

function parseDodAcCoverage(dodMarkdown) {
  return parseMarkdownTable(dodMarkdown, 'AC Coverage').map(row => {
    const acCell = row['AC'] || '';
    const match = acCell.match(/^(AC\d+)\s*—\s*(.*)$/);
    return {
      acId: match ? match[1] : acCell,
      description: match ? match[2] : acCell,
      satisfied: row['Satisfied?'] || '',
      evidence: row['Evidence'] || '',
      verificationMethod: row['Verification method'] || '',
      deviation: row['Deviation'] || '',
    };
  });
}

function parseDodMetricSignal(dodMarkdown) {
  return parseMarkdownTable(dodMarkdown, 'Metric Signal').map(row => ({
    metric: row['Metric'] || '',
    signal: row['Signal'] || '',
    evidence: row['Evidence'] || '',
    dateMeasured: row['Date measured'] || '',
  }));
}

function generateWalkthroughMarkdown({ featureSlug, storyDods, benefitMetricContent }) {
  const lines = [`# Playback Walkthrough: ${featureSlug}`, ''];
  for (const story of storyDods) {
    const acRows = parseDodAcCoverage(story.content);
    for (const ac of acRows) {
      lines.push(`## ${ac.acId} — ${ac.description}`, '');
      lines.push(ac.evidence, '');
    }
  }
  lines.push('## Metric Signal', '');
  for (const story of storyDods) {
    const metricRows = parseDodMetricSignal(story.content);
    for (const m of metricRows) {
      lines.push(`- **${m.metric}**: ${m.signal} — ${m.evidence} (measured ${m.dateMeasured})`);
    }
  }
  return lines.join('\n');
}

module.exports = { checkDodGate, parseDodAcCoverage, parseDodMetricSignal, generateWalkthroughMarkdown };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
```

Expected output: `[PASS] AC1 (unit): walkthrough doc has one section per AC, sourced from the DoD table verbatim`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add scripts/playback-capture.js tests/check-fpd-s1-walkthrough-document-and-screenshots.js
git commit -m "feat(fpd-s1): generate walkthrough sections from DoD AC Coverage table"
```

---

## Task 3: Metric Signal section sourced from benefit-metric.md targets (AC2)

**Files:**
- Modify: `scripts/playback-capture.js`
- Test: `tests/check-fpd-s1-walkthrough-document-and-screenshots.js`

- [ ] **Step 1: Write the failing test**

```js
// AC2 (unit): Metric Signal section includes benefit-metric.md targets alongside DoD signal/evidence
(function () {
  const { generateWalkthroughMarkdown } = require('../scripts/playback-capture');
  const fixtureDod = [
    '## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    '| AC1 — thing works | ✅ | test passes | Automated test | None |',
    '', '## Metric Signal', '', '| Metric | Signal | Evidence | Date measured |', '|----|----|----|----|',
    '| M1 — Widget load time | on-track | p95 420ms | 2026-10-15 |',
  ].join('\n');
  const fixtureBenefitMetric = [
    '### Metric 1: Widget load time', '', '| Field | Value |', '|----|----|', '| **Target** | ≤500ms p95 |',
  ].join('\n');
  const doc = generateWalkthroughMarkdown({ featureSlug: 'f1', storyDods: [{ storySlug: 's1', content: fixtureDod }], benefitMetricContent: fixtureBenefitMetric });
  assert.ok(doc.includes('≤500ms p95'), 'expected benefit-metric target in the Metric Signal section');
  assert.ok(doc.includes('on-track') && doc.includes('p95 420ms'), 'expected DoD signal/evidence in the Metric Signal section');
  pass('AC2 (unit): Metric Signal section includes benefit-metric.md targets alongside DoD signal/evidence');
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
```

Expected output: `AssertionError: expected benefit-metric target in the Metric Signal section`

- [ ] **Step 3: Write minimal implementation**

```js
function parseBenefitMetricTargets(benefitMetricContent) {
  const targets = {};
  const blocks = benefitMetricContent.split(/^### /m).slice(1);
  for (const block of blocks) {
    const nameLine = block.split('\n')[0].trim();
    const name = nameLine.replace(/^Metric \d+:\s*/, '');
    const targetMatch = block.match(/\|\s*\*\*Target\*\*\s*\|\s*(.+?)\s*\|/);
    if (targetMatch) targets[name] = targetMatch[1].trim();
  }
  return targets;
}

// Replace the Metric Signal block in generateWalkthroughMarkdown with:
  lines.push('## Metric Signal', '');
  const targets = parseBenefitMetricTargets(benefitMetricContent);
  for (const story of storyDods) {
    const metricRows = parseDodMetricSignal(story.content);
    for (const m of metricRows) {
      const metricName = m.metric.replace(/^M\d+\s*—\s*/, '');
      const target = targets[metricName] ? ` | Target: ${targets[metricName]}` : '';
      lines.push(`- **${m.metric}**: ${m.signal} — ${m.evidence} (measured ${m.dateMeasured})${target}`);
    }
  }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
```

Expected output: `[PASS] AC2 (unit): Metric Signal section includes benefit-metric.md targets alongside DoD signal/evidence`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add scripts/playback-capture.js tests/check-fpd-s1-walkthrough-document-and-screenshots.js
git commit -m "feat(fpd-s1): include benefit-metric targets in Metric Signal section"
```

---

## Task 4: Screenshot capture logic + embedding (AC3, script-logic portion)

**Files:**
- Modify: `scripts/playback-capture.js`
- Test: `tests/check-fpd-s1-walkthrough-document-and-screenshots.js`

- [ ] **Step 1: Write the failing test**

```js
// AC3 (unit): capture script's own logic — correct selector, correct path, correct AC mapping
(function () {
  const { captureAcScreenshots, embedScreenshotPaths } = require('../scripts/playback-capture');
  const calls = [];
  const fakePage = { screenshot: async (opts) => { calls.push(opts); } };
  const acList = [
    { acId: 'AC1', url: '/widget', selector: '#widget-loaded' },
    { acId: 'AC2', url: '/widget', selector: '#widget-updated' },
  ];
  (async () => {
    const shots = await captureAcScreenshots({ page: fakePage, featureSlug: 'f1', acList });
    assert.strictEqual(calls.length, 2, 'expected page.screenshot() called once per AC');
    assert.strictEqual(shots[0].path, 'artefacts/f1/playback/screenshots/AC1.png');
    assert.strictEqual(shots[1].path, 'artefacts/f1/playback/screenshots/AC2.png');
    const doc = embedScreenshotPaths('## AC1 — x\n\ntext\n\n## AC2 — y\n\ntext\n', shots);
    assert.ok(doc.includes('![AC1](screenshots/AC1.png)'), 'expected screenshot embedded in AC1 section');
    assert.ok(doc.includes('![AC2](screenshots/AC2.png)'), 'expected screenshot embedded in AC2 section');
    pass("AC3 (unit): capture script's own logic — correct selector, correct path, correct AC mapping");
  })().catch(e => fail("AC3 (unit): capture script's own logic", e));
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
```

Expected output: `TypeError: captureAcScreenshots is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
async function captureAcScreenshots({ page, featureSlug, acList }) {
  const shots = [];
  for (const ac of acList) {
    const relPath = `artefacts/${featureSlug}/playback/screenshots/${ac.acId}.png`;
    await page.screenshot({ path: relPath, selector: ac.selector });
    shots.push({ acId: ac.acId, path: relPath });
  }
  return shots;
}

function embedScreenshotPaths(markdown, shots) {
  let doc = markdown;
  for (const shot of shots) {
    const fileName = path.basename(shot.path);
    const sectionRe = new RegExp(`(## ${shot.acId}[^\\n]*\\n)`);
    doc = doc.replace(sectionRe, `$1\n![${shot.acId}](screenshots/${fileName})\n`);
  }
  return doc;
}

module.exports = {
  checkDodGate, parseDodAcCoverage, parseDodMetricSignal, parseBenefitMetricTargets,
  generateWalkthroughMarkdown, captureAcScreenshots, embedScreenshotPaths,
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
```

Expected output: `[PASS] AC3 (unit): capture script's own logic — correct selector, correct path, correct AC mapping`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add scripts/playback-capture.js tests/check-fpd-s1-walkthrough-document-and-screenshots.js
git commit -m "feat(fpd-s1): capture one screenshot per AC and embed into walkthrough doc"
```

---

## Task 5: Package status — pending-review until editorial confirmation (AC4)

**Files:**
- Modify: `scripts/playback-capture.js`
- Test: `tests/check-fpd-s1-walkthrough-document-and-screenshots.js`

- [ ] **Step 1: Write the failing test**

```js
// AC4 (unit): package not complete until editorial review confirmed
(function () {
  const { getPackageStatus, markPackageReviewed } = require('../scripts/playback-capture');
  const store = {};
  const readFile = (p) => store[p];
  const writeFile = (p, content) => { store[p] = content; };
  const statusPath = 'artefacts/f1/playback/package-status.json';
  writeFile(statusPath, JSON.stringify({ status: 'pending-review' }));
  assert.strictEqual(getPackageStatus(statusPath, readFile).status, 'pending-review', 'expected pending-review before confirmation');
  markPackageReviewed(statusPath, readFile, writeFile);
  assert.strictEqual(getPackageStatus(statusPath, readFile).status, 'complete', 'expected complete after confirmation');
  pass('AC4 (unit): package not complete until editorial review confirmed');
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
```

Expected output: `TypeError: getPackageStatus is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
function getPackageStatus(statusPath, readFileFn) {
  const read = readFileFn || ((p) => fs.readFileSync(p, 'utf8'));
  return JSON.parse(read(statusPath));
}

function markPackageReviewed(statusPath, readFileFn, writeFileFn) {
  const read = readFileFn || ((p) => fs.readFileSync(p, 'utf8'));
  const write = writeFileFn || ((p, c) => fs.writeFileSync(p, c, 'utf8'));
  const current = JSON.parse(read(statusPath));
  current.status = 'complete';
  current.reviewedAt = new Date().toISOString();
  write(statusPath, JSON.stringify(current, null, 2));
}

module.exports = {
  checkDodGate, parseDodAcCoverage, parseDodMetricSignal, parseBenefitMetricTargets,
  generateWalkthroughMarkdown, captureAcScreenshots, embedScreenshotPaths,
  getPackageStatus, markPackageReviewed,
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
```

Expected output: `[PASS] AC4 (unit): package not complete until editorial review confirmed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add scripts/playback-capture.js tests/check-fpd-s1-walkthrough-document-and-screenshots.js
git commit -m "feat(fpd-s1): gate package completion on explicit editorial review"
```

---

## Task 6: Integration test — multi-story DoD, no cross-story mixing (AC1 integration)

**Files:**
- Test: `tests/check-fpd-s1-walkthrough-document-and-screenshots.js`

- [ ] **Step 1: Write the failing test**

```js
// AC1 (integration): full document generation against a realistic multi-story DoD
(function () {
  const { generateWalkthroughMarkdown } = require('../scripts/playback-capture');
  const dodA = ['## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    '| AC1 — story A thing | ✅ | storyA evidence | Automated test | None |'].join('\n');
  const dodB = ['## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    '| AC1 — story B thing | ✅ | storyB evidence | Automated test | None |'].join('\n');
  const doc = generateWalkthroughMarkdown({
    featureSlug: 'f1',
    storyDods: [{ storySlug: 'sA', content: dodA }, { storySlug: 'sB', content: dodB }],
    benefitMetricContent: '',
  });
  assert.ok(doc.includes('storyA evidence') && doc.includes('storyB evidence'), 'expected both stories represented');
  const firstIdx = doc.indexOf('storyA evidence');
  const secondIdx = doc.indexOf('storyB evidence');
  assert.ok(firstIdx !== -1 && secondIdx !== -1 && firstIdx < secondIdx, 'expected no cross-story mixing or omission');
  pass('AC1 (integration): full document generation against a realistic multi-story DoD');
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
```

Expected output: passes trivially given Task 2's implementation already loops `storyDods` in order — if it fails, the loop order is wrong; fix before proceeding.

- [ ] **Step 3: Write minimal implementation**

No new implementation expected — Task 2's `generateWalkthroughMarkdown` already iterates `storyDods` in array order. If this test fails, the bug is in that loop (e.g. shared mutable state between iterations) — fix there, do not add a parallel code path.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
```

Expected output: `[PASS] AC1 (integration): full document generation against a realistic multi-story DoD`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add tests/check-fpd-s1-walkthrough-document-and-screenshots.js
git commit -m "test(fpd-s1): verify multi-story DoD walkthrough generation has no cross-story mixing"
```

---

## Task 7: `skills/feature-playback/SKILL.md` + `check-skill-contracts.js` entry (structural, AC5 entry condition)

**Files:**
- Create: `skills/feature-playback/SKILL.md`
- Modify: `.github/scripts/check-skill-contracts.js`

- [ ] **Step 1: Write the failing check**

```bash
node .github/scripts/check-skill-contracts.js
```

Expected output before this task: contract for `feature-playback` not yet registered — no failure yet, since the entry doesn't exist. This task adds both the file and its contract entry together (AC5 of the structural "no intermediate invalid state" pattern established by shr.1).

- [ ] **Step 2: Write the skill file**

```markdown
---
name: feature-playback
description: >
  Generates a sponsor-presentable playback package (walkthrough document +
  AC-mapped screenshots) scripted from a DoD-validated feature's own DoD
  artefact. Refuses to run against a feature that is not DoD-validated.
  Use after a feature reaches /definition-of-done and needs a reviewable
  package for sponsor acceptance. Run when someone says "make a playback
  package", "generate a demo walkthrough", or "package this feature for
  review".
triggers:
  - "make a playback package"
  - "generate a demo walkthrough"
  - "package this feature for review"
  - "feature playback"
---

# Feature Playback Package Skill

## Entry condition

The target feature must have `dodStatus: "complete"` in `.github/pipeline-state.json`.

If not:

> ❌ **Feature playback refused: dodStatus is not "complete".**
> Run /definition-of-done first.

---

## Step 1 — Identify the feature

Read `.github/pipeline-state.json`. Confirm the target feature's `dodStatus` is `"complete"` via `checkDodGate` in `scripts/playback-capture.js`. If it throws, surface the exact error message (it names the unmet gate) and stop.

---

## Step 2 — Generate the walkthrough document

Run `scripts/playback-capture.js [feature-slug]`. This reads every story's DoD artefact under `artefacts/[feature-slug]/dod/`, parses each one's own AC Coverage table and Metric Signal section, and the feature's own `benefit-metric.md`, then writes `artefacts/[feature-slug]/playback/walkthrough.md` with one section per AC, sourced verbatim from the DoD table rows — never re-authored or sourced from raw E2E test file content.

---

## Step 3 — Capture screenshots

The same script drives Playwright against the feature's own stable UI state for each AC (the same interaction script used for that AC's own DoD evidence), saving one screenshot per AC to `artefacts/[feature-slug]/playback/screenshots/` and embedding each into its own AC section in `walkthrough.md`.

---

## Step 4 — Editorial review (mandatory — does not bypass)

The package status starts at `"pending-review"` in `artefacts/[feature-slug]/playback/package-status.json`. Ask the engineer:

> Review each captured screenshot in `artefacts/[feature-slug]/playback/screenshots/`. Confirm each one shows the intended, stable UI state for its AC.
>
> Reply: confirmed — or describe what needs recapturing

Only after explicit confirmation, call `markPackageReviewed` to set status to `"complete"`. Automated capture never sets this status itself.

---

## What this skill does NOT do

- Record video — that is `/feature-playback` extended by `fpd-s2`, not this step
- Build or update the web-app viewer — that is `fpd-s3`/`fpd-s4`
- Run against a feature that is not DoD-validated — this is not a general-purpose demo tool

---

## Integration

**Reads:** `.github/pipeline-state.json`, `artefacts/[feature-slug]/dod/*.md`, `artefacts/[feature-slug]/benefit-metric.md`
**Produces:** `artefacts/[feature-slug]/playback/walkthrough.md`, `artefacts/[feature-slug]/playback/screenshots/`, `artefacts/[feature-slug]/playback/package-status.json`
**Follows:** /definition-of-done
**Precedes:** (within this epic) video walkthrough, web-app viewer

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** once the package reaches `"complete"` status:

- Set the feature's `playbackPackage.status` ← `"complete"`
- Set the feature's `playbackPackage.path` ← `artefacts/[feature-slug]/playback/`
- Set `updatedAt` on the feature ← now
```

- [ ] **Step 3: Add the CONTRACTS entry**

```js
// Append to .github/scripts/check-skill-contracts.js CONTRACTS array
{
  skill: 'feature-playback',
  file:  'skills/feature-playback/SKILL.md',
  required: [
    'dodStatus: "complete"',
    'checkDodGate',
    'pending-review',
    'markPackageReviewed',
    'not a general-purpose demo tool',
  ],
},
```

- [ ] **Step 4: Run check — must pass**

```bash
node .github/scripts/check-skill-contracts.js
```

Expected output: `[skill-contracts] N skill(s), M contract(s) OK ✓` (N = previous count + 1)

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add skills/feature-playback/SKILL.md .github/scripts/check-skill-contracts.js
git commit -m "feat(fpd-s1): add feature-playback skill file and its structural contract"
```

---

## Task 8: E2E spec — real capture against a running app (AC3, RISK-ACCEPT for execution)

**Files:**
- Create: `tests/e2e/fpd-s1-walkthrough-capture.spec.js`

- [ ] **Step 1: Write the spec** (not executable in this sandbox — no reachable Postgres, `decisions.md` D5; confirmed syntactically valid only, per test plan's own RISK-ACCEPT)

```js
'use strict';
// fpd-s1-walkthrough-capture.spec.js — E2E for Feature Playback Package capture (fpd-s1)
// Real end-to-end: a real DoD-validated feature, real capture, real file on disk.
// RISK-ACCEPTed for execution in this sandbox — no reachable Postgres
// (decisions.md D5), same gap as jcx-s6/jae-s5/cnsf-s1 this cycle.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { withAuth } = require('./fixtures/auth');

withAuth('real capture produces a walkthrough.md with embedded screenshots on disk', async ({ page }) => {
  const { checkDodGate, captureAcScreenshots, embedScreenshotPaths } = require('../../scripts/playback-capture');
  const state = JSON.parse(fs.readFileSync('.github/pipeline-state.json', 'utf8'));
  const featureSlug = '2026-10-07-feature-playback-demo-with-video-and-or-screens-';
  checkDodGate(state, featureSlug); // throws if this feature is not yet DoD-complete — expected to pass once fpd-* reach DoD
  const shots = await captureAcScreenshots({
    page,
    featureSlug,
    acList: [{ acId: 'AC1', url: '/', selector: 'body' }],
  });
  expect(fs.existsSync(shots[0].path)).toBe(true);
});
```

- [ ] **Step 2: Confirm syntactic validity (cannot execute — RISK-ACCEPT)**

```bash
node --check tests/e2e/fpd-s1-walkthrough-capture.spec.js
```

Expected output: no output, exit 0 (syntax valid)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/fpd-s1-walkthrough-capture.spec.js
git commit -m "test(fpd-s1): add E2E capture spec (RISK-ACCEPT for execution, decisions.md D5)"
```
