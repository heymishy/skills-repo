# Definition of Ready — bee.2 — First-run empty-state experience

**Story reference:** `artefacts/2026-06-29-beta-entry-experience/stories/bee.2.md`
**Test plan reference:** `artefacts/2026-06-29-beta-entry-experience/test-plans/bee.2-test-plan.md`
**Contract:** `artefacts/2026-06-29-beta-entry-experience/dor/bee.2-dor-contract.md`
**Assessed by:** /definition-of-ready skill (agent-auto)
**Date:** 2026-06-29

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So with named persona | ✅ | "As a beta developer who has just logged in for the first time and has no journeys yet" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | T1–T12 cover all 5 ACs |
| H4 | Out-of-scope section populated | ✅ | 4 items: PostHog, interactive tutorial, dismiss mechanism, skill picker changes |
| H5 | Benefit linkage to named metric | ✅ | M1 (beta activation rate) and M2 (cross-tenant isolation) named |
| H6 | Complexity rated | ✅ | Complexity: 1 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS — 0 HIGH, 3 MEDIUM all resolved |
| H8 | No uncovered ACs (or gaps acknowledged) | ✅ | All 5 ACs covered; [journey-store] console.error gap noted with manual mitigation |
| H8-ext | Dependency on bee.1; schemaDepends: [] — no schema fields from upstream | ✅ | No pipeline-state schema fields consumed from bee.1 |
| H9 | Architecture Constraints populated; no Cat-E HIGH | ✅ | D37 (injectable adapter rule), accessToken canonical, no Express, no npm deps, ADR-011 |
| H-E2E | No CSS-layout-dependent ACs | ✅ | All ACs verifiable via string assertions or raw HTTP inspection |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-06-29-beta-entry-experience/nfr-profile.md` |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | |
| H-NFR3 | Data classification not blank | ✅ | Internal (authenticated dashboard) |
| H-NFR-profile | NFRs present; profile exists | ✅ | |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform operator / product owner — 2026-06-29 |
| H-ADAPTER | No new injectable adapter at story level (existing journeyStore.listJourneys used); setListJourneys is test-isolation wrapper — not a production adapter introduction | ✅ | Contract explicitly names this as implementation detail for test isolation only |
| H-INF | hasInfraTrack absent — skip | ✅ | |
| H-MIG | hasMigrationTrack absent — skip | ✅ | |

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1 | NFRs identified | ✅ | — |
| W2 | Scope stability: Stable | ✅ | — |
| W3 | MEDIUM findings resolved (not RISK-ACCEPT) | ✅ — AC3, AC4, AC5 all fixed | — |
| W4 | Verification script reviewed by domain expert | ⚠️ — solo-operator self-review acknowledged | Hamish King — Platform operator — 2026-06-29 |
| W5 | No uncertain gaps | ✅ | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: bee.2 — First-run empty-state experience
Story artefact: artefacts/2026-06-29-beta-entry-experience/stories/bee.2.md
Test plan: artefacts/2026-06-29-beta-entry-experience/test-plans/bee.2-test-plan.md
Test script: tests/check-bee2-empty-state.js
Contract: artefacts/2026-06-29-beta-entry-experience/dor/bee.2-dor-contract.md

Goal:
Make every test in tests/check-bee2-empty-state.js pass. Do not add scope,
behaviour, or structure beyond what the tests and ACs specify.

Implementation plan:
Task 1 — Add handleJourneys + setListJourneys to src/web-ui/routes/journey.js
  Export:
    - setListJourneys(fn): replaces the injectable function (default stub must throw)
    - handleJourneys(req, res): async handler
      - Calls listJourneys(req.session.tenantId || req.session.login)
      - Empty array: writeHead(200, {'Content-Type':'text/html'}); end(EMPTY_STATE_HTML)
      - Populated array: writeHead(200, ...); end(JOURNEY_LIST_HTML with one card per journey)
      - Throws: console.error('[journey-store]', err.message); writeHead(500, ...); end(ERROR_HTML)
  
  Empty-state HTML must contain:
    - Text explaining no skill sessions have been started yet
    - Description of what a skill session produces (e.g. "governed artefact")
    - <a href="/skills">Start a skill session</a> (or equivalent CTA)
  
  Journey list HTML must contain:
    - One element per journey with data-journey-id="[journey.id]" attribute

  Default stub:
    let _listJourneys = async () => {
      throw new Error('Adapter not wired: _listJourneys. Call setListJourneys() before use.');
    };

Task 2 — Wire GET /journeys in src/web-ui/server.js
  - Add: else if (pathname === '/journeys' && req.method === 'GET') {
      authGuard(req, res, async () => { await handleJourneys(req, res); });
    }
  - Import { handleJourneys, setListJourneys } from './routes/journey'
  
Task 3 — Production wiring of listJourneys adapter in server.js
  - In the NODE_ENV !== 'test' block:
    const journeyStore = require('./modules/journey-store');
    setListJourneys(async (tenantId) => journeyStore.listJourneys(tenantId || ''));
  - This is a SEPARATE task from Task 1 — name it distinctly in the implementation plan

Constraints:
- Node.js CommonJS — require(), not import
- No Express
- Zero new npm dependencies
- req.session.accessToken canonical — never req.session.token
- Server-side rendered HTML — no client-side JS for state detection
- D37: default stub for setListJourneys MUST throw (not return [] or null)
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass — do not mark ready for review

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
2. /implementation-plan — Task 1 (handler + setter), Task 2 (/journeys dispatch), Task 3 (production wiring) — name all three explicitly
3. /subagent-execution or /tdd per task
4. /verify-completion — run `node tests/check-bee2-empty-state.js` + walk through bee.2-verification.md
5. /branch-complete — open draft PR

After PR merges: run /definition-of-done for bee.2.
