# Definition of Ready — lab-s1.2 — Landing page at `/`

**Story:** lab-s1.2
**Feature:** 2026-07-01-landing-auth-billing
**DoR run date:** 2026-07-01
**Review:** PASS — Run 1, 2026-07-01
**Test plan:** 9 tests covering 6 ACs (AC5 manual RISK-ACCEPT)
**Verification script:** 6 scenarios (AC5 marked 🔴 manual)

---

## Contract Proposal

See `dor/lab-s1.2-dor-contract.md` (approved).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. AC5 (responsive layout) is correctly classified as a CSS-layout-dependent AC with an existing RISK-ACCEPT in decisions.md. Unit tests cover all remaining ACs. PostHog fire-and-forget matches AC4.

---

## Hard Block Checklist

| # | Check | Result | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | PASS | "As a new visitor / prospective user…" |
| H2 | ≥3 ACs in Given / When / Then format | PASS | 6 ACs, all GWT |
| H3 | Every AC has at least one test in the test plan | PASS | All ACs covered; AC5 gap explicitly acknowledged |
| H4 | Out-of-scope section populated | PASS | 6 explicit exclusions |
| H5 | Benefit linkage references a named metric | PASS | M1 — self-serve signup conversion |
| H6 | Complexity rated | PASS | Complexity: 1 |
| H7 | No unresolved HIGH findings from review | PASS | Review: PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs (or gaps acknowledged) | PASS | AC5 CSS-layout gap: RISK-ACCEPT, documented in gap table |
| H8-ext | Cross-story schema dependency check | PASS | No upstream story dependencies — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | PASS | ADR-011, CJS-only, B2 CSS-layout RISK-ACCEPT, canonical session field documented |
| H-E2E | CSS-layout-dependent ACs have RISK-ACCEPT or E2E spec | PASS | AC5 has RISK-ACCEPT in decisions.md (W4 pattern + B2) |
| H-NFR | NFR profile exists | PASS | `artefacts/2026-07-01-landing-auth-billing/nfr-profile.md` confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | PASS | No regulatory clauses |
| H-NFR3 | Data classification not blank | PASS | Classified in NFR profile |
| H-NFR-profile | Story NFRs → NFR profile exists | PASS | Profile present |
| H-GOV | discovery.md `## Approved By` has named entry | PASS | "Hamish King — Platform operator — 2026-07-01" |
| H-ADAPTER | Injectable adapters have wiring ACs | PASS | No new injectable adapters — PostHog uses existing adapter |
| H-INF | Infra-plan gate | PASS | Not triggered |
| H-MIG | Migration-review gate | PASS | Not triggered |

**Hard blocks: 19/19 PASS**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | PASS — Two NFRs: no accessToken in HTML, PostHog non-blocking |
| W2 | Scope stability declared | PASS — Stable |
| W3 | MEDIUM review findings acknowledged | PASS — All 4 MEDIUM findings resolved |
| W4 | Verification script reviewed by domain expert | RISK-ACCEPT — Solo operator. Already logged in decisions.md. |
| W5 | No UNCERTAIN items in test plan gap table | PASS — AC5 gap classified as RISK-ACCEPT (not UNCERTAIN) |

---

## Oversight Level

**Low** — personal-scope project. No second reviewer required.

---

## Standards Injection

No `domain` field on this story — skipped.

---

## ✅ Definition of Ready: PROCEED — lab-s1.2

Hard blocks: 19/19 passed
Warnings: W4 RISK-ACCEPT acknowledged
Oversight: Low

---

## Coding Agent Instructions

**Story:** lab-s1.2 — Landing page at `/`
**Complexity:** 1 | **Oversight:** Low

### What to build

Create `src/web-ui/routes/public.js` with a `GET /` handler that:
1. Checks `req.session.accessToken` — if present, respond 302 to `/dashboard`
2. Otherwise: render `src/web-ui/templates/landing.html` with HTTP 200
3. Fire `posthog-server.js` capture for `landing_page_viewed` event (fire-and-forget, do not await)

Create `src/web-ui/templates/landing.html` containing: a platform pitch headline, a value proposition paragraph, and a "Get started" CTA button/link with `href="/auth/github"`.

Register the route in `src/web-ui/server.js`.

### Required touchpoints

- `src/web-ui/routes/public.js` — CREATE (GET / handler)
- `src/web-ui/templates/landing.html` — CREATE (landing page HTML)
- `src/web-ui/server.js` — MODIFY (register GET /)

### MUST NOT touch

- `src/web-ui/routes/auth.js` — auth logic is out of scope for this story
- `posthog-server.js` — use existing adapter; do not modify it
- Any existing test files — regression: existing tests must continue to pass

### Test runner

`node tests/check-lab-s1.2-landing-page.js`

### Task order (implementation plan)

**Task 1:** Create `src/web-ui/templates/landing.html` — static HTML with headline, value prop, CTA `href="/auth/github"`
**Task 2:** Create `src/web-ui/routes/public.js` — GET / handler (auth check + render + PostHog fire-and-forget)
**Task 3:** Register route in `server.js` — `app.get('/', require('./routes/public').handleRoot)` or equivalent
**Task 4:** Run test runner — all 9 tests must pass

### Architecture constraints

- Use `req.session.accessToken` — never `req.session.token` (canonical field, CLAUDE.md)
- PostHog event must be fire-and-forget: call capture, do not `await` or `.then()` in the response path
- No `accessToken` or session values in any HTML rendered output (AC6)
- CJS-only: `require()`/`module.exports`
- AC5 (responsive layout) is RISK-ACCEPT — do not add CSS breakpoints as a test assertion

### Inner loop order

0. /decisions — no additional RISK-ACCEPTs required
1. /branch-setup
2. /implementation-plan — 4 tasks as above
3. /subagent-execution or /tdd per task
4. /verify-completion — `node tests/check-lab-s1.2-landing-page.js` must show 0 failures
5. /branch-complete
