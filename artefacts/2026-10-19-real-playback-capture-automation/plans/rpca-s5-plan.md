# Playback capture triggers automatically when a feature reaches Definition of Done — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. All 5 ACs are fully automatable — no manual scenario, no real secret or network dependency.
**Branch:** `feature/rpca-s5`
**Worktree:** `.worktrees/rpca-s5`
**Test command:** `node scripts/run-all-tests.js` (full suite); individual file: `node tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js`

---

## File map

```
Create:
  tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js  — unit tests

Modify:
  scripts/playback-capture.js            — fix checkDodGate (AC1, AC2)
  skills/definition-of-done/SKILL.md     — extend Feature-completion trace check (AC3, AC4)
```

---

## Task 1: `checkDodGate` reads every story's own evidence field, not the unwritten feature field

**Files:**
- Modify: `scripts/playback-capture.js`
- Create: `tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js` with this content:

```javascript
'use strict';
// check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js -- TDD tests for rpca-s5
// (2026-10-19-real-playback-capture-automation).
// Story: artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s5-automatic-capture-trigger-at-definition-of-done.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

// AC1 (unit): checkDodGate returns ok when every story is complete, regardless of feature.dodStatus
(function () {
  const { checkDodGate } = require('../scripts/playback-capture');
  try {
    const state = { features: [{
      slug: 'fixture-feature',
      epics: [{ slug: 'fixture-epic', stories: [
        { slug: 'fixture-s1', dodStatus: 'complete' },
        { slug: 'fixture-s2', dodStatus: 'complete' },
      ] }],
    }] };
    const result = checkDodGate(state, 'fixture-feature');
    assert.strictEqual(result.ok, true, 'expected ok:true when every story is complete');
    pass('AC1 (unit): checkDodGate returns ok when every story is complete, regardless of feature.dodStatus');
  } catch (e) { fail('AC1 (unit): checkDodGate returns ok when every story is complete, regardless of feature.dodStatus', e); }
})();

// AC1 (unit): checkDodGate returns ok even when a stale feature.dodStatus field disagrees
(function () {
  const { checkDodGate } = require('../scripts/playback-capture');
  try {
    const state = { features: [{
      slug: 'fixture-feature',
      dodStatus: 'in-progress',
      epics: [{ slug: 'fixture-epic', stories: [
        { slug: 'fixture-s1', dodStatus: 'complete' },
        { slug: 'fixture-s2', dodStatus: 'complete' },
      ] }],
    }] };
    const result = checkDodGate(state, 'fixture-feature');
    assert.strictEqual(result.ok, true, 'expected ok:true -- the stale feature.dodStatus field must be ignored');
    pass('AC1 (unit): checkDodGate returns ok even when a stale feature.dodStatus field disagrees');
  } catch (e) { fail('AC1 (unit): checkDodGate returns ok even when a stale feature.dodStatus field disagrees', e); }
})();

// AC2 (unit): checkDodGate throws naming the specific incomplete story
(function () {
  const { checkDodGate } = require('../scripts/playback-capture');
  try {
    const state = { features: [{
      slug: 'fixture-feature',
      epics: [{ slug: 'fixture-epic', stories: [
        { slug: 'fixture-s1', dodStatus: 'complete' },
        { slug: 'fixture-s2', dodStatus: 'in-progress' },
      ] }],
    }] };
    let threw = null;
    try { checkDodGate(state, 'fixture-feature'); } catch (e) { threw = e; }
    assert.ok(threw, 'expected checkDodGate to throw');
    assert.ok(threw.message.includes('fixture-s2'), 'expected the error to name the specific incomplete story');
    pass('AC2 (unit): checkDodGate throws naming the specific incomplete story');
  } catch (e) { fail('AC2 (unit): checkDodGate throws naming the specific incomplete story', e); }
})();

console.log(`\n[rpca-s5-automatic-capture-trigger-at-definition-of-done] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js
```

Expected output: the "stale feature.dodStatus field" and "names the specific incomplete story" assertions fail against the current implementation (which checks `feature.dodStatus` directly and throws a generic message).

- [ ] **Step 3: Write minimal implementation**

In `scripts/playback-capture.js`, replace the existing `checkDodGate` function:

```javascript
// rpca-s5: evaluates every story's own dodStatus evidence field directly
// (ADR-002 -- gates must use evidence fields, not a stage/field proxy), instead
// of the unwritten top-level feature.dodStatus field. Walks both flat
// feature.stories[] and epic-nested feature.epics[].stories[] shapes. Throws
// naming the specific incomplete story, not a generic message.
function checkDodGate(state, featureSlug) {
  const feature = (state.features || []).find(f => f.slug === featureSlug);
  if (!feature) {
    throw new Error(`Feature not found: ${featureSlug}`);
  }
  const allStories = [];
  if (Array.isArray(feature.stories)) allStories.push(...feature.stories);
  if (Array.isArray(feature.epics)) {
    for (const epic of feature.epics) {
      if (Array.isArray(epic.stories)) allStories.push(...epic.stories);
    }
  }
  const incomplete = allStories.find(s => s.dodStatus !== 'complete');
  if (incomplete) {
    throw new Error(
      `Feature playback refused: story "${incomplete.slug}" in "${featureSlug}" has dodStatus "${incomplete.dodStatus}", not "complete". Run /definition-of-done first.`
    );
  }
  return { ok: true, feature };
}
```

No change to `module.exports` — `checkDodGate` is already exported.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js
```

