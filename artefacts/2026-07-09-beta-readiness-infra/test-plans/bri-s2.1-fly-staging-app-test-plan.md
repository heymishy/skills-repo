# Test Plan: Provision the wuce-staging Fly app

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.1-fly-staging-app.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-2-staging-environment.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Same Dockerfile, `fly deploy --config fly.staging.toml --app wuce-staging` builds and starts as a distinct app from `wuce-prod` | 2 tests | — | — | 1 scenario | External-dependency | 🟡 |
| AC2 | `fly.staging.toml` differs from `fly.toml` only in app name, secrets, and staging-specific env vars — not build/runtime behaviour | 3 tests | — | — | 1 scenario (visual confirm) | — | 🟢 |
| AC3 | Idle `wuce-staging` bills near-zero after a week — no idle compute billed as always-on | 1 test (config proxy) | — | — | 1 scenario | External-dependency | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in this repo's Node suite | Handling |
|-----|----|----------|--------------------------------------------|---------|
| Actual successful build + start on Fly.io | AC1 | External-dependency | Requires a real `fly deploy` against a live Fly.io account/token — no Fly API access from the automated test suite | Manual scenario — see AC verification script Scenario 1 🟡 |
| Actual billing amount after a week of idle traffic | AC3 | External-dependency | Billing is only observable via the Fly.io dashboard after real elapsed time running against a real account — nothing to assert against in a unit test | Manual scenario, scheduled ~1 week post-deploy — see AC verification script Scenario 3 🟡 |

---

## Test Data Strategy

**Source:** Synthetic / Fixtures — test data is the repo's own `fly.toml` and the to-be-created `fly.staging.toml`, both read directly from disk. No external Fly.io calls.
**PCI/sensitivity in scope:** No
**Availability:** Available now — `fly.toml` already exists in the repo root; `fly.staging.toml` does not exist yet (expected — tests fail until it's created)
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `fly.staging.toml` file content, parsed as TOML | Repo file (to be created) | None | Tests read the file directly — no network calls |
| AC2 | Both `fly.toml` and `fly.staging.toml`, parsed and diffed section-by-section | Repo files | None | `fly.toml` (prod) already exists; comparison is TOML-key-level, not a live Fly API call |
| AC3 | `fly.staging.toml` `[http_service]` scale-to-zero settings (`auto_stop_machines`, `min_machines_running`) | Repo file | None | This is a config-level proxy for "near-zero cost" — the actual dollar figure is a manual gap (see above) |

### PCI / sensitivity constraints

None.

### Gaps

None in test data availability — the gap is in what a config file can prove (see Coverage gaps above), not in data access.

---

## Unit Tests

### T1 — `fly.staging.toml` exists at repo root

- **Verifies:** AC1
- **Precondition:** Repository root known (`path.join(__dirname, '..')`)
- **Action:** `fs.existsSync(path.join(ROOT, 'fly.staging.toml'))`
- **Expected result:** `true`
- **Edge case:** No
- **Fails before implementation:** Yes — file does not exist yet

---

### T2 — `fly.staging.toml` declares `app = 'wuce-staging'`, distinct from `fly.toml`'s app

- **Verifies:** AC1
- **Precondition:** `fly.staging.toml` exists (T1 passes); `fly.toml` exists (already true today, `app = 'skills-framework'`)
- **Action:** Parse both files with a minimal TOML reader (or regex on the top-level `app = '...'` line, since Node has no built-in TOML parser and this repo has no TOML dependency — a small hand-rolled line parser is sufficient for this flat-structure file). Compare `app` values.
- **Expected result:** `staging.app === 'wuce-staging'` and `staging.app !== prod.app`
- **Edge case:** No
- **Fails before implementation:** Yes — file does not exist

---

### T3 — `fly.staging.toml`'s `[build]`, `[http_service]`, and `[[vm]]` sections match `fly.toml`'s exactly

- **Verifies:** AC2
- **Precondition:** Both files exist and parse
- **Action:** Extract the `[build]`, `[http_service]` (including `[http_service.concurrency]`), and `[[vm]]` blocks from each file. Deep-compare key/value pairs.
- **Expected result:** All three sections are identical between `fly.toml` and `fly.staging.toml` — same Dockerfile/build behaviour, same runtime shape, same compute tier
- **Edge case:** No
- **Fails before implementation:** Yes — `fly.staging.toml` does not exist

---

### T4 — `fly.staging.toml`'s `[env]` block differs from `fly.toml`'s only in documented staging-specific keys

- **Verifies:** AC2
- **Precondition:** Both files exist and parse
- **Action:** Extract `[env]` keys from both files. Diff the key sets.
- **Expected result:** Any key present in one `[env]` block but not the other is limited to keys explicitly documented as staging-specific in the story or its implementation notes (e.g. a staging flag). No unexplained divergence.
- **Edge case:** Yes — this test needs a documented allowlist of permitted staging-only env keys; at test-plan time none are named beyond secrets (which are never in the TOML at all — see T5), so the initial assertion is "`[env]` key sets are identical" until an implementation note documents an exception.
- **Fails before implementation:** Yes — file does not exist

---

### T5 — `fly.staging.toml` contains no hardcoded secret-shaped values

- **Verifies:** NFR (Security)
- **Precondition:** `fly.staging.toml` exists
- **Action:** Read file content; scan for patterns resembling connection strings or tokens: `postgres://`, `redis://`, `rediss://`, `sk_`, `whsec_`, `UPSTASH_REDIS_REST_TOKEN\s*=\s*['"]` followed by a non-empty literal.
- **Expected result:** Zero matches — secrets are set via `fly secrets set`, never committed
- **Edge case:** No
- **Fails before implementation:** Cannot fail meaningfully before the file exists (T1 already covers existence) — this is a protective regression guard once the file is created. Acknowledged in Test Gaps below.

---

## Integration Tests

None. This story has no cross-component seam to test in-repo — the only "integration" is the app-to-Fly.io deploy itself, which is the External-dependency gap covered by the manual scenario.

---

## NFR Tests

### NFR1 — Performance

- **NFR addressed:** Performance — "None specific to this story beyond Fly's standard compute tier behaviour" (per story)
- **Measurement method:** Not applicable
- **Pass threshold:** N/A
- **Tool:** N/A
- **Note:** None — confirmed with story owner. No dedicated performance test written.

---

### NFR2 — Security (secrets never committed)

- **NFR addressed:** Security — staging secrets set via `fly secrets set --app wuce-staging`, never committed to the repo
- **Measurement method:** T5 above (static scan of `fly.staging.toml` for secret-shaped literals)
- **Pass threshold:** Zero matches
- **Tool:** Node.js `fs` + regex

---

### NFR3 — Cost (scale-to-zero configuration present)

- **NFR addressed:** Near-zero staging cost constraint — proxy for AC3 at the config level
- **Measurement method:** Parse `fly.staging.toml`'s `[http_service]` block; assert `auto_stop_machines = 'suspend'` and `min_machines_running = 0` are present (matching `fly.toml`'s existing values, confirmed via T3)
- **Pass threshold:** Both values present and matching prod's scale-to-zero configuration
- **Tool:** Node.js `fs` + line parser
- **Note:** This proves the *configuration* supports scale-to-zero. It does not prove the actual weekly bill is near-zero — that remains the AC3 manual gap.

