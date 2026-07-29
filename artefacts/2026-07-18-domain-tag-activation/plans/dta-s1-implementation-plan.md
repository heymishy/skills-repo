# Implementation Plan: dta-s1 — Activate domain-tag standards injection at story authoring time

**Story:** artefacts/2026-07-18-domain-tag-activation/stories/dta-s1.md
**DoR contract:** artefacts/2026-07-18-domain-tag-activation/dor/dta-s1-dor-contract.md
**Date:** 2026-07-29

**Design note:** per `decisions.md` (2026-07-29 entry), the DoR contract's assumption that a "DoR standards-matching function" already exists was investigated and found false — the "Standards injection" step is pure SKILL.md prose today. This plan builds it as new, real code (`src/enforcement/standards-injection.js`), following the same direction as this session's `gav-s1` (converting a documented-but-unenforced mechanism into tested code), and updates the SKILL.md text to describe that exact algorithm.

---

## Tasks

**Task 1 — `src/enforcement/standards-injection.js` (new module)**
- No `js-yaml` dependency — this repo's established convention (confirmed via `package.json`) is text/regex-based parsing for simple YAML files, matching `.github/workflows/*.yml`'s own governance checks elsewhere in this repo.
- `parseStandardsIndex(repoRoot)` — reads `.github/standards/index.yml`, returns `{ [domainKey]: { description, files: [...] } }`. Returns `null` if the file doesn't exist (preserves the existing "skip silently if index.yml is absent" behaviour from the SKILL.md text).
- `matchDomainsToStandards(domains, repoRoot)` — takes an array of raw domain tag strings (as authored on a story, e.g. `[' Web-UI ', 'security']`). Normalises each (trim + lowercase) before matching against `index.yml`'s keys (also normalised). Returns `{ matched: [{ domain, files: [...] }], unmatched: [...rawOriginalTagsThatDidNotMatch] }`. If `domains` is empty/undefined, returns `{ matched: [], unmatched: [], noDomainField: true }` — this sentinel lets the SKILL.md's existing "Story has no domain field — skipped silently" message stay exactly as it is (AC4 regression guard).
- `buildStandardsInjectionBlock(domains, repoRoot)` — calls `matchDomainsToStandards`, then reads and concatenates the full text of every matched file under a `## Applicable standards` heading, one subsection per file with clear source attribution (`### From: .github/standards/web-ui/web-ui-patterns.md`). Appends a distinct warning line per unmatched domain. Returns the block as a Markdown string (or `null` if `noDomainField` — caller falls back to the existing "skipped silently" text).

**Task 2 — Update `skills/definition-of-ready/SKILL.md`'s "Standards injection" section**
- Replace the current prose-only algorithm description with one that explicitly names `src/enforcement/standards-injection.js`'s `matchDomainsToStandards()`/`buildStandardsInjectionBlock()` as the algorithm to apply (case/whitespace-normalised matching; distinct warning for unmatched domains) — so a human/agent following the instructions and the tested code share one source of truth.
- Preserve the existing "no domain field → skip silently" and "index.yml absent → skip silently" behaviours exactly (AC4).
- Add the distinct unmatched-domain warning text (AC5), matching the format already sketched in the current SKILL.md (`Tag [tag] was not found in index.yml...`) but clarified as a per-tag warning distinct from the no-domain-field message.

**Task 3 — Update `skills/definition/SKILL.md`'s story-authoring instructions (AC1)**
- Add a step (during story authoring, before Complexity Rating) that reads `.github/standards/index.yml`'s domain keys dynamically (not a hardcoded, driftable list) and prompts the author to consider setting `domain: [...]` when the story's scope clearly matches one or more listed domains.

**Task 4 — Test file `tests/check-dta-s1-domain-tag-activation.js`**
- U1-U2: text-content assertions against `skills/definition/SKILL.md` (domain field mentioned; no hardcoded stale domain list — confirmed by checking the SKILL.md doesn't literally enumerate `api, auth, data, web-ui, payments, ui, security` as a fixed list independent of `index.yml`).
- U3-U5, U8-U10: real calls to `matchDomainsToStandards()` against fixture domain arrays and a real (or fixture) `index.yml`.
- U4, IT1-IT2: real calls to `buildStandardsInjectionBlock()`, asserting the returned Markdown contains the actual file content (e.g. a known snippet from `web-ui-patterns.md`), not just a path reference.
- U6-U7: text-content assertions confirming `skills/definition-of-ready/SKILL.md` still contains the exact "Story has no `domain` field — skipped silently" string, and calling `matchDomainsToStandards([])` / `buildStandardsInjectionBlock([])` returns the `noDomainField` sentinel / `null` (regression guard at the code level, now that code exists).

**Task 5 — Verification**
- Run the new test file standalone; run the full suite once to confirm the established baseline is unaffected.
