# Definition of Ready: Opening any single document resolves through the canonical trace, not independent logic

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s5-artefact-fetch-integration.md
**Test plan reference:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s5-artefact-fetch-integration-test-plan.md
**Contract:** artefacts/2026-09-06-canonical-artefact-trace/dor/cat-s5-dor-contract.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-09-06

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona: Developer/engineer |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 6 unit + 2 integration across 4 ACs |
| H4 | Out-of-scope populated | ✅ | 2 exclusions named |
| H5 | Benefit linkage references named metric | ✅ | "Bugs of this class per session" |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH findings | ✅ | Review: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | No uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency | ✅ | schemaDepends: ["stage","reviewStatus"] on cat-s1/cat-s2 — both fields exist in pipeline-state.schema.json |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | adlr-s1 URL-shape constraint, named regression surfaces by file/line; review Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent gap check | ✅ | Not triggered |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-09-06-canonical-artefact-trace/nfr-profile.md |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not triggered |
| H-NFR3 | Data classification not blank | ✅ | Populated |
| H-NFR-profile | NFR profile presence | ✅ | Populated; profile exists |
| H-GOV | Approved By non-blank, non-engineer-only | ✅ | "Hamish King — Platform Owner" — positive M1 signal |
| H-ADAPTER | Injectable adapter wiring | ✅ | Not triggered — no `setX()` adapters introduced |
| H-INF | Infra-plan gate | ✅ | Not triggered |
| H-MIG | Migration-review gate | ✅ | Not triggered |

**Result: 19/19 hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | — | N/A — 0 findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Low — derived from PASSed AC/test plan | Hamish King — RISK-ACCEPT logged in decisions.md, 2026-09-06 |
| W5 | No UNCERTAIN gap-table items | ✅ | — | — |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Opening any single document resolves through the canonical trace, not independent logic — artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s5-artefact-fetch-integration.md
Test plan: artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s5-artefact-fetch-integration-test-plan.md

Goal:
Make every test in tests/check-cat-s5-artefact-fetch-integration.js pass. Do
not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Node.js CommonJS only, no new npm dependencies.
- Modify src/web-ui/adapters/artefact-fetcher.js's fetchArtefact resolution
  logic to consult cat-s1/cat-s3's buildArtefactTrace/classifyDivergence
  output instead of the independent ARTEFACT_SUBDIRS-based bare-name probe.
- CAPTURE A GOLDEN-FIXTURE SNAPSHOT of adlr-s1's current known-good response
  (the psh fixture, dor%2Fpsh-s1-dor) BEFORE making any other change — AC1's
  "no behavioural change" comparison is meaningless otherwise.
- Must not break the existing /artefact/:slug/:type URL shape — adlr-s1's
  link-encoding convention remains compatible.
- journey.js's gate-confirm fetch (line 921) and export-data-source.js's SaaS
  export fetch both call fetchArtefact directly and MUST keep working
  unchanged — do not modify either call site (cat-s6 verifies this
  separately; if you suspect a real defect there, stop and flag it, do not
  fix it inline).
- Add a new, distinct error branch in src/web-ui/routes/artefact.js for the
  orphaned-registration case — a real 404 with a message clearly different
  from adlr-s1's existing never-registered 404 message.
- The existing ArtefactNotFoundError/ArtefactFetchError classes and their
  postgres-fallback/error-page call sites must be unchanged — only what
  feeds into them changes.
- Session token access: req.session.accessToken is the canonical field name
  — never req.session.token. Grep check (must return zero results in
  touched files): grep -rn "req\.session\.token[^A]" src/web-ui/
- Out of scope: journey.js's/export-data-source.js's own call sites; GitHub
  Contents API auth/timeout/retry changes.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium — share this DoR artefact with the tech lead before
assigning (confirmed by Hamish King, 2026-09-06). No formal sign-off required.
```

### Applicable standards — web-ui

Source: `.github/standards/web-ui/web-ui-patterns.md` — read in full before implementing.

Most directly relevant sections for this story (modifies fetch/resolve logic and adds a route error branch):

- **Session token access**: `req.session.accessToken` is canonical — verify no touched code path introduces or relies on `req.session.token`.
- **Path traversal guard for disk writes**: not directly triggered (this story reads, not writes, disk paths derived from request data) — but the same "validate the resolved path before use" discipline applies to any slug/type parameter feeding into the trace's path resolution; confirm existing upstream validation (per the story's own Security NFR: "featureSlug is already validated elsewhere") is not bypassed by the new resolution path.
- **HTML render function unit test pattern**: not directly applicable — this story has no new render function, only resolution logic and an error branch; the underlying "assert specific fragments/values, not full snapshots" principle still applies to the two distinct 404 message assertions (AC3).
- **Stack constraints**: No new npm `dependencies`; no Express.

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech-lead awareness only
**Acknowledged by:** Hamish King — Platform Owner — 2026-09-06 (confirmed via /definition-of-ready)
