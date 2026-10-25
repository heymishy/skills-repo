# Definition of Ready: Self-service video capture per AC

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s5-video-capture.md
**Test plan reference:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s5-test-plan.md
**Contract proposal:** artefacts/2026-10-20-production-playback-capture/dor/ppc-s5-dor-contract.md
**Assessed by:** Claude (session)
**Date:** 2026-10-26

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 7 ACs. No mismatch found between the Contract Proposal and the story's own ACs/test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | Tenant Product Owner |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 7 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1–AC7 all covered, `ppc-s5-test-plan.md` |
| H4 | Out-of-scope populated | ✅ | 4 named exclusions |
| H5 | Benefit linkage references a named metric | ✅ | m1, m3 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | `/review` Run 2 — PASS, 0 HIGH, 0 MEDIUM |
| H8 | No uncovered ACs in test plan | ✅ | No gap-table entries |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` declared — dependency is on `ppc-s1`/`ppc-s2`'s shipped code path, not a `pipeline-state.schema.json` field |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-018, ADR-025 named; `/review` Run 2 Category E score 5 |
| H-E2E | Layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ | AC6/AC7 are CSS-layout-dependent, covered by 2 new Playwright E2E tests — tooling already configured (ADR-018), no RISK-ACCEPT needed |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-20-production-playback-capture/nfr-profile.md` |
| H-NFR2 | Compliance NFR with named clause has human sign-off | ✅ (N/A) | No compliance framework applies to this feature |
| H-NFR3 | Data classification not blank | ✅ | "Confidential" |
| H-NFR-profile | NFR profile presence (story declares NFRs) | ✅ | Profile exists and includes `ppc-s5` rows |
| H-GOV | Discovery `## Approved By` has ≥1 non-blank, non-engineering-only entry | ✅ | "Hamish King — Platform Owner — 2026-10-21" — positive M1 signal (clearly non-engineering role) |
| H-ADAPTER | New injectable adapter requires a wiring AC | ✅ (N/A) | No new adapter introduced — confirmed by reading `src/utils/capture-screenshots.js` and `src/web-ui/adapters/session-page-adapter.js` directly; this story reuses the latter's existing, already-wired adapter as-is (see story's own Background correction) |
| H-INF | Infra-plan gate | ✅ (N/A) | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ (N/A) | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance | ✅ | `node scripts/check-design-tokens.js` run against both real touch points (`playback-evidence.js`, `journey-store-pg.js`) — PASS on both. One pre-existing violation found and fixed in this session (`playback-evidence.js`'s `#ddd` → `#E4E7EB`, see `decisions.md` 2026-10-26 DESIGN entry). New file `src/utils/capture-video.js` doesn't exist yet — will be scanned again at `/verify-completion` once written. |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified | ✅ | — | |
| W2 | Scope stability declared | ✅ | Stable | |
| W3 | MEDIUM review findings acknowledged | ✅ | `/review` Run 2 has 0 MEDIUM findings for `ppc-s5` | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No named second reviewer exists in this solo-operator repo — same standing acceptance as `ppc-s1`–`ppc-s4` (`decisions.md`, 2026-10-21/22) | RISK-ACCEPT — operator awareness stands in; verified instead at `/verify-completion` and via the written AC verification script at smoke-test time |
| W5 | No UNCERTAIN gap-table items | ✅ | Both gap-table entries (AC6/AC7 layout-dependence, no live-staging verification yet) have an explicit, non-UNCERTAIN mitigation | |

**Outstanding decision to log:** W4's RISK-ACCEPT — see `decisions.md` entry below (logged in this same DoR pass, not deferred).

---

## Oversight level

**Medium** (from parent epic `ppc-self-service-capture`) — tech lead awareness required before assigning. No named tech lead configured in this solo-operator repo (`context.yml`) — operator awareness stands in, same standing convention as `ppc-s1`–`ppc-s4`.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

These are appended to the Coding Agent Instructions block below.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Self-service video capture per AC — artefacts/2026-10-20-production-playback-capture/stories/ppc-s5-video-capture.md
Test plan: artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s5-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or structure
beyond what the tests and ACs specify.

Touch-points: src/utils/capture-video.js (new), src/web-ui/routes/playback-evidence.js,
src/web-ui/adapters/journey-store-pg.js, tests/check-ppc-s5-video-capture.js (new),
tests/e2e/ppc-s5-video-lazy-load.spec.js (new)

Do not modify: src/web-ui/adapters/session-page-adapter.js, src/utils/capture-screenshots.js,
src/web-ui/routes/playback.js, src/web-ui/utils/html-shell.js, src/web-ui/routes/products.js

Constraints:
- Plain Node.js, raw http.createServer, no Express, no new npm dependencies (web-ui-patterns.md)
- captureVideoRecording is a PLAIN extracted function (mirrors src/utils/capture-screenshots.js),
  NOT a D37 adapter — do not add a setX()/stub-throws wrapper for it
- Reuse the EXISTING session-page-adapter.js's setSessionPageAdapter seam for all test mocking —
  do not introduce a parallel mocking seam
- getAuthenticatedPage must be called exactly once per AC (AC3) — video capture reuses the
  SAME authed.browser the screenshot capture already obtained
- Every <video> element: preload="none", a poster attribute, explicit width/height (AC7)
- Video served only via the new tenant-scoped route — never via the existing untenanted
  /playback-media/ route (AC2)
- Architecture standards: read .github/architecture-guardrails.md before implementing —
  do not introduce anti-patterns or violate mandatory constraints/Active ADRs (ADR-018, ADR-025)
- Design system: this story is tagged hasDesignSystemTrack:true — no new hardcoded colors;
  run node scripts/check-design-tokens.js against every touched file before opening the PR
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing
  it and do not mark ready for review

## Applicable standards

### web-ui (.github/standards/web-ui/web-ui-patterns.md)
[Full text of web-ui-patterns.md is attached as-is per Standards injection — see that file
directly; key points most relevant to this story: Injectable adapter pattern (D37) — NOT
triggered here, see note above; Shared shell module rule — NOT touched by this story;
HTML render function unit test pattern — minimum coverage (happy path, XSS, empty/null) applies
to the new <video> render fragment's own attribute-rendering logic.]

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Operator awareness stands in for tech-lead sign-off (no named tech lead configured, solo-operator repo — same standing convention as `ppc-s1`–`ppc-s4`).
**Signed off by:** Pending — awaiting operator confirmation in chat.

**Definition of ready: PROCEED** (pending sign-off confirmation above)
