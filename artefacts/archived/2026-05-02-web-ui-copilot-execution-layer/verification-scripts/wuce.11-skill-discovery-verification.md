# Verification Script: wuce.11 — SKILL.md discovery and skill routing

## Pre-conditions

- Jest installed; `tests/check-wuce11-skill-discovery.js` exists
- Write access to `os.tmpdir()` (required for temp skills dir tests)

## Step 1 — Run Jest tests

```bash
npx jest tests/check-wuce11-skill-discovery.js --verbose
```

**Expected output:** 18 tests pass, 0 fail.

## Step 2 — Verify discovery against real repo skills directory

```bash
node -e "
const { listAvailableSkills } = require('./src/execution/skill-discovery');
listAvailableSkills(process.cwd()).then(skills => {
  console.log('Discovered', skills.length, 'skills');
  skills.forEach(s => console.log(' -', s.name, '|', s.path));
  const hasDiscovery = skills.some(s => s.name === 'discovery');
  console.log('Contains discovery skill:', hasDiscovery, '(expected: true)');
  const allValid = skills.every(s => /^[a-z0-9-]+$/.test(s.name));
  console.log('All names match [a-z0-9-]:', allValid, '(expected: true)');
}).catch(console.error);
"
```

**Expected:** A list of skill names matching the contents of `.github/skills/`; all names match the `[a-z0-9-]` pattern.

## Step 3 — Verify `COPILOT_SKILLS_DIRS` env var override works

```bash
node -e "
const os = require('os'); const fs = require('fs'); const path = require('path');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wuce11-verify-'));
fs.mkdirSync(path.join(tmpDir, 'custom-skill')); 
fs.writeFileSync(path.join(tmpDir, 'custom-skill', 'SKILL.md'), '# Custom Skill');
process.env.COPILOT_SKILLS_DIRS = tmpDir;
const { listAvailableSkills } = require('./src/execution/skill-discovery');
listAvailableSkills(process.cwd()).then(skills => {
  console.log('Custom skills found:', skills.map(s=>s.name));
  const found = skills.some(s => s.name === 'custom-skill');
  console.log('custom-skill found:', found, '(expected: true)');
  const noDefault = !skills.some(s => s.name === 'discovery');
  console.log('default discovery NOT found:', noDefault, '(expected: true)');
  delete process.env.COPILOT_SKILLS_DIRS;
  fs.rmSync(tmpDir, { recursive: true });
}).catch(console.error);
"
```

**Expected:**
```
Custom skills found: [ 'custom-skill' ]
custom-skill found: true (expected: true)
default discovery NOT found: true (expected: true)
```

## Step 4 — Verify empty/missing skills dir returns [] not crash

```bash
node -e "
process.env.COPILOT_SKILLS_DIRS = '/nonexistent/path/skills';
const { listAvailableSkills } = require('./src/execution/skill-discovery');
listAvailableSkills(process.cwd()).then(skills => {
  console.log('Result for missing dir:', JSON.stringify(skills), '(expected: [])');
  delete process.env.COPILOT_SKILLS_DIRS;
}).catch(err => console.error('FAIL: threw an error -', err.message));
"
```

**Expected:** `Result for missing dir: [] (expected: [])`

## Step 5 — Allowlist validation smoke test

```bash
node -e "
const { validateSkillName } = require('./src/execution/skill-discovery');
const list = [{ name: 'discovery', path: '.github/skills/discovery/SKILL.md' }];
console.log('discovery valid:', validateSkillName('discovery', list), '(expected: true)');
console.log('unknown valid:', validateSkillName('unknown-skill', list), '(expected: false)');
console.log('injection valid:', validateSkillName('discovery; rm -rf /', list), '(expected: false)');
"
```

**Expected:**
```
discovery valid: true (expected: true)
unknown valid: false (expected: false)
injection valid: false (expected: false)
```

## Step 6 — Full npm test baseline

```bash
npm test 2>&1 | tail -5
```

**Expected:** All pre-existing passing tests continue to pass. New tests for wuce.11 pass.
