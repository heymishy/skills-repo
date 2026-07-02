# Definition of Ready — lab-s2.3 — /welcome onboarding — first-login detection + plan selection redirect

**Story:** lab-s2.3
**Feature:** 2026-07-01-landing-auth-billing
**DoR run date:** 2026-07-01
**Review:** PASS — Run 1, 2026-07-01
**Test plan:** 11 tests covering 7 ACs (AC4 partial: content testable; visual layout RISK-ACCEPT)
**Verification script:** 7 scenarios (AC4 layout step marked 🔴 manual)

---

## Contract Proposal

See `dor/lab-s2.3-dor-contract.md` (approved).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. AC4 plan options content is unit-testable (DOM presence, no PLACEHOLDER); visual layout is RISK-ACCEPT with manual pre-launch check (lab-s3.5). AC5 is independently testable without live Stripe — just checks the HTML form action. Inter-story dependency on lab-s3.2 for AC5 full happy path is documented and acknowledged.

---

## Hard Block Checklist

| # | Check | Result | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | PASS | "As a new visitor / prospective user completing their first login…" |
| H2 | ≥3 ACs in Given / When / Then format | PASS | 7 ACs, all GWT |
| H3 | Every AC has at least one test | PASS | T1.1–T7.1, IT1/IT2 cover all ACs |
| H4 | Out-of-scope section populated | PASS | 5 explicit exclusions |
| H5 | Benefit linkage references named metrics | PASS | M1, M3, M4 |
| H6 | Complexity rated | PASS | Complexity: 2 |
| H7 | No unresolved HIGH findings | PASS | 0 HIGH findings |
| H8 | Test plan covers all ACs; gaps acknowledged | PASS | AC4 visual layout gap: RISK-ACCEPT; content presence testable |
| H8-ext | Cross-story schema dependency check | PASS | `schemaDepends: [dorStatus]` declared; field in schema |
| H9 | Architecture Constraints populated | PASS | D37 (user-flags injectable), ADR-011, no plan IDs hardcoded, B2 CSS-layout RISK-ACCEPT, canonical accessToken |
| H-E2E | CSS-layout ACs have RISK-ACCEPT | PASS | AC4 visual layout: RISK-ACCEPT in decisions.md; manual pre-launch check at lab-s3.5 |
| H-NFR | NFR profile exists | PASS | Confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses | PASS | None |
| H-NFR3 | Data classification not blank | PASS | Classified |
| H-NFR-profile | Story NFRs → NFR profile exists | PASS | Profile present |
| H-GOV | discovery.md Approved By | PASS | "Hamish King — Platform operator — 2026-07-01" |
| H-ADAPTER | Injectable adapters have wiring ACs | PASS | `user-flags.js` D37: stub throws; production wiring in server.js required touchpoint (separate task) |
| H-INF | Infra-plan gate | PASS | Not triggered |
| H-MIG | Migration-review gate | PASS | Not triggered |

**Hard blocks: 19/19 PASS**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | PASS — Plan ID placeholders, PostHog non-blocking |
| W2 | Scope stability declared | PASS — Stable |
| W3 | MEDIUM review findings acknowledged | PASS — All resolved |
| W4 | Verification script reviewed by domain expert | RISK-ACCEPT — Solo operator. Already logged. |
| W5 | No UNCERTAIN items in gap table | PASS — AC4 visual gap classified as RISK-ACCEPT, not UNCERTAIN |

---

## Oversight Level

**Low** — personal-scope project.

---

## Standards Injection

No `domain` field — skipped.

---

## ✅ Definition of Ready: PROCEED — lab-s2.3

Hard blocks: 19/19 passed
Warnings: W4 RISK-ACCEPT acknowledged
Oversight: Low
**Entry gate: lab-s1.3 must be signed-off before implementation begins. lab-s3.2 (Stripe Checkout) must be complete before AC5 full happy path can be verified end-to-end (AC5 HTML wiring is independently testable).**