Expected output:
```
  [PASS] AC1 (unit): checkDodGate returns ok when every story is complete, regardless of feature.dodStatus
  [PASS] AC1 (unit): checkDodGate returns ok even when a stale feature.dodStatus field disagrees
  [PASS] AC2 (unit): checkDodGate throws naming the specific incomplete story

[rpca-s5-automatic-capture-trigger-at-definition-of-done] Results: 3 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add scripts/playback-capture.js tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js
git commit -m "rpca-s5: checkDodGate reads every story's own dodStatus evidence field (AC1, AC2)"
```

---

## Task 2: `/definition-of-done`'s own Feature-completion trace check auto-triggers `/feature-playback`

**Files:**
- Modify: `skills/definition-of-done/SKILL.md`
- Modify: `tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js`

- [ ] **Step 1: Write the failing test**

Insert into `tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js`, directly after the AC2 test and before the `console.log` summary line:

```javascript
const fs = require('fs');
const path = require('path');
const dodSkillMd = fs.readFileSync(path.join(__dirname, '..', 'skills', 'definition-of-done', 'SKILL.md'), 'utf8');

// AC3 (unit): the Feature-completion trace check now auto-triggers /feature-playback
(function () {
  try {
    assert.ok(/feature-playback/i.test(dodSkillMd), 'expected the Feature-completion trace check to reference /feature-playback');
    assert.ok(/Steps? 1.?3|Step 1.*Step 3|generate.*walkthrough.*capture/i.test(dodSkillMd), 'expected it to describe running Steps 1-3 (generate walkthrough, capture screenshots)');
    assert.ok(/Step 4.*(mandatory|human|unchanged)|editorial review.*(mandatory|human|unchanged)/i.test(dodSkillMd), 'expected it to explicitly preserve Step 4\'s own mandatory human editorial-review gate');
    pass('AC3 (unit): the Feature-completion trace check now auto-triggers /feature-playback');
  } catch (e) { fail('AC3 (unit): the Feature-completion trace check now auto-triggers /feature-playback', e); }
})();

// AC4 (unit): a capture failure does not downgrade the DoD verdict, and records a follow-up action
(function () {
  try {
    assert.ok(/pendingActions/.test(dodSkillMd), 'expected the capture-failure path to mention pendingActions');
    assert.ok(/not.*(affect|downgrade|change).*verdict|verdict.*(unaffected|already determined)/i.test(dodSkillMd), 'expected explicit language that a capture failure does not affect the DoD verdict');
    pass('AC4 (unit): a capture failure does not downgrade the DoD verdict, and records a follow-up action');
  } catch (e) { fail('AC4 (unit): a capture failure does not downgrade the DoD verdict, and records a follow-up action', e); }
})();

// AC5 (unit): the existing manual /feature-playback invocation path is unchanged
(function () {
  try {
    const playbackSkillMd = fs.readFileSync(path.join(__dirname, '..', 'skills', 'feature-playback', 'SKILL.md'), 'utf8');
    assert.ok(playbackSkillMd.includes('"make a playback package"'), 'expected the original manual trigger phrase to still be present');
    assert.ok(playbackSkillMd.includes('"feature playback"'), 'expected the original trigger list to still include "feature playback"');
    pass('AC5 (unit): the existing manual /feature-playback invocation path is unchanged');
  } catch (e) { fail('AC5 (unit): the existing manual /feature-playback invocation path is unchanged', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js
```

Expected output: AC3/AC4 fail (current `SKILL.md` text has no `/feature-playback` reference at all); AC5 passes immediately (nothing has touched `feature-playback/SKILL.md` yet in this story).

- [ ] **Step 3: Extend `skills/definition-of-done/SKILL.md`'s own "Feature-completion trace check" section**

Insert the automatic-trigger and non-blocking-failure language directly after the existing "does every story... now show `dodStatus: "complete"`?" check, before the existing `/trace` check.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js
```

Expected output:
```
  [PASS] AC1 (unit): checkDodGate returns ok when every story is complete, regardless of feature.dodStatus
  [PASS] AC1 (unit): checkDodGate returns ok even when a stale feature.dodStatus field disagrees
  [PASS] AC2 (unit): checkDodGate throws naming the specific incomplete story
  [PASS] AC3 (unit): the Feature-completion trace check now auto-triggers /feature-playback
  [PASS] AC4 (unit): a capture failure does not downgrade the DoD verdict, and records a follow-up action
  [PASS] AC5 (unit): the existing manual /feature-playback invocation path is unchanged

[rpca-s5-automatic-capture-trigger-at-definition-of-done] Results: 6 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add skills/definition-of-done/SKILL.md tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js
git commit -m "rpca-s5: auto-trigger /feature-playback at feature-completion, non-blocking on failure (AC3, AC4, AC5)"
```

---

## Final step: full regression suite

```bash
node scripts/run-all-tests.js
```

Expected output: all files pass, 0 failed (baseline was 766 files / 0 failed at `/branch-setup`; this story adds 1 new test file).
