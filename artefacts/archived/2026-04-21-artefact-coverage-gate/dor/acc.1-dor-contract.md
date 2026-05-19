# DoR Contract: acc.1 — Artefact-first governance gate

**Story:** acc.1
**Contract version:** 1.0

---

## In-scope files

| File | Action |
|------|--------|
| `tests/check-artefact-coverage.js` | CREATE |
| `artefact-coverage-exemptions.json` | CREATE |
| `package.json` | MODIFY — append to test script |

## Behaviour specification

### `tests/check-artefact-coverage.js`

**Slug enumeration:**
- Read `.github/skills/` subdirectory names → skill slugs
- Read `src/` subdirectory names → module slugs
- Combine into one list; deduplicate

**Artefact search (for each slug):**
- Walk `artefacts/` recursively
- Normalise filenames: lowercase, replace `_` and ` ` with `-`
- A slug is COVERED if any file in `artefacts/` (after normalisation) contains the normalised slug
- A slug is UNCOVERED otherwise

**Exemption check:**
- Read `artefact-coverage-exemptions.json` from repo root (relative to `__dirname`)
- If the file does not exist, all slugs are treated as requiring artefacts (no implicit exemptions)
- Each entry: `{ "slug": "...", "reason": "..." }`
- Entry with empty or missing `reason` → treated as UNCOVERED (not exempt)
- UNCOVERED slug that is in exemption list with valid reason → EXEMPT (not UNCOVERED)

**Output:**
- Print `[artefact-coverage] Checking <N> slugs...`
- Print each COVERED slug: `  ✓ <slug>`
- Print each EXEMPT slug: `  ~ <slug> (exempt: <reason>)`
- Print each UNCOVERED slug: `  ✗ <slug> — NO DoR artefact found`
- Print summary: `[artefact-coverage] Results: <N> covered, <N> exempt, <N> uncovered`

**Exit code:**
- Exit 0 if uncovered count is 0
- Exit 1 if uncovered count > 0

**Inline self-tests (run before main logic, prefix `[artefact-coverage-self-test]`):**
- `uncovered-slug-fails` — temporary dir with no artefacts, one slug → exits non-zero ✓
- `covered-slug-passes` — temporary dir with matching artefact file, one slug → exits zero ✓
- `exempted-slug-passes` — temporary dir, slug in exemption list with reason → exits zero ✓
- `exemption-without-reason-fails` — exemption entry with empty reason → treated as uncovered ✓

### `artefact-coverage-exemptions.json`

```json
{
  "exemptions": [
    { "slug": "<slug>", "reason": "<why no artefact exists and what the remediation plan is>" }
  ]
}
```

**Required exemptions (baseline — add all currently-uncovered slugs):**
The script must exit 0 after baseline is committed. Enumerate by running the enumeration logic against the current repo state.

## Out of scope

- Do not create or modify any files under `.github/skills/`, `src/`, or `artefacts/`
- Do not modify any SKILL.md files
- Do not modify `pipeline-state.json` or `workspace/state.json`
- Do not add npm dependencies
- Do not create DoR artefacts for the exempted slugs — those are tracked in the exemption file
