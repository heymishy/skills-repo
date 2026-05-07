# Definition of Ready: Decisions side-trip (owle.2)

**Story reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.2-decisions-side-trip.md
**Test plan reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.2-test-plan.md
**Verification script:** artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.2-test-plan.md (plain-language section)
**Review report:** Short-track — no formal review run. Zero HIGH findings.
**NFR profile:** artefacts/2026-05-07-web-ui-outer-loop-extensions/nfr-profile.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-08

---

## Contract Proposal

**What will be built:**
- `POST /api/journey/:id/decisions` handler: accepts `{ title, context, decision, rationale, riskAccept? }` body; validates all four required fields (returns 400 if any missing); derives `featureSlug` and target path (`artefacts/<featureSlug>/decisions.md`) server-side from the journey session; validates resolved path is within repoRoot (path traversal guard); creates the file with a Markdown table header if absent; appends a new row to the table; returns 201 on success.
- Stage-controls endpoint returns `decisionsAvailable: true` at ANY journey stage.
- Wire `POST /api/journey/:id/decisions` in `server.js`.

**What will NOT be built:**
- A UI decisions form (server-side only — client UI is a separate concern / no HTML served by this story).
- Editing or deleting existing decision entries.
- Automatic migration of legacy `decisions.md` format.
- Accepting featureSlug or targetPath from the client.

**How each AC will be verified:**

| AC | Test | Type |
|----|------|------|
| AC1 — form submittable at any stage | T1: stage-controls at each of 3 stages, assert decisionsAvailable:true | Unit |
| AC2 — required fields enforced | T2: POST with missing title/context/decision/rationale, assert 400 | Unit |
| AC3 — appends to decisions.md | T3: POST valid body, read file, assert row appended | Integration |
| AC4 — creates file with header if absent | T4: POST to journey with no prior decisions.md, assert file created with header | Integration |
| AC5 — path traversal blocked | T5: featureSlug from session contains `../..`, assert 400 + no file written | Security |
| AC6 — RISK-ACCEPT flag in row | T6: POST with riskAccept:true, assert row contains RISK-ACCEPT marker | Unit |

**Assumptions:**
- `featureSlug` is stored in the journey session object (set at journey creation from the feature slug).
- `artefacts/<featureSlug>/decisions.md` exists or will be created — no pre-existing format assumption.

**Estimated touchpoints:**
- `src/web-ui/routes/journey.js` — add `handlePostDecisions` handler and `decisionsAvailable` in stage-controls
- `src/web-ui/server.js` — wire POST route

---

## Contract Review

✅ **Contract review passed** — path traversal guard in AC5 prevents directory escape via malicious featureSlug. No partial writes on validation failure (AC2 returns 400 before any write). `featureSlug` is server-side only.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As an **operator in any pipeline stage**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 6 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T1–T6 cover all 6 ACs |
| H4 | Out-of-scope populated | ✅ PASS | UI form, edit/delete, legacy migration, client-supplied paths excluded |
| H5 | Benefit linkage | ✅ PASS | "Decision logging completeness" named |
| H6 | Complexity rated | ✅ PASS | Complexity 1, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | Short-track — no review run; 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS | All 6 ACs covered |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: ougl.1–7 code deps only. `schemaDepends: []` |
| H9 | Architecture constraints populated | ✅ PASS | Path traversal guard, server-side featureSlug, no partial write on 400 |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md present; NFR-sec-pathtraversal-owle, NFR-sec-serverside-slug |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling, no PII |
| H-NFR-profile | NFR profile presence | ✅ PASS | artefacts/2026-05-07-web-ui-outer-loop-extensions/nfr-profile.md exists |
| H-GOV | Approved By | ✅ PASS | Hamis — Platform operator / product owner — 2026-05-07 |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (N/A) | No new injectable adapters |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | NFR-sec-pathtraversal-owle, NFR-sec-serverside-slug in nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings | ✅ (N/A) | Short-track — no review run | — |
| W4 | Verification script reviewed | ✅ | Plain-language steps reviewed by Hamis | — |
| W5 | UNCERTAIN gaps | ✅ | None | — |

---

## Oversight Level

**Oversight:** Low
**Rationale:** Simple append-only write handler. Well-understood pattern (matches ougl.5 gate-confirm disk write). Path traversal guard is well-established in this codebase.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Decisions side-trip — artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.2-decisions-side-trip.md
Test plan: artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.2-test-plan.md

Goal:
Make every test in tests/check-owle2-decisions-side-trip.js pass (all currently fail).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Add handlePostDecisions to src/web-ui/routes/journey.js. Wire POST /api/journey/:id/decisions in server.js.
- featureSlug is derived server-side from the journey session. NEVER from the request body or URL params.
- Path traversal guard (AC5): path.resolve(repoRoot, 'artefacts', featureSlug, 'decisions.md') must start with repoRoot + path.sep. Return 400 if not.
- Validation (AC2): All four fields (title, context, decision, rationale) are required. Return 400 immediately if any is missing — do NOT write any file before validation passes.
- File creation (AC4): If the file does not exist, create it with a Markdown table header row before appending the entry.
- RISK-ACCEPT marker (AC6): If riskAccept:true in request body, append "[RISK-ACCEPT]" in the notes/type column of the row.
- Architecture: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required
