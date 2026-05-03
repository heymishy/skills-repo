# Verification Script: wuce.17 — Playwright E2E test infrastructure

**Story:** wuce.17-playwright-e2e-infrastructure
**AC count:** 5
**Automated check suite:** `tests/check-wuce17-e2e-infra.js`
**E2E smoke suite:** `tests/e2e/smoke.spec.js` (run via `npm run test:e2e`)

---

## Pre-conditions

- `npm install` run in repo root — Playwright binary installed as devDependency
- `src/web-ui/server.js` startable with `NODE_ENV=test`
- No pre-existing process running on port 3000 (or `E2E_BASE_URL` port)

---

## Step 0 — Infrastructure validation (automated)

Run the Node.js check script first. All 16 assertions in T1–T5 must pass before running `npm run test:e2e`.

```bash
node tests/check-wuce17-e2e-infra.js
```

Expected output: all tests print `PASS` and the process exits 0.

If any test fails:
- **T1.x failure**: `playwright.config.js` missing or misconfigured — check the config file exists at repo root and exports the correct fields
- **T2.x failure**: `tests/e2e/fixtures/auth.js` missing or contains a real token — check fixture exports `withAuth` and has no `gho_`/`ghp_` strings
- **T3.x failure**: `package.json` script or devDependency issue — verify `test:e2e` uses `playwright test` and `@playwright/test` is in `devDependencies` not `dependencies`
- **T4.x failure**: placeholder spec file missing or has fewer than 3 `test.todo()` stubs — check all 4 spec files exist and each has ≥3 stubs
- **T5.x failure**: `.github/workflows/e2e.yml` missing, does not invoke `npm run test:e2e`, or has `contents: write` — check workflow file

---

## AC1 — `npm run test:e2e` exits 0 from clean install

**Automated:** T3.1, T3.2, T6.1, T6.2

```bash
NODE_ENV=test npm run test:e2e
```

Expected:
- Playwright prints a brief run summary
- Smoke test: PASS (2 tests in `smoke.spec.js`)
- Todo stubs: each `test.todo()` in the 4 placeholder spec files shows as "skipped" (Playwright counts todos as expected skips, not failures)
- Exit code: 0

**Human verification:**
- Confirm the Playwright output shows no FAILED tests
- Confirm todo stubs appear as skipped/pending, not as failures
- Confirm the output includes "Passed: 2" (or similar) for the smoke tests

**Automated separator check — unit chain is uncontaminated:**
```bash
# Confirm npm test does NOT run Playwright
npm test 2>&1 | grep -i playwright
# Expected: no output (grep finds nothing)
echo "Exit code: $?"
```

---

## AC2 — Auth bypass fixture injects test identity; no real OAuth

**Automated:** T2.1 (file exists), T2.2 (exports `withAuth`), T2.3 (no real token strings), T2.4 (`NODE_ENV=test` guard)

**Human verification:**
1. Open `tests/e2e/fixtures/auth.js`
2. Confirm: the fixture injects a session cookie/header with a hardcoded test identity (`e2e-test-user` or similar), not a call to GitHub's OAuth endpoint
3. Confirm: there is no string matching `gho_`, `ghp_`, or `github_pat_` anywhere in the file
4. Confirm: the fixture includes a guard that throws or warns if `NODE_ENV !== 'test'`

