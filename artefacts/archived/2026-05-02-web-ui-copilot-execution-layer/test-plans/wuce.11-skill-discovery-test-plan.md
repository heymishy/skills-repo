# Test Plan: wuce.11 — SKILL.md discovery and skill routing

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.11-skill-discovery.md
**Epic:** wuce-e3
**Framework:** Jest + Node.js (real `fs` with controlled directory fixtures; no mocking of `fs.readdirSync`)
**Test data strategy:** Temporary skill directory trees created in-test; torn down after each test

---

## AC coverage summary

| AC | Description | Coverage type | Gap |
|---|---|---|---|
| AC1 | `listAvailableSkills(repoPath)` returns `[{name, path}]` for dirs containing `SKILL.md` | Unit (real fs, temp dir) | None |
| AC2 | `COPILOT_SKILLS_DIRS` env var overrides default `.github/skills/` | Unit (env var set in test process) | None |
| AC3 | Subdirs without `SKILL.md` are excluded | Unit (temp dir with mixed contents) | None |
| AC4 | Missing or empty skills dir → returns `[]`, logs warning | Unit | None |
| AC5 | Returned list is complete and bounded; no entry whose path resolves outside skills dir | Unit (path assertion) | None |

---

## Shared fixtures (created in-test, not committed)

wuce.11 creates its skill directory fixtures programmatically within each test using `fs.mkdtempSync`. No committed fixture files are needed for this story. The wuce.9 E3 shared JSONL fixtures are not referenced by wuce.11.

---

## Unit tests

### T1 — `listAvailableSkills(repoPath)` basic discovery (AC1)

**T1.1 — returns one entry per directory containing a `SKILL.md` file**
- Setup: create a temp dir structure:
  ```
  <tempRoot>/
    .github/skills/
      discovery/SKILL.md
      review/SKILL.md
      test-plan/SKILL.md
  ```
- Call: `listAvailableSkills(tempRoot)`
- Expected: returns array of length 3; each element has `name` and `path` keys; names are `"discovery"`, `"review"`, `"test-plan"` (order may vary)

**T1.2 — `path` field is relative to repo root, not absolute**
- Setup: same temp dir as T1.1
- Expected: each returned `path` value starts with `.github/skills/` (relative); does NOT start with `/` or `C:\`

**T1.3 — `name` field matches directory name exactly**
- Setup: dir named `definition-of-ready` containing `SKILL.md`
- Expected: returned entry has `name: "definition-of-ready"`

### T2 — `COPILOT_SKILLS_DIRS` env var override (AC2)

**T2.1 — custom `COPILOT_SKILLS_DIRS` path is scanned instead of default**
- Setup: create a temp dir with custom path `<tempRoot>/custom-skills/`; place `discovery/SKILL.md` inside it; set `process.env.COPILOT_SKILLS_DIRS = '<tempRoot>/custom-skills'`; create a separate default `.github/skills/` dir containing `review/SKILL.md`
- Call: `listAvailableSkills(tempRoot)`
- Expected: result contains `"discovery"` (from custom path); does NOT contain `"review"` (from default path)
- Teardown: `delete process.env.COPILOT_SKILLS_DIRS`

**T2.2 — when `COPILOT_SKILLS_DIRS` is unset, default `.github/skills/` is used**
- Setup: `delete process.env.COPILOT_SKILLS_DIRS`; create `.github/skills/review/SKILL.md` in temp root
- Call: `listAvailableSkills(tempRoot)`
- Expected: result contains `"review"`

### T3 — Subdirs without `SKILL.md` are excluded (AC3)

**T3.1 — empty subdirectory not included**
- Setup: `<tempRoot>/.github/skills/discovery/SKILL.md` exists; `<tempRoot>/.github/skills/draft-wip/` exists but is empty
- Expected: result contains `"discovery"` but NOT `"draft-wip"`

**T3.2 — subdirectory with non-SKILL.md files not included**
- Setup: `<tempRoot>/.github/skills/assets/logo.png` exists (no `SKILL.md`)
- Expected: `"assets"` not in result

### T4 — Missing or empty skills directory (AC4)

**T4.1 — missing skills dir returns empty array without throwing**
- Setup: `tempRoot` exists but `.github/skills/` does not exist
- Call: `listAvailableSkills(tempRoot)`
- Expected: returns `[]`; no exception thrown

**T4.2 — empty skills dir returns empty array**
- Setup: `<tempRoot>/.github/skills/` exists but contains no subdirectories
- Expected: returns `[]`

**T4.3 — missing dir logs a warning**
- Setup: spy on logger; skills dir absent
- Call: `listAvailableSkills(tempRoot)`
- Expected: logger called with a warning-level message; function still returns `[]` without throwing

### T5 — Allowlist completeness and path bounds (AC5)

**T5.1 — returned list contains all discovered skills**
- Setup: skills dir with 5 subdirs each containing `SKILL.md`
- Expected: result has length 5; no entries omitted

**T5.2 — no entry path resolves outside the configured skills directory**
- Setup: skills dir at `.github/skills/`; one of the subdirs contains a symlink pointing outside the temp root
- Expected: the symlink target entry is either excluded or included only if its resolved path stays within the skills dir base — no entry with `path` resolving outside the skills directory boundary

**T5.3 — skill name allowlist enforcement: name not in result from `listAvailableSkills` is refused by `validateSkillName`**
- Setup: discovered list contains `["discovery", "review"]`; call `validateSkillName("unknown-skill", discoveredList)`
- Expected: returns `false` (name not in discovered list); no exception

**T5.4 — `validateSkillName` returns `true` for a name present in the discovered list**
- Setup: discovered list contains `["discovery", "review"]`; call `validateSkillName("discovery", discoveredList)`
- Expected: returns `true`

---

## Integration tests

### IT1 — `GET /api/skills` returns skill list from repository (AC1, AC2)

- Setup: authenticated session; spy on `listAvailableSkills`; configure skills dir pointing to a temp fixture dir with 3 skills
- Request: `GET /api/skills`
- Expected: `200`; response body is a JSON array of `{name, path}` objects; length matches discovered count

### IT2 — `GET /api/skills` when skills dir is missing returns empty array (AC4)

- Setup: configure skills dir to a non-existent path
- Request: `GET /api/skills`
- Expected: `200`; response body is `[]` (no 500 error — empty list is a valid state)

---

## NFR tests

### NFR1 — Skill name allowlist only includes `[a-z0-9-]` characters

- Setup: create a skills dir with a subdirectory named `discovery!` (contains invalid chars) alongside `discovery/SKILL.md`
- Expected: `listAvailableSkills` either excludes `"discovery!"` or the `validateSkillName` function rejects any name matching `[^a-z0-9-]`

### NFR2 — Discovery completes under 200ms for 50 skills

- Setup: create 50 subdirs each with a `SKILL.md`
- Expected: `listAvailableSkills` completes in under 200ms (timing measured with `Date.now()` before/after)

---

## Coverage gaps

| Gap | Reason | Mitigation |
|---|---|---|
| AC5 — symlink path traversal | Filesystem symlink behaviour varies by OS; Windows symlinks require elevation | T5.2 includes as a best-effort test; documented as a manual verification step for Unix deployments |
| AC2 — hot reload on filesystem change | Out of scope per story (server restart acceptable) | Noted in coverage; no test written |

---

## Test count

| Category | Count |
|---|---|
| Unit tests | 14 |
| Integration tests | 2 |
| NFR tests | 2 |
| **Total** | **18** |

**acTotal: 5**
