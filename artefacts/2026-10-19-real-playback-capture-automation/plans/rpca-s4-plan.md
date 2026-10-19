# Wire the real CLI into skills/feature-playback/SKILL.md's own documented steps — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. All 3 ACs are fully automatable — no manual scenario, no real secret or network dependency. Documentation-only change, no application code.
**Branch:** `feature/rpca-s4`
**Worktree:** `.worktrees/rpca-s4`
**Test command:** `node scripts/run-all-tests.js` (full suite); individual file: `node tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js`

---

## File map

```
Create:
  tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js  — real-file content assertions

Modify:
  skills/feature-playback/SKILL.md  — rewrite Step 2, Step 3, "What this skill does NOT do"
  artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/decisions.md  — append one new entry
```

---

## Task 1: Rewrite `skills/feature-playback/SKILL.md`'s Step 2-3 to describe the real orchestration

**Files:**
- Modify: `skills/feature-playback/SKILL.md`
- Create: `tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js` with this content:

```javascript
'use strict';
// check-rpca-s4-wire-cli-into-feature-playback-skill.js -- TDD tests for rpca-s4
// (2026-10-19-real-playback-capture-automation).
// Story: artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s4-wire-cli-into-feature-playback-skill.md
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

const skillMdPath = path.join(__dirname, '..', 'skills', 'feature-playback', 'SKILL.md');
const skillMd = fs.readFileSync(skillMdPath, 'utf8');

// AC1 (unit): SKILL.md's own Step 2/3 describe the real CLI accurately
(function () {
  try {
    assert.ok(skillMd.includes('authenticateStagingSession'), 'expected Step 2-3 to name the real auth function');
    assert.ok(skillMd.includes('buildCaptureList'), 'expected Step 2-3 to name the real AC/selector derivation function');
    assert.ok(!skillMd.includes('Record video -- a separate story (fpd-s2), not this skill\'s own capture step'), 'expected the stale "video is a separate story" line to be gone -- video capture is now real');
    pass('AC1 (unit): SKILL.md\'s own Step 2/3 describe the real CLI accurately');
  } catch (e) { fail('AC1 (unit): SKILL.md\'s own Step 2/3 describe the real CLI accurately', e); }
})();

// AC2 (unit): "What this skill does NOT do" is accurately scoped
(function () {
  try {
    const notDoSectionMatch = skillMd.match(/## What this skill does NOT do([\s\S]*?)(\n---|\n## )/);
    assert.ok(notDoSectionMatch, 'expected a "What this skill does NOT do" section to exist');
    const notDoSection = notDoSectionMatch[1];
    assert.ok(/production/i.test(notDoSection), 'expected the section to name production capture as still manual');
    assert.ok(/bulk|retrofit/i.test(notDoSection), 'expected the section to name bulk retrofitting as still manual');
    assert.ok(/video/i.test(notDoSection) && /embed/i.test(notDoSection), 'expected the section to name automatic video-embedding into the walkthrough as a known gap');
    pass('AC2 (unit): "What this skill does NOT do" is accurately scoped');
  } catch (e) { fail('AC2 (unit): "What this skill does NOT do" is accurately scoped', e); }
})();

console.log(`\n[rpca-s4-wire-cli-into-feature-playback-skill] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js
```

Expected output: AC1/AC2 both fail — the current `SKILL.md` names neither `authenticateStagingSession` nor `buildCaptureList`, and its "What this skill does NOT do" section still has the stale "Record video" line.

- [ ] **Step 3: Rewrite `skills/feature-playback/SKILL.md`**

Replace Step 2, Step 3, and "What this skill does NOT do" with the real orchestration recipe described in `decisions.md`'s own DESIGN entry (2026-10-19) and the DoR contract.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js
```

Expected output: `AC1`/`AC2` both pass.

- [ ] **Step 5: Commit**

```bash
git add skills/feature-playback/SKILL.md tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js
git commit -m "rpca-s4: rewrite feature-playback SKILL.md Step 2-3 to describe the real orchestration (AC1, AC2)"
```

---

## Task 2: Append the superseding `decisions.md` entry

**Files:**
- Modify: `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/decisions.md`
- Modify: `tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js`

- [ ] **Step 1: Write the failing test**

Insert into `tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js`, directly after the AC2 test and before the `console.log` summary line:

```javascript
// AC3 (unit): decisions.md closes the 5 original RISK-ACCEPT entries
(function () {
  const decisionsPath = path.join(__dirname, '..', 'artefacts', '2026-10-07-feature-playback-demo-with-video-and-or-screens-', 'decisions.md');
  const decisions = fs.readFileSync(decisionsPath, 'utf8');
  try {
    const slugs = ['fpd-s1', 'fpd-s2', 'fpd-s3', 'fpd-s4', 'fpd-s5'];
    for (const slug of slugs) {
      assert.ok(decisions.includes(slug), `expected the new superseding entry to name ${slug}`);
    }
    assert.ok(/supersed/i.test(decisions), 'expected the word "supersede" (or a variant) to appear');
    assert.ok(decisions.includes('rpca-s1') && decisions.includes('rpca-s3'), 'expected a reference to rpca-s1-rpca-s3\'s own real test evidence');
    // The 5 original RISK-ACCEPT headers must still be present, unedited.
    assert.ok(decisions.includes('fpd-s1 AC3'), 'expected the original fpd-s1 AC3 RISK-ACCEPT header to still be present');
    assert.ok(decisions.includes('fpd-s2 AC1'), 'expected the original fpd-s2 AC1 RISK-ACCEPT header to still be present');
    pass('AC3 (unit): decisions.md closes the 5 original RISK-ACCEPT entries');
  } catch (e) { fail('AC3 (unit): decisions.md closes the 5 original RISK-ACCEPT entries', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js
```

Expected output: AC3 fails — no superseding entry exists yet.

- [ ] **Step 3: Append the new entry to `decisions.md`**

Append (never edit the 5 original entries) a new `SUPERSEDE` entry naming all 5 story slugs, referencing `rpca-s1`-`rpca-s3`'s own real test evidence, scoped accurately per `decisions.md`'s own DESIGN entry (2026-10-19) in the `real-playback-capture-automation` feature.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js
```

Expected output:
```
  [PASS] AC1 (unit): SKILL.md's own Step 2/3 describe the real CLI accurately
  [PASS] AC2 (unit): "What this skill does NOT do" is accurately scoped
  [PASS] AC3 (unit): decisions.md closes the 5 original RISK-ACCEPT entries

[rpca-s4-wire-cli-into-feature-playback-skill] Results: 3 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/decisions.md tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js
git commit -m "rpca-s4: supersede the 5 original fpd-* RISK-ACCEPT entries (AC3)"
```

---

## Final step: full regression suite

```bash
node scripts/run-all-tests.js
```

Expected output: all files pass, 0 failed (baseline was 765 files / 0 failed at `/branch-setup`; this story adds 1 new test file).
