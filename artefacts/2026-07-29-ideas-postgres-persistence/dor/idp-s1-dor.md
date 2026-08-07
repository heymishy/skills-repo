# Definition of Ready Checklist

## Definition of Ready: Persist the kanban Ideas backlog in Postgres instead of an ephemeral file

**Story reference:** artefacts/2026-07-29-ideas-postgres-persistence/stories/idp-s1-persist-ideas-in-postgres.md
**Test plan reference:** artefacts/2026-07-29-ideas-postgres-persistence/test-plans/idp-s1-persist-ideas-in-postgres-test-plan.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Real, currently-active data loss, quantified with the exact mechanism (no Fly volume + redeploy-on-every-merge) |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review by design |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Reuses existing `_creditsPool`, mirrors `product-repo.js`'s established module style |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI change |
| H-NFR | NFR profile exists | ✅ N/A short-track | NFRs stated directly in story |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Idea titles/notes are operator-authored backlog text, not PII/secrets — Public |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ **with one deliberate deviation, see below** | New injectable adapter introduced (`_ideasStore` / `setIdeasStore()`) |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set (idempotent `CREATE TABLE IF NOT EXISTS`, same pattern as `products`/`credits`, not a formal migration) |

**All hard blocks pass — with the H-GOV note recorded transparently, and the H-ADAPTER deviation explicitly justified below.**

### H-ADAPTER deviation note (D37)

D37's rule 1 ("Stub defaults MUST throw, not return empty/null") is **deliberately not followed** for this adapter's default. The default implementation is the existing, already-working file-based read/write logic (unchanged behaviour, not a stub masking misconfiguration) — this mirrors `journey-store.js`'s own established shape (a real disk-adapter default, overridden by a Postgres adapter when `DATABASE_URL` is set), not the credits-adapter shape (where no safe default exists and a stub must throw). D37's other three mandatory points are followed exactly: (2) AC1 is the explicit production-wiring AC; (3) the implementation plan below names the wiring as a task separate from the handler/adapter-shape change; (4) AC5/IT4 assert real, differentiating behavioural correctness (two distinct ideas round-tripping correctly), not merely that `setIdeasStore()` was called.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No /review run (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Solo-operator posture, same basis as prior short-track stories this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's one gap (real deploy-cycle testing) has an explicit, precedented mitigation (fresh-pool-instance proxy, matching `dfr-s1`'s own established pattern) | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Persist the kanban Ideas backlog in Postgres instead of an ephemeral file — artefacts/2026-07-29-ideas-postgres-persistence/stories/idp-s1-persist-ideas-in-postgres.md
Test plan: artefacts/2026-07-29-ideas-postgres-persistence/test-plans/idp-s1-persist-ideas-in-postgres-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Read src/web-ui/routes/features.js and src/web-ui/modules/product-repo.js
  in full before writing anything.
- New module src/web-ui/adapters/ideas-store-pg.js: migrateIdeasSchema(pool),
  listIdeas(pool) returning { ideas: [...] } (same shape as the existing
  _readIdeas() return value), createIdea(pool, {title, notes}), and
  deleteIdea(pool, id). Plain async functions taking pool as the first
  argument, matching product-repo.js's style exactly -- not a class.
- In routes/features.js: replace the direct _readIdeas()/_writeIdeas() fs
  calls inside handleGetIdeas/handlePostIdea/handleDeleteIdea with calls
  through a new injectable _ideasStore object (listIdeas()/createIdea()/
  deleteIdea()), overridable via a new setIdeasStore(store) export. The
  DEFAULT _ideasStore must wrap the EXISTING file-based logic unchanged
  (not a throw-stub -- see the DoR's H-ADAPTER deviation note above) so
  AC4's no-DB regression guard holds exactly.
- Task split (D37 point 3, keep these as two distinct commits/steps):
  Task A = the adapter module + the injectable _ideasStore/setIdeasStore
  refactor in features.js (still using the file-based default). Task B =
  wiring the real Postgres-backed setIdeasStore() call into server.js's
  existing `if (process.env.DATABASE_URL)` block, alongside the
  products/credits wiring, reusing the already-created _creditsPool.
  Call migrateIdeasSchema(_creditsPool) there too (idempotent, same
  pattern as the existing inline CREATE TABLE IF NOT EXISTS calls).
- Write the wiring test (IT4) to assert AC5 exactly as worded: two
  distinct, individually-correct ideas round-tripping through the real
  wired handler -- not merely that setIdeasStore was called with
  something. This is the D37 point-4 requirement.
- Retrieve real DATABASE_URL for integration tests via the established
  safe pattern: flyctl ssh console --app wuce-staging -C "printenv
  DATABASE_URL", piped to a job-scoped temp file, used inline for the
  single test invocation, then deleted immediately. Never print, log, or
  commit the value.
- New test file tests/check-idp-s1-persist-ideas-in-postgres.js covering
  U1-U6 and IT1-IT4 exactly as described in the test plan.
- Do not touch kanban-view.js -- no UI change, per the story's Out of
  Scope section.
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — a straightforward, well-precedented durability fix (mirrors `journey-store.js`'s existing disk/pg dual-adapter shape and `product-repo.js`'s module style exactly); the one deliberate D37 deviation is explicitly justified and low-risk (the default behaviour is unchanged from today, not a new risk introduced).
**Sign-off required:** No
**Signed off by:** Hamish King — Platform owner — requested this fix directly, 2026-07-29
