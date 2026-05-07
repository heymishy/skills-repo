# Definition of Ready: Spike side-trip (owle.5)

**Story reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.5-spike-side-trip.md
**Test plan reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.5-test-plan.md
**Verification script:** artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.5-test-plan.md (plain-language section)
**Review report:** Short-track — no formal review run. Zero HIGH findings.
**NFR profile:** artefacts/2026-05-07-web-ui-outer-loop-extensions/nfr-profile.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-08

---

## Contract Proposal

**What will be built:**
- `POST /api/journey/:id/spikes` handler: accepts `{ title }` body; derives `titleSlug` server-side (lower-case, spaces → hyphens, non-alphanumeric stripped, `.` and `/` and `\` stripped, `..` sequences removed); derives write path as `artefacts/<featureSlug>/spikes/<titleSlug>-spike.md`; validates BOTH featureSlug component and titleSlug component against repoRoot (path traversal guard); returns 409 if file already exists; creates spike file with OPEN status and title; returns 201 with `{ spikeSlug, path }`.
- `PATCH /api/journey/:id/spikes/:slug` handler: accepts `{ outcome }` body where outcome ∈ {PROCEED, REDESIGN, DEFER}; reads the existing spike file; writes outcome into the file (read-modify-write); returns 200.
- Stage-controls: `spikeAvailable: true` at ALL stages.
- Wire routes in `server.js`.

**What will NOT be built:**
- Listing existing spikes.
- Deleting spikes.
- Accepting featureSlug or titleSlug from the client.
- Auto-applying spike outcomes to the journey.

**How each AC will be verified:**

| AC | Test | Type |
|----|------|------|
| AC1 — creates spike file | T1: POST /spikes with valid title, assert file created at derived path | Integration |
| AC2 — 409 on duplicate | T2: POST same title twice, assert second returns 409 + no overwrite | Integration |
| AC3 — outcome update | T3: PATCH /spikes/:slug with outcome:PROCEED, assert file contains outcome | Integration |
| AC4 — invalid outcome | T4: PATCH with outcome:INVALID, assert 400 | Unit |
| AC5 — spikeAvailable at all stages | T5: stage-controls at 3 stages, assert spikeAvailable:true | Unit |
| AC6 — path traversal blocked (featureSlug) | T6: featureSlug containing ../.. in session, assert 400 + no file | Security |
| AC7 — path traversal blocked (titleSlug) | T7: title '../../etc/passwd', assert 400 or slug sanitised to safe value | Security |
| AC8 — server-side slug derivation | T8: title 'Hello World!', assert slug is 'hello-world' (special chars stripped) | Unit |

**Assumptions:**
- `featureSlug` is stored on the journey session (set at creation).
- `crypto.randomUUID()` or a similar function is NOT needed — the slug is derived from the title.
- Spike file template: `# Spike: <title>\n\n**Status:** OPEN\n\n## Question\n\n[To be filled in]\n\n## Outcome\n\n[Pending]`.

**Estimated touchpoints:**
- `src/web-ui/routes/journey.js` — add `handlePostSpike`, `handlePatchSpikeOutcome`, `spikeAvailable` in stage-controls
- `src/web-ui/server.js` — wire POST and PATCH routes

---

## Contract Review

✅ **Contract review passed** — both featureSlug and titleSlug components validated independently against repoRoot. No overwrite on duplicate (409). Server-side slug derivation prevents injection. Read-modify-write on PATCH (AC3) is safe since spike files are small JSON-agnostic Markdown.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As an **operator at any pipeline stage**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 8 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T1–T8 cover all 8 ACs |
| H4 | Out-of-scope populated | ✅ PASS | Listing, deletion, client-supplied slugs, auto-apply excluded |
| H5 | Benefit linkage | ✅ PASS | "Spike artefact completeness" named |
| H6 | Complexity rated | ✅ PASS | Complexity 2, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | Short-track — no review run; 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS | All 8 ACs covered |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: ougl.1–7 code deps only. `schemaDepends: []` |
| H9 | Architecture constraints populated | ✅ PASS | Dual path traversal guard, server-side slug, no overwrite on duplicate |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md present; NFR-sec-pathtraversal-owle, NFR-sec-spike-slug-sanitise |
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
| W1 | NFRs identified | ✅ | NFR-sec-pathtraversal-owle, NFR-sec-spike-slug-sanitise in nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings | ✅ (N/A) | Short-track — no review run | — |
| W4 | Verification script reviewed | ✅ | Plain-language steps reviewed by Hamis | — |
| W5 | UNCERTAIN gaps | ✅ | None | — |

---

## Oversight Level

**Oversight:** Medium
**Rationale:** Dual path traversal risk (featureSlug AND titleSlug). Both components must be independently validated. The slug sanitisation logic for titleSlug is new and must be explicitly tested.

⚠️ **Medium oversight** — solo repo: operator (Hamis) self-confirms before dispatch.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Spike side-trip — artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.5-spike-side-trip.md
Test plan: artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.5-test-plan.md

Goal:
Make every test in tests/check-owle5-spike-side-trip.js pass (all currently fail).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Add handlePostSpike and handlePatchSpikeOutcome to src/web-ui/routes/journey.js. Wire in server.js.
- CRITICAL — slug derivation (AC8): titleSlug = title.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''). This must happen server-side ONLY.
- CRITICAL — dual path traversal guard: validate path.resolve(repoRoot, 'artefacts', featureSlug, 'spikes', titleSlug + '-spike.md') starts with repoRoot + path.sep. Return 400 if not. This must check the COMBINED path, not each component separately.
- 409 on duplicate: check fs.existsSync before writing. Return 409 if file exists.
- Valid outcomes for PATCH: 'PROCEED', 'REDESIGN', 'DEFER' only. Return 400 for other values.
- PATCH is read-modify-write: read existing file, replace the 'Outcome' section, write back.
- spikeAvailable:true at ALL stages.
- For test isolation, export setRepoRoot(fn) from journey.js.
- Open a draft PR when tests pass — do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Self-confirm (solo repo)
**Signed off by:** Hamis — 2026-05-08