---

## Coding Agent Instructions

**Story:** lab-s2.3 — /welcome onboarding — first-login detection + plan selection redirect
**Complexity:** 2 | **Oversight:** Low
**Entry gate:** lab-s1.3 DoR signed-off.

### What to build

**`src/web-ui/modules/user-flags.js`** — D37 injectable module:
- `getFirstLoginFlag(userId)` → boolean (checks `users.first_login` column or equivalent)
- `clearFirstLoginFlag(userId)` → marks first login as complete
- `setUserFlagsAdapter(impl)` — injectable; default stub throws

**`src/web-ui/templates/welcome.html`** — Plan selection page: "Welcome to the platform" greeting, plan options (names sourced from env/config — no PLACEHOLDER values in rendered output), each plan has a CTA form with `action="/billing/checkout" method="POST"` and a `<input type="hidden" name="planId" value="...">` field.

**Auth callback update** (`src/web-ui/routes/auth.js`): after session is created, call `getFirstLoginFlag(userId)` → if first login: set `firstLogin: true` on session, `clearFirstLoginFlag`, redirect to `/welcome`; else redirect to `/dashboard`.

**`GET /welcome` handler** in `src/web-ui/routes/public.js` (extend existing file): auth guard (no session → 302 /); check `req.session.firstLogin` — if false → 302 /dashboard; render welcome.html with plan options.

**PostHog**: fire `plan_selected` event with `{ planName }` when plan selection form is submitted (intercept POST or server-side before redirect to /billing/checkout).

### Required touchpoints

- `src/web-ui/modules/user-flags.js` — CREATE (getFirstLoginFlag, clearFirstLoginFlag, injectable)
- `src/web-ui/templates/welcome.html` — CREATE (plan selection page)
- `src/web-ui/routes/public.js` — MODIFY (add GET /welcome handler)
- `src/web-ui/routes/auth.js` — MODIFY (firstLogin detection in all provider callbacks)
- `src/web-ui/server.js` — MODIFY (register /welcome, wire user-flags adapter — separate task)

### MUST NOT touch

- Stripe Checkout session creation logic (lab-s3.2 scope)
- `src/web-ui/modules/password.js` (lab-s2.2 scope)
- Any OAuth provider adapter files (regression risk)

### Test runner

`node tests/check-lab-s2.3-welcome.js`

### Task order (implementation plan)

**Task 1:** Create `user-flags.js` — `getFirstLoginFlag`, `clearFirstLoginFlag`, injectable stub throwing default
**Task 2:** Create `welcome.html` — greeting, plan options from env vars, forms targeting POST /billing/checkout with planId hidden field
**Task 3:** Add `GET /welcome` handler to `routes/public.js` — auth guard, firstLogin check, render or redirect
**Task 4:** Update auth callbacks in `routes/auth.js` — firstLogin detection, redirect to /welcome vs /dashboard, PostHog plan_selected fire-and-forget
**Task 5 (separate D37 task):** Wire user-flags adapter in `server.js`, register /welcome route
**Task 6:** Run test suite — 0 failures

### Architecture constraints

- No plan IDs or plan names hardcoded — source from `process.env.STRIPE_PRICE_ID_STARTER` etc.; if env var contains `PLACEHOLDER`, do not render it as a visible plan option
- `user-flags.js` default stub MUST throw (D37) — not return `false` or `null`
- AC4 visual layout: RISK-ACCEPT — do NOT add CSS breakpoint assertions to the test
- PostHog `plan_selected` must be fire-and-forget (no await in response path)

### Inner loop order

0. /decisions — no additional RISK-ACCEPTs
1. /branch-setup
2. /implementation-plan — 6 tasks as above
3. /subagent-execution or /tdd per task
4. /verify-completion — `node tests/check-lab-s2.3-welcome.js` 0 failures
5. /branch-complete
