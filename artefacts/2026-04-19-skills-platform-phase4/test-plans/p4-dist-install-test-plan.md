# Test Plan: Sidecar install via init command without forking

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-install.md
**Epic:** E2 — Distribution model
**Complexity:** 2 (Unstable — sidecar layout determined by Spike C)
**Test type:** Unit + integration (fixture-based)

---

## Test matrix

| ID | Description | Type | AC | Method | Pass condition |
|----|-------------|------|----|--------|----------------|
| T1 | install module exists | Unit | — | `fs.existsSync` | `src/distribution/install.js` present |
| T2 | `install()` with valid config creates sidecar directory | Integration | AC1 | Run against temp dir with fixture context.yml | Sidecar directory exists post-install |
| T3 | Sidecar path recorded in `.gitignore` or excluded from git tracking | Integration | AC1 | Read `.gitignore` in temp dir post-install | Sidecar directory name appears in `.gitignore` |
| T4 | Lockfile exists inside sidecar after install | Integration | AC1 | `fs.existsSync(sidecar + '/skills-lock.json')` | File exists |
| T5 | Lockfile has all required minimum fields | Integration | AC1 | Parse lockfile JSON | Has `upstreamSource`, `pinnedRef`, `pinnedAt`, `platformVersion`, `skills` |
| T6 | No SKILL.md or POLICY.md outside the sidecar directory | Integration | AC2 | Scan temp root excluding sidecar path | Zero SKILL.md files outside sidecar |
| T7 | Missing `skills_upstream.repo` → pre-network error with exact message | Unit | AC3 | Call `install` with empty config | Error message: "No upstream source configured — set skills_upstream.repo in .github/context.yml" |
| T8 | Already-installed sidecar → error or identical re-init with zero commits | Integration | AC4 | Run install twice | Returns error or idempotent result with no additional git activity |
| T-NFR1 | No credentials written to lockfile or console | Security | NFR | Inspect lockfile fields; capture stdout | No token, key, or password-shaped strings |
| T-NFR2 | Lockfile written by install contains minimum audit fields per AC1 | Audit | NFR | Parse lockfile | `upstreamSource`, `pinnedRef`, and `contentHash` per skill present |

---

## Test descriptions

### T1 — Module exists
`src/distribution/install.js` must exist. If absent, all remaining tests fail as not-yet-implemented.

### T2 — Sidecar created
In a temp directory, call `install({ root: tmpDir, config: { skills_upstream: { repo: fixtureUrl, paths: ['.github/skills'] } } })`.
After the call, a sidecar directory exists within `tmpDir`. The exact path matches what Spike C specifies (to be filled from Spike C output; assumed `.skills-repo/` by default).

### T3 — gitignore entry
After `install()` runs, read `tmpDir/.gitignore`. The sidecar directory name (e.g. `.skills-repo`) must appear as a line in `.gitignore`.

### T4 — Lockfile exists
`fs.existsSync(path.join(tmpDir, '.skills-repo', 'skills-lock.json'))` must return `true`.

### T5 — Lockfile has minimum fields
Parse the lockfile. Fields `upstreamSource` (string), `pinnedRef` (string), `pinnedAt` (ISO 8601 string), `platformVersion` (string), and `skills` (array with ≥1 entry) must all be present.

### T6 — Skill files isolated
After install, recursively scan `tmpDir` for files named `SKILL.md` or `POLICY.md` excluding the sidecar directory. Expect zero matches.

### T7 — No upstream config → early error
`install({ root: tmpDir, config: {} })` must return an error or throw before making any network call. Error message must exactly match: `"No upstream source configured — set skills_upstream.repo in .github/context.yml"`.

### T8 — Idempotent or safe-error on re-install
Call `install()` twice against the same `tmpDir`. The second call must either:
(a) Return/throw an error with message containing "Sidecar already installed", OR
(b) Complete successfully with the sidecar and lockfile byte-for-byte identical to after the first call.
In both cases, no git commits are generated.

### T-NFR1 — No credentials
Capture stdout/stderr during install (mock network calls). Inspect output for token-shaped or credential-shaped strings. Inspect lockfile JSON for credential fields. Both must be clean.

### T-NFR2 — Audit fields in lockfile
`skills` array entries in the lockfile must each have a `contentHash` field (SHA-256 hex string, 64 chars). `upstreamSource` and `pinnedRef` must be non-empty strings.

---

## Coverage

| AC | Tests |
|----|-------|
| AC1 | T2, T3, T4, T5 |
| AC2 | T6 |
| AC3 | T7 |
| AC4 | T8 |
| NFR: Security | T-NFR1 |
| NFR: Audit | T-NFR2 |
