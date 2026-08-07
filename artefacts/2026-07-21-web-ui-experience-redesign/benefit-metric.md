# Benefit Metric Template

## Benefit Metric: Web UI Experience Redesign — Product View, Navigation, Settings, and Admin Impersonation

**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md` (Approved 2026-07-21)
**Date defined:** 2026-07-21
**Metric owner:** Hamish King — Founder/Operator
<!-- Solo-operator platform: no separate non-engineering role exists today. Noted explicitly rather than fabricating a role that doesn't exist. -->
**Reviewers:** Hamish King — Founder/Operator
<!-- Same constraint as above — no second reviewer currently exists on this platform. -->

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this is real product feature delivery, not a tooling/process pilot. Standard product metrics only.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Time to identify the least-healthy area of a large product

| Field | Value |
|-------|-------|
| **What we measure** | Wall-clock time from landing on a product's view to correctly naming its least-healthy module |
| **Baseline** | Not yet established — no product has been used at 115-story scale before this session; qualitatively, the flat-list view was described as "hard to understand" on first encountering it at that scale |
| **Target** | Under 10 seconds |
| **Minimum validation signal** | Under 30 seconds — still a clear improvement over the flat-list baseline even if not hitting the full target |
| **Measurement method** | Manual timed walkthrough performed by the operator at Definition-of-Done verification for Epic A; repeated once after real usage to confirm it holds outside a first-look demo |
| **Feedback loop** | If signal is not met, Epic A's Modules/health-gauge layout needs a design revision before DoD — the operator (sole decision-maker) decides whether to iterate the layout or accept a documented gap |

### Metric 2: Navigation dead-link rate

| Field | Value |
|-------|-------|
| **What we measure** | Fraction of `NAV_ITEMS` entries in `src/web-ui/utils/html-shell.js` whose `href` resolves to a route no longer registered in `server.js` |
| **Baseline** | 50% (3 of 6 items: Features, Actions, Status — confirmed removed by `kbc-s1`) |
| **Target** | 0% |
| **Minimum validation signal** | 0% — this metric is binary; there is no acceptable partial state for a dead link in production navigation |
| **Measurement method** | A dedicated test (new, part of Epic B) asserting every `NAV_ITEMS` href matches a route registered in `server.js`'s dispatch chain — extending this repo's own established dangling-reference-sweep pattern from `kbc-s1`'s AC5 |
| **Feedback loop** | If the test ever fails again in future (e.g. a future story removes a route the nav still points to), CI blocks the merge — this metric is enforced structurally, not just measured once |

### Metric 3: Settings/account discoverability

| Field | Value |
|-------|-------|
| **What we measure** | Fraction of account-related routes (Settings/Profile, Billing, admin Credits) reachable via a real click path from the dashboard, for the user role each applies to |
| **Baseline** | 0% — all three routes exist only as bare URLs today; nothing in the app links to any of them |
| **Target** | 100% |
| **Minimum validation signal** | 100% for Settings/Profile and Billing (every signed-in user); Credits reachability is conditional on admin role by design, not a partial-signal case |
| **Measurement method** | A Playwright e2e test asserting each route is reachable via a real click path starting from `/dashboard`, run once as a regular user and once as an admin |
| **Feedback loop** | If a route is unreachable for its intended role, this blocks Epic C's Definition of Done — the nav/settings wiring is incomplete, not a cosmetic gap |

### Metric 4: Impersonation audit completeness

| Field | Value |
|-------|-------|
| **What we measure** | Fraction of impersonation start/end events that produce a corresponding audit log entry |
| **Baseline** | 0% — no impersonation capability exists today, so no audit trail exists |
| **Target** | 100% — no code path can start or end a session without logging it |
| **Minimum validation signal** | 100% — there is no acceptable partial state for an unlogged impersonation session; this is treated as a hard invariant, not a directional metric |
| **Measurement method** | A dedicated integration test on the impersonation route handler asserting the invariant directly (e.g. attempting to bypass the audit-write path and confirming the session cannot start), not merely that a UI element renders |
| **Feedback loop** | Any gap here blocks Epic D's Definition of Ready — per discovery's flagged highest risk, this is not negotiable scope |

---

## Tier 3: Risk & Control Metrics

<!-- This platform is not formally regulated (context.yml: regulated: false), and no compliance
     framework applies. This section is included because Epic D (Admin User Impersonation) is a
     genuine operational/security risk-reduction feature per the benefit-metric skill's own Tier 3
     criteria, not because a compliance obligation exists. -->

### Risk metric: Privilege leakage during impersonation

| Field | Value |
|-------|-------|
| **Obligation / risk source** | Discovery's highest-flagged risk: an admin impersonating a lower-privileged user must never retain any residual real-admin capability during that session |
| **Metric** | Number of admin-only UI surfaces (nav items, settings tabs, API routes) reachable while impersonating a non-admin target user |
| **Target** | 0 — binary, met or not met |
| **Validated by** | Hamish King — Founder/Operator (no separate security reviewer exists; this repo's own established review patterns — D37 injectable adapters, D40 conflict-marker checks — are the closest analogue for rigor, applied here by the same operator) |
| **Sign-off required at DoR** | Yes — Epic D's Definition of Ready must include an explicit NFR-security review confirming this metric, not just a story sign-off |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Time to identify least-healthy area of a large product | a1, a2, a3, a4 (a5 supports completeness of the picture but doesn't directly move this metric) | Covered |
| Navigation dead-link rate | b1, b2 | Covered |
| Settings/account discoverability | c1, c2, c3 | Covered |
| Impersonation audit completeness | d1 (writes the entry), d3 (makes it viewable) | Covered |
| Privilege leakage during impersonation (risk metric) | d2 (implements the property), d4 (verifies it holds) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
