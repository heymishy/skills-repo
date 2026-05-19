# Verification Script: wuce.9 — CLI subprocess invocation with JSONL output capture

## Pre-conditions

- `tests/fixtures/cli/copilot-cli-success.jsonl` committed to repository
- `tests/fixtures/cli/copilot-cli-error-partial.jsonl` committed to repository
- Jest installed; `tests/check-wuce9-subprocess.js` exists

## Step 1 — Run Jest unit and integration tests

```bash
npx jest tests/check-wuce9-subprocess.js --verbose
```

**Expected output:** 23 tests pass, 0 fail.

## Step 2 — Verify JSONL fixture files are committed and well-formed (parseable lines)

```bash
node -e "
const lines = require('fs').readFileSync('tests/fixtures/cli/copilot-cli-success.jsonl','utf8')
  .split('\n').filter(Boolean);
lines.forEach((l,i) => { try { JSON.parse(l); } catch(e) { throw new Error('Line '+(i+1)+' invalid: '+l); } });
console.log('success.jsonl: '+lines.length+' valid JSON lines');
"
```

**Expected:** `success.jsonl: 6 valid JSON lines`

```bash
node -e "
const lines = require('fs').readFileSync('tests/fixtures/cli/copilot-cli-error-partial.jsonl','utf8')
  .split('\n').filter(Boolean);
let valid=0, invalid=0;
lines.forEach(l => { try { JSON.parse(l); valid++; } catch(e) { invalid++; } });
console.log('error-partial.jsonl: '+valid+' valid, '+invalid+' malformed (expected 4 valid, 1 malformed)');
"
```

**Expected:** `error-partial.jsonl: 4 valid, 1 malformed (expected 4 valid, 1 malformed)`

## Step 3 — Verify `artefact` event is extractable from success fixture

```bash
node -e "
const lines = require('fs').readFileSync('tests/fixtures/cli/copilot-cli-success.jsonl','utf8')
  .split('\n').filter(Boolean);
const parsed = [];
lines.forEach(l => { try { parsed.push(JSON.parse(l)); } catch(e) {} });
const artefact = parsed.find(e => e.type === 'artefact');
if (!artefact) throw new Error('No artefact event found');
if (!artefact.content.includes('Discovery')) throw new Error('Artefact content missing expected text');
console.log('artefact event found, content length:', artefact.content.length);
"
```

**Expected:** `artefact event found, content length: [N > 0]`

## Step 4 — Manual integration smoke test (requires Copilot CLI binary)

> This step is manual-only and is not run in CI. Requires: Copilot CLI installed, `COPILOT_GITHUB_TOKEN` set for a user with an active Copilot subscription.

```bash
export COPILOT_GITHUB_TOKEN=<your-token>
export COPILOT_HOME=$(mktemp -d)
node -e "
const { executeSkill } = require('./src/execution/subprocess-executor');
executeSkill('discovery', 'What is the core problem?', process.env.COPILOT_GITHUB_TOKEN, process.env.COPILOT_HOME)
  .then(result => {
    const artefact = result.find ? result.find(e => e.type === 'artefact') : result;
    console.log('SUCCESS - artefact event present:', !!artefact);
  })
  .catch(err => console.error('ERROR:', err.code, err.exitCode));
"
```

**Expected:** `SUCCESS - artefact event present: true`

## Step 5 — Security: verify token value does not appear in spawn args

```bash
node -e "
// Verify the module does NOT pass the token as a CLI arg
const src = require('fs').readFileSync('src/execution/subprocess-executor.js','utf8');
// The token env var injection should appear in an 'env' object, not in args construction
if (src.includes('args.push(token)') || src.includes('args.push(process.env.COPILOT_GITHUB_TOKEN)')) {
  throw new Error('SECURITY VIOLATION: token pushed to args array');
}
console.log('PASS: token not pushed to args');
"
```

**Expected:** `PASS: token not pushed to args`

## Step 6 — Security: verify `shell: false` is set

```bash
node -e "
const src = require('fs').readFileSync('src/execution/subprocess-executor.js','utf8');
if (!src.includes('shell: false') && !src.includes('shell:false')) {
  throw new Error('SECURITY VIOLATION: shell:false not found in subprocess executor');
}
console.log('PASS: shell: false present');
"
```

**Expected:** `PASS: shell: false present`

## Step 7 — Full npm test baseline

```bash
npm test 2>&1 | tail -5
```

**Expected:** All pre-existing passing tests continue to pass. New tests for wuce.9 pass.
