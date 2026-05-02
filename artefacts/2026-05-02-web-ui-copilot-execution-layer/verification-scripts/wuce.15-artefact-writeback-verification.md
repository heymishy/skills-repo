# Verification Script: wuce.15 — Artefact write-back with attribution

**Story:** wuce.15-artefact-writeback
**AC count:** 5
**Test suite:** `tests/check-wuce15-artefact-writeback.js`

---

## Pre-conditions

- Web UI backend running with valid user OAuth token (repo:write scope)
- Active skill session in complete state (final artefact event received)
- GitHub Contents API accessible (or mocked with `contents-api-commit-success.json` fixture)

---

## AC1 — Confirm → artefact committed to correct path under user identity

**Automated:** T1.1: `commitArtefact` called with path `artefacts/<slug>/discovery.md` and `committer.name = authenticated user`; T3.1: route returns 201 with `{ sha, htmlUrl }`

**Human smoke test:**
1. Complete a `/discovery` session
2. Click "Commit artefact to repository" and confirm the dialog
3. Navigate to the repository on GitHub
4. Verify: `artefacts/<feature-slug>/discovery.md` exists in the repo
5. Verify: the commit is attributed to the authenticated user (not a bot or service account)

---

## AC2 — Git author and committer = authenticated user's GitHub identity

**Automated:** T1.1: Contents API call includes `author: { name: user.login }` and `committer: { name: user.login }`; T1.1: neither equals `process.env.GITHUB_TOKEN` owner or a service account

**Human smoke test:**
1. After a successful write-back, inspect the commit on GitHub
2. Verify: the commit author name matches the logged-in user's GitHub handle
3. Verify: the commit shows the GitHub avatar of the authenticated user (not a bot icon)

---

## AC3 — Path outside `artefacts/` rejected with 400

**Automated:** T2.2: `validateArtefactPath('../etc/passwd')` returns `false`; T2.3: `validateArtefactPath('src/evil.js')` returns `false`; T2.5: client-supplied `path` field in request body is ignored — path derived from session context only; T3.3: route returns 403 when session owner mismatch

**Human smoke test (path injection attempt):**
1. Using an HTTP client (curl or browser DevTools), send a `POST /api/skills/discovery/sessions/:id/commit` request with body `{ "path": "../etc/passwd" }`
2. Verify: the server returns 400 or ignores the field and commits to the session-derived path
3. Verify: no file outside `artefacts/` was created in the repository

**Static check:**
```bash
node -e "
const { validateArtefactPath } = require('./src/artefact-path-validator');
const cases = [
  ['artefacts/2026-05-02-test/discovery.md', true],
  ['../etc/passwd', false],
  ['src/evil.js', false],
  ['artefacts/../etc/passwd', false],
  ['.github/workflows/pwned.yml', false]
];
let passed = 0;
cases.forEach(([path, expected]) => {
  const result = validateArtefactPath(path);
  if (result === expected) { passed++; console.log('PASS:', path); }
  else console.log('FAIL:', path, 'expected', expected, 'got', result);
});
console.log(passed + '/' + cases.length + ' path validation checks passed');
"
```

---

## AC4 — 409 conflict → correct message to user

**Automated:** T4.1: route returns 409 with body `{ message: 'Artefact already exists — reload and review before committing' }`; T4.2: response includes `existingArtefactUrl`

**Human smoke test:**
1. Commit an artefact successfully (creates the file)
2. Complete a second session for the same feature slug
3. Click "Commit artefact to repository" again (without changing the artefact path)
4. Verify: a message "Artefact already exists — reload and review before committing" appears
5. Verify: a link to view the existing artefact is present
6. Verify: the existing artefact was NOT overwritten without explicit user action

---

## AC5 — Confirmation shows repo link + commit SHA

**Automated:** T5.1: `sha` matches `/^[0-9a-f]{40}$/`; T5.2: `htmlUrl` matches `/github\.com.+\/artefacts\//`

**Human smoke test:**
1. After a successful write-back, verify the confirmation screen shows:
   - A 40-character commit SHA (or a shortened version with a link to the full SHA)
   - A clickable link to the committed artefact file on GitHub
2. Click the link — verify it opens the correct file in the repository

---

## Run commands

```bash
npx jest tests/check-wuce15-artefact-writeback.js --verbose
npm test
```

---

## Gap table

| AC | Coverage type | Gap / risk |
|----|--------------|-----------|
| AC1 | Automated (adapter spy + route test) + human smoke | Low |
| AC2 | Automated (committer identity assertion) + human GitHub inspection | Low |
| AC3 | Automated (path validator unit + static grep + client-field-ignored test) + human injection attempt | Low |
| AC4 | Automated (409 mock + message assertion) + human smoke | Low |
| AC5 | Automated (SHA format + URL format) + human smoke | Low |