**Security gate — must pass before PR is opened:**
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('tests/e2e/fixtures/auth.js', 'utf8');
if (src.includes('gho_') || src.includes('ghp_') || src.includes('github_pat_')) {
  console.error('SECURITY FAIL: real token pattern found in auth fixture');
  process.exit(1);
}
if (!src.includes('NODE_ENV')) {
  console.error('SECURITY FAIL: NODE_ENV guard missing from auth fixture');
  process.exit(1);
}
console.log('PASS: auth fixture passes security checks');
"
```

---

## AC3 — `playwright.config.js` correctly configured

**Automated:** T1.1 (file exists), T1.2 (`testDir`), T1.3 (`headless`), T1.4 (`timeout`), T1.5 (`webServer`)

**Human verification:**
1. Open `playwright.config.js` at repo root
2. Confirm: `testDir: 'tests/e2e'`
3. Confirm: `use.baseURL` reads from `process.env.E2E_BASE_URL` and has a fallback to `'http://localhost:3000'`
4. Confirm: `use.headless: true`
5. Confirm: `timeout: 30000` (or lower)
6. Confirm: `webServer.command` runs `src/web-ui/server.js` (e.g. `node src/web-ui/server.js`)
7. Confirm: `webServer.reuseExistingServer: !process.env.CI` (local dev reuses existing; CI always starts fresh)

---

## AC4 — E2E CI gate runs as non-fatal check

**Automated:** T5.1 (file exists), T5.2 (invokes `npm run test:e2e`), T5.3 (no `contents: write`)

**Human verification:**
1. Open `.github/workflows/e2e.yml`
2. Confirm: the workflow trigger includes `pull_request`
3. Confirm: there is a step that reads `context.yml` and sets an output or env var based on `audit.e2e_tests`
4. Confirm: the E2E step is guarded by the `audit.e2e_tests` flag — it is skipped (not failed) if the flag is `false`
5. Confirm: `continue-on-error: true` (or equivalent) is set on the Playwright run step — failures do not block merge

```bash
# Quick read to confirm continue-on-error is present
grep -n "continue-on-error" .github/workflows/e2e.yml
# Expected: at least one line showing continue-on-error: true on the npm run test:e2e step
```

---

## AC5 — Placeholder spec files exist with navigational stubs

**Automated:** T4.1–T4.6 (file existence, stub count)

**Human verification — open each spec file and check:**

`tests/e2e/skill-launcher.spec.js` — expected stubs:
- At minimum: stub for AC1 (skills list renders), stub for AC2 (Launch → first question), stub for AC3 (answer validated), plus smoke test that passes

`tests/e2e/artefact-preview.spec.js` — expected stubs:
- At minimum: stub for AC1 (preview panel renders markdown), stub for AC2 (`aria-live` on preview), stub for AC5 (commit button disabled state)

`tests/e2e/artefact-writeback.spec.js` — expected stubs:
- At minimum: stub for AC4 (409 conflict message), stub for AC5 (SHA + href after commit), stub for AC3 (path validation)

`tests/e2e/session-persistence.spec.js` — expected stubs:
- At minimum: stub for AC1 (session restored after tab close), stub for AC5 (session list shows in-progress sessions), stub for AC4 (expired session message)

Each stub must be a `test.todo('descriptive name matching the AC')` — not a blank `test.todo()`.

```bash
# Quick stub count check across all placeholder files
node -e "
const fs = require('fs');
const files = [
  'tests/e2e/skill-launcher.spec.js',
  'tests/e2e/artefact-preview.spec.js',
  'tests/e2e/artefact-writeback.spec.js',
  'tests/e2e/session-persistence.spec.js'
];
files.forEach(f => {
  const src = fs.readFileSync(f, 'utf8');
  const count = (src.match(/test\.todo\(/g) || []).length;
  console.log(f + ': ' + count + ' stubs');
  if (count < 3) console.error('  FAIL: needs at least 3');
});
"
```

---

## Post-verification sign-off checklist

Before opening the draft PR:

- [ ] `node tests/check-wuce17-e2e-infra.js` exits 0 (all 16 T1–T5 assertions pass)
- [ ] `NODE_ENV=test npm run test:e2e` exits 0 (smoke.spec.js T6.1 and T6.2 pass; todo stubs are skipped not failed)
- [ ] Security gate: auth fixture has no real token strings and has `NODE_ENV` guard
- [ ] Unit chain uncontaminated: `npm test` output does not mention Playwright
- [ ] AC4 CI gate: `e2e.yml` has `continue-on-error: true` on the Playwright step
- [ ] Each placeholder spec file has ≥3 descriptive `test.todo()` stubs
