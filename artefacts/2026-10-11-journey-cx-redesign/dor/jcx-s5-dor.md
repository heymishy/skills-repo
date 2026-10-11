# Definition of Ready Checklist

## Definition of Ready: Authorization and tenant-scoping verification across the placeholder-trigger and mapping-conversion surface

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s5.md
**Test plan reference:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s5-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01QZrWGeUJn2RfzDjVPZFwLC)
**Date:** 2026-10-11

---

## Contract Proposal

**What will be built:**
Integration tests only — no new production code. Confirms `jcx-s1`'s and `jcx-s2`'s own already-built routes correctly deny cross-tenant access (404) and viewer-role mutation (403), via real mock-pool call-count assertions and a real `server.js` router dispatch with a seeded viewer-role session (reusing `check-vrne-s4-edge-case-gate.js`'s own established harness).

**What will NOT be built:**
A new permission tier (explicitly ruled out at `/clarify`). Rate-limiting or abuse prevention.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mock-pool cross-tenant 404 + zero-INSERT assertion | integration |
| AC2 | Mock-pool cross-tenant 404 + no-folder/no-state assertion | integration |
| AC3 | Real `server.js` router dispatch, seeded viewer-role session, 403 assertion | integration |
| AC4 | Mock-pool cross-tenant 404 + unchanged-state assertion | integration |
| AC5 | Full suite run at merge (DoD-level check, not a dedicated new test — per `/review` finding 1-L1) | — |

**Assumptions:**
`jcx-s1` and `jcx-s2` are both merged before this story's own tests can run for real against their routes — reflected in Dependencies below.

**Estimated touch points:**
Files: `tests/check-jcx-s5-authorization.js` (new)
Services: None
APIs: None new — verification-only story.

---

## Contract Review

✅ **Contract review passed** — proposed implementation (verification tests only, no new production code) aligns with all 5 ACs and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | Confirmed against `jcx-s5-test-plan.md`'s own AC coverage table |
| H4 | Out-of-scope section populated | ✅ | 2 items |
| H5 | Benefit linkage references a named metric | ✅ | M2 |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/jcx-s5-review-1.md` — PASS, 0 HIGH/MEDIUM, 1 LOW (retrospective-only, no action) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `dorStatus` — dependencies `jcx-s1` and `jcx-s2` both show `dorStatus: "signed-off"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites ADR-025, D13, the `check-vrne-s4-edge-case-gate.js` real-dispatch precedent |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC in this story is layout/position-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-11-journey-cx-redesign/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — "Hamish King — Platform Owner — 2026-10-11" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter — verification-only story |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema change |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | None (0 MEDIUM) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet reviewed; same established pattern | Hamish King (acknowledged, proceeding) |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps at all | — |

---

## Standards injection

**Domain tags:** `[web-ui, security]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/security/security-standards.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- No new sections — this story verifies `jcx-s1`/`jcx-s2`'s own already-cited patterns, introduces nothing new.

### .github/standards/security/security-standards.md (matched domain: security)

[Relevant sections for this story:]

- **"Access control: Deny by default. Permissions checked at service layer"** — directly matches this story's own entire purpose; confirms `requireNonViewer` and tenant-scoping are genuinely checked at the route-dispatch layer, not merely assumed from the handler.
- **"Logging: Security events logged (auth failures, access denials)"** — relevant to this story's own Audit NFR ("denied cross-tenant/viewer-role attempts should be observable in the same logging convention every other denied mutating route already uses").
- **"Injection: Parameterised queries only"** — already satisfied by `jcx-s1`/`jcx-s2`'s own use of `$1`/`$2` placeholders throughout (confirmed by direct code reading during story-writing); this story's own tests do not introduce any new query pattern.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Authorization and tenant-scoping verification across the placeholder-trigger and mapping-conversion surface -- artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s5.md
Test plan: artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s5-test-plan.md

Goal:
Make every test in the test plan pass (4 tests, all integration). Do
not add scope, behaviour, or structure beyond what the tests and ACs
specify.

Constraints:
- This story has NO new production code -- do not build a new
  permission tier or any new route. If a test fails because jcx-s1/
  jcx-s2's own routes are genuinely missing the expected
  authorization check, FIX that gap in jcx-s1/jcx-s2's own code (the
  exact class of fix ic-s2's own DoD made for its position route) --
  do not work around it with a new mechanism here.
- AC3's viewer-role test MUST use a real server.js router dispatch
  with a seeded session (reusing check-vrne-s4-edge-case-gate.js's
  own harness verbatim) -- a handler-level unit test alone cannot
  observe whether requireNonViewer is actually wired in server.js's
  own route chain, which is the exact gap this story exists to catch.
- Use a session id distinct from any other test's own hardcoded id,
  and HEX-ONLY (confirmed gotcha from this session's own
  workspace/learnings.md: _parseSessionId only matches [a-f0-9]+).
- Architecture standards: read .github/architecture-guardrails.md and
  .github/standards/security/security-standards.md before
  implementing.
- Open a draft PR when all tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for
  review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — tech lead awareness only.
**Signed off by:** Not required. Shared with Hamish King — Platform Owner (acting tech lead for this feature) — 2026-10-11.
