# Definition of Ready: Record an in-app sign-off decision on captured evidence

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s7-sign-off-recording.md
**Test plan reference:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s7-test-plan.md
**Contract proposal:** artefacts/2026-10-20-production-playback-capture/dor/ppc-s7-dor-contract.md
**Assessed by:** Claude (session)
**Date:** 2026-10-26

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 6 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | Tenant Product Owner |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1–AC6 all covered, `ppc-s7-test-plan.md` |
| H4 | Out-of-scope populated | ✅ | 4 named exclusions |
| H5 | Benefit linkage references a named metric | ✅ | m1, m2 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | `/review` Run 2 — PASS, 0 HIGH, 0 MEDIUM |
| H8 | No uncovered ACs in test plan | ✅ | No gap-table entries — "No gaps" stated |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` declared |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | identity pattern, JSONB allowlist, ADR-025, `DESIGN.md`, MC-SEC-01 all named; `/review` Run 2 Category E score 5 |
| H-E2E | Layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ (N/A) | No AC is CSS-layout-dependent (`hasLayoutDependentGaps: false`) |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` includes `ppc-s7` rows |
| H-NFR2 | Compliance NFR human sign-off | ✅ (N/A) | No compliance framework applies |
| H-NFR3 | Data classification not blank | ✅ | "Confidential" |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | Discovery `## Approved By` | ✅ | "Hamish King — Platform Owner — 2026-10-21" — positive M1 signal |
| H-ADAPTER | New adapter wiring AC | ✅ (N/A) | No new injectable adapter — identity resolution is a direct session-field read, journey write reuses the existing `journeys.data` JSONB path |
| H-INF | Infra-plan gate | ✅ (N/A) | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ (N/A) | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance | ✅ | `node scripts/check-design-tokens.js` run against both real touch points (`playback-evidence.js`, `journey-store-pg.js`) — PASS on both |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified | ✅ | — | |
| W2 | Scope stability declared | ✅ | Stable | |
| W3 | MEDIUM review findings acknowledged | ✅ | `/review` Run 2 has 0 MEDIUM findings for `ppc-s7` | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Same standing gap as `ppc-s1`–`ppc-s6` — no second reviewer in this solo-operator repo | RISK-ACCEPT — see consolidated `decisions.md` entry below |
| W5 | No UNCERTAIN gap-table items | ✅ | "No gaps" stated in the test plan | |

---

## Oversight level

**Medium** (from parent epic) — operator awareness stands in for tech-lead sign-off.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Record an in-app sign-off decision on captured evidence — artefacts/2026-10-20-production-playback-capture/stories/ppc-s7-sign-off-recording.md
Test plan: artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s7-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or structure
beyond what the tests and ACs specify.

Touch-points: src/web-ui/routes/playback-evidence.js, src/web-ui/adapters/journey-store-pg.js,
tests/check-ppc-s7-sign-off-recording.js (new)

Do not modify: src/web-ui/routes/admin-credits.js, src/web-ui/adapters/session-page-adapter.js,
src/web-ui/modules/journey-store.js

Constraints:
- Identity resolution: req.session.login || req.session.userId — NEVER req.session.accessToken
  (CLAUDE.md canonical-field rule; grep check at review time: grep -rn "req\.session\.token[^A]" src/web-ui/)
- The free-text comment field MUST be passed through escHtml() before being rendered back —
  this is a hard requirement (MC-SEC-01), not optional polish
- "Approve" uses the primary button variant; "Needs changes" uses the destructive variant
  (per DESIGN.md) — do not ship unstyled or ambiguous buttons
- The recorded decision badge uses the --success/--danger tokens, consistent with this
  system's "badges for status only" convention
- journeys.data.signOff must be added to journey-store-pg.js's _sanitise() allowlist (fdn-s1
  rule) or it will silently vanish after a Postgres-backed restart
- A stale decision (recorded against fewer ACs than currently captured) must stay visible but
  explicitly show the coverage snapshot it was recorded against — never silently implying it
  covers newer evidence
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Design system: this story is tagged hasDesignSystemTrack:true — no new hardcoded colors;
  run node scripts/check-design-tokens.js against every touched file before opening the PR
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing
  it and do not mark ready for review

## Applicable standards

### web-ui (.github/standards/web-ui/web-ui-patterns.md)
[Full text attached as-is per Standards injection. Most directly relevant sections: "Session
token access" (the req.session.accessToken prohibition above is a direct instance of this
rule); "HTML render function unit test pattern" (XSS-injection + empty/null coverage, already
in the test plan).]

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Operator awareness stands in for tech-lead sign-off.
**Signed off by:** Pending — awaiting operator confirmation in chat.

**Definition of ready: PROCEED** (pending sign-off confirmation above)
