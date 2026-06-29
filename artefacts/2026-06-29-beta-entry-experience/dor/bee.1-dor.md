# Definition of Ready — bee.1 — Public landing page

**Story reference:** `artefacts/2026-06-29-beta-entry-experience/stories/bee.1.md`
**Test plan reference:** `artefacts/2026-06-29-beta-entry-experience/test-plans/bee.1-test-plan.md`
**Contract:** `artefacts/2026-06-29-beta-entry-experience/dor/bee.1-dor-contract.md`
**Assessed by:** /definition-of-ready skill (agent-auto)
**Date:** 2026-06-29

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So with named persona | ✅ | "As a beta developer visiting skills-framework.fly.dev for the first time" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | T1–T11 cover all 6 ACs; AC5 gap explicitly acknowledged in test plan gap table |
| H4 | Out-of-scope section populated | ✅ | 4 items: PostHog, styling polish, /about page, OAuth flow changes |
| H5 | Benefit linkage to named metric | ✅ | M3 (landing page conversion rate) and M1 (beta activation rate) named with mechanism sentences |
| H6 | Complexity rated | ✅ | Complexity: 1 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS — 0 HIGH, 1 MEDIUM resolved (AC5 testability fixed) |
| H8 | No uncovered ACs (or gaps acknowledged) | ✅ | AC5 gap (GET /journeys post-bee.2) acknowledged in gap table |
| H8-ext | Dependencies: None — schema check not required | ✅ | |
| H9 | Architecture Constraints populated; no Cat-E HIGH | ✅ | Node.js CJS, no Express, no npm deps, `__dirname` path guard, `req.session.accessToken` canonical, ADR-011 |
| H-E2E | No CSS-layout-dependent ACs | ✅ | All ACs verifiable via string assertions on handler output |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-06-29-beta-entry-experience/nfr-profile.md` |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | Non-regulated project |
| H-NFR3 | Data classification not blank | ✅ | Public (landing page HTML) |
| H-NFR-profile | Story NFRs present; NFR profile exists | ✅ | |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform operator / product owner — 2026-06-29 |
| H-ADAPTER | No injectable adapters introduced | ✅ | Static page handler; no external calls |
| H-INF | hasInfraTrack absent — skip | ✅ | |
| H-MIG | hasMigrationTrack absent — skip | ✅ | |

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1 | NFRs identified | ✅ | — |
| W2 | Scope stability: Stable | ✅ | — |
| W3 | MEDIUM findings resolved (not RISK-ACCEPT) | ✅ — AC5 fixed at review | — |
| W4 | Verification script reviewed by domain expert | ⚠️ — solo-operator self-review acknowledged | Hamish King — Platform operator — 2026-06-29 |
| W5 | No uncertain gaps | ✅ — AC5 gap clearly bounded | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: bee.1 — Public landing page
Story artefact: artefacts/2026-06-29-beta-entry-experience/stories/bee.1.md
Test plan: artefacts/2026-06-29-beta-entry-experience/test-plans/bee.1-test-plan.md
Test script: tests/check-bee1-landing-page.js
Contract: artefacts/2026-06-29-beta-entry-experience/dor/bee.1-dor-contract.md

Goal:
Make every test in tests/check-bee1-landing-page.js pass. Do not add scope,
behaviour, or structure beyond what the tests and ACs specify.

Implementation plan:
Task 1 — Create src/web-ui/routes/landing.js
  - Export handleLanding(req, res)
  - If req.session && req.session.accessToken: writeHead(302, { Location: '/journeys' }); end()
  - Otherwise: writeHead(200, { 'Content-Type': 'text/html' }); end(LANDING_HTML)
  - LANDING_HTML: inline string literal containing product name, skill session description,
    and <a href="/auth/github">Sign in with GitHub</a> CTA
  - No CDN CSS frameworks (Bootstrap, Tailwind, etc.) in HTML
  - No external network calls in handler
  - Path: if HTML is read from a file, use path.join(__dirname, '..', 'public', 'landing.html')
    — never derive path from request data

Task 2 — Wire GET / in src/web-ui/server.js
  - Add before the existing catch-all: else if (pathname === '/' && req.method === 'GET') { handleLanding(req, res); }
  - require('./routes/landing') at the top of server.js

Constraints:
- Node.js CommonJS only — require(), no import
- No Express — raw http.createServer dispatch chain
- Zero new npm dependencies
- req.session.accessToken is the canonical field — never req.session.token
- No path component derived from request data (req.url, req.params, req.query)
- No PostHog snippet in this story — that is bee.3
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment and do not mark ready for review

DoR grep check (must return zero results before PR opens):
  grep -rn "req\.session\.token[^A]" src/web-ui/

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required — Low oversight

---

## Inner coding loop

1. /branch-setup — create isolated worktree, verify clean baseline
2. /implementation-plan — write bite-sized task plan (Task 1 + Task 2 above)
3. /subagent-execution or /tdd per task
4. /verify-completion — run `node tests/check-bee1-landing-page.js` + walk through bee.1-verification.md
5. /branch-complete — open draft PR

After PR merges: run /definition-of-done for bee.1.