---

### NFR4 — Accessibility

- **NFR addressed:** Not applicable (per story)
- **Measurement method:** N/A
- **Pass threshold:** N/A
- **Tool:** N/A

---

### NFR5 — Audit

- **NFR addressed:** Fly deploy history via `fly releases --app wuce-staging` is sufficient; no custom audit logging needed (per story)
- **Measurement method:** N/A — no custom logging to test
- **Pass threshold:** N/A
- **Tool:** N/A
- **Note:** None — confirmed with story owner.

---

## Out of Scope for This Test Plan

- Actually running `fly deploy` against Fly.io's real infrastructure — no CI credential/token access for this in the unit test suite (see Coverage gaps)
- Verifying prod (`wuce-prod`/`skills-framework`) itself is unaffected — that is a "no change" assertion outside the scope of testing a new file
- DNS/custom domain behaviour — explicitly out of scope per story
- Multi-region deploy behaviour — explicitly out of scope per story

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Actual Fly.io build/start success (AC1) | Requires live Fly.io account/token; not available to the automated Node test suite | Manual verification scenario in AC verification script — check the Fly.io dashboard directly after `fly deploy` |
| Actual weekly billing near-zero (AC3) | Billing is only observable after real elapsed time on a real account | Manual verification scenario, scheduled ~1 week after first staging deploy |
| T4's "documented allowlist" of permitted `[env]` divergence doesn't exist yet | No staging-specific env key has been named at test-plan time | Test currently asserts full `[env]` parity; revisit if a legitimate staging-only env var is introduced during implementation — update the test's allowlist, don't silently loosen the assertion |
| T5 may not be in TDD red state | A newly-created `fly.staging.toml` with no secrets is plausible even without deliberate care | Acceptable — NFR2/T5 is a protective regression guard, not a red-before-green test |
