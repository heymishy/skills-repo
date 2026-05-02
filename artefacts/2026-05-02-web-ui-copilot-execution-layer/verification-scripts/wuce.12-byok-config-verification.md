# Verification Script: wuce.12 — BYOK and self-hosted provider configuration

## Pre-conditions

- Jest installed; `tests/check-wuce12-byok-config.js` exists

## Step 1 — Run Jest tests

```bash
npx jest tests/check-wuce12-byok-config.js --verbose
```

**Expected output:** 17 tests pass, 0 fail.

## Step 2 — Verify BYOK vars injected into subprocess env

```bash
node -e "
// Temporarily set BYOK vars and inspect what would be injected
process.env.COPILOT_PROVIDER_TYPE = 'azure';
process.env.COPILOT_PROVIDER_BASE_URL = 'https://test.openai.azure.com';
process.env.COPILOT_PROVIDER_API_KEY = 'sk-test-key';
process.env.COPILOT_MODEL = 'gpt-4o';
const { buildSubprocessEnv } = require('./src/execution/subprocess-executor');
const env = buildSubprocessEnv('gho_token', '/tmp/home');
console.log('COPILOT_PROVIDER_TYPE:', env.COPILOT_PROVIDER_TYPE, '(expected: azure)');
console.log('COPILOT_PROVIDER_BASE_URL present:', !!env.COPILOT_PROVIDER_BASE_URL, '(expected: true)');
console.log('COPILOT_PROVIDER_API_KEY present:', !!env.COPILOT_PROVIDER_API_KEY, '(expected: true)');
console.log('COPILOT_MODEL:', env.COPILOT_MODEL, '(expected: gpt-4o)');
console.log('COPILOT_GITHUB_TOKEN present:', !!env.COPILOT_GITHUB_TOKEN, '(expected: true)');
delete process.env.COPILOT_PROVIDER_TYPE;
delete process.env.COPILOT_PROVIDER_BASE_URL;
delete process.env.COPILOT_PROVIDER_API_KEY;
delete process.env.COPILOT_MODEL;
"
```

**Expected:** All fields present with correct values.

## Step 3 — Verify API key NOT in any log call (static analysis)

```bash
node -e "
const src = require('fs').readFileSync('src/execution/subprocess-executor.js','utf8');
// Check that the API key env var is not passed to any log function directly
if (src.includes('log(process.env.COPILOT_PROVIDER_API_KEY)') || 
    src.includes('console.log(process.env.COPILOT_PROVIDER_API_KEY)')) {
  throw new Error('SECURITY VIOLATION: API key directly logged');
}
console.log('PASS: API key not directly logged in subprocess-executor.js');
"
```

**Expected:** `PASS: API key not directly logged in subprocess-executor.js`

## Step 4 — Verify partial BYOK config warning

```bash
node -e "
process.env.COPILOT_PROVIDER_TYPE = 'anthropic';
delete process.env.COPILOT_PROVIDER_BASE_URL;
const warnings = [];
const mockLogger = { warn: (msg) => warnings.push(msg) };
const { validateByokConfig } = require('./src/execution/byok-config');
validateByokConfig(mockLogger);
const hasWarning = warnings.some(w => w.includes('BYOK provider type set but base URL is missing'));
console.log('Partial BYOK warning logged:', hasWarning, '(expected: true)');
delete process.env.COPILOT_PROVIDER_TYPE;
"
```

**Expected:** `Partial BYOK warning logged: true (expected: true)`

## Step 5 — Verify no BYOK vars injected when not configured

```bash
node -e "
['COPILOT_PROVIDER_TYPE','COPILOT_PROVIDER_BASE_URL','COPILOT_PROVIDER_API_KEY','COPILOT_MODEL','COPILOT_OFFLINE']
  .forEach(k => delete process.env[k]);
const { buildSubprocessEnv } = require('./src/execution/subprocess-executor');
const env = buildSubprocessEnv('gho_token', '/tmp/home');
const byokPresent = Object.keys(env).some(k => k.startsWith('COPILOT_PROVIDER') || k === 'COPILOT_OFFLINE');
console.log('BYOK vars absent when not configured:', !byokPresent, '(expected: true)');
console.log('COPILOT_GITHUB_TOKEN still present:', !!env.COPILOT_GITHUB_TOKEN, '(expected: true)');
"
```

**Expected:**
```
BYOK vars absent when not configured: true (expected: true)
COPILOT_GITHUB_TOKEN still present: true (expected: true)
```

## Step 6 — Full npm test baseline

```bash
npm test 2>&1 | tail -5
```

**Expected:** All pre-existing passing tests continue to pass. New tests for wuce.12 pass.
