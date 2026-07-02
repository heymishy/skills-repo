# Decisions — Landing Site, Multi-Provider Auth, and Billing

**Feature:** 2026-07-01-landing-auth-billing
**Created:** 2026-07-01
**Maintained by:** Hamish King

---

## Decision Log

### ARCH-001: Slicing strategy — Risk-first

**Date:** 2026-07-01
**Context:** The discovery identified a known ESM/CJS incompatibility between the server runtime (CommonJS, no `"type"` field in `package.json`) and Better Auth (requires ESM via its `jose` dependency). This incompatibility blocks all auth stories. The landing page and billing data model have no dependency on the auth choice.
**Decision:** Risk-first slicing. The auth tech spike (lab-s1.1) is story 1. All auth implementation stories are BLOCKED until the spike delivers a path recommendation (A, B, or C). Landing page can proceed in parallel. Billing data model can begin before auth is settled but cannot wire the plan-selection step until auth is in place.
**Rationale:** The spike result determines the architecture of 4 stories (s1.3, s2.1, s2.2, s2.3). Delivering these before the spike wastes rework. The spike is a 1-day time-box with a hard exit deliverable — no open-ended investigation.

---

### ARCH-002: Better Auth path — Path C chosen (roll-your-own OAuth via fetch())

**Date:** 2026-07-01 (opened) / 2026-07-02 (resolved by lab-s1.1 spike exit)
**Context:** Three paths exist for resolving the ESM/CJS incompatibility with Better Auth:
- Path A: Dynamic `import()` wrapper — keep server CJS, wrap Better Auth calls behind async `import()` at the auth boundary
- Path B: Full ESM migration — add `"type": "module"` to `package.json`, convert all `require()` to `import`, replace `__dirname`/`__filename` with `import.meta.url`
- Path C: Roll-your-own thin provider abstraction — implement multi-provider OAuth directly using `fetch()` calls, extending the existing `oauth-adapter.js` pattern, staying entirely CJS with no new npm packages for auth
**Decision:** **Path C — roll-your-own OAuth abstraction using `fetch()`.** The existing `src/web-ui/auth/oauth-adapter.js` already implements GitHub OAuth via `fetch()` and is working in production. Extending this pattern to additional providers (Google, GitLab) costs roughly one adapter module per provider with zero new npm dependencies. Path A was rejected because `better-auth` is not in `package.json` and introduces ESM interop complexity for no MVP-required features. Path B was rejected because it requires migrating 200 `require()` call sites across 48 files (estimated 2–3 operator days) with no proportional benefit once Path C is viable.
**Rationale:** Path C is the lowest-risk, lowest-cost path for MVP multi-provider OAuth. It preserves the CJS runtime, the existing session schema, and the established `fetch()`-based adapter pattern. See full spike outcome at `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md`.

---

### ARCH-003: Session schema migration strategy — forced re-auth on first post-migration login

**Date:** 2026-07-01
**Context:** If the spike chooses Path A or B (Better Auth), Better Auth introduces its own `user`/`session`/`account` Postgres tables with a different user ID namespace from the current GitHub numeric user ID stored in Redis sessions. If Path C is chosen, this problem is avoided entirely as the current session shape is preserved.
**Decision (for paths A/B):** Forced re-auth for existing users on first post-migration login. This is simpler than a transparent session-mapping layer and is acceptable because: (1) there are no existing beta users at migration time, so the population affected is zero. (2) Even if there were users, announcing "please log in again" is a reasonable request after an auth system migration. The constraint is documented at story-level AC in s1.3 (auth provider registry story) — it is not an implementation detail to defer.
**Decision (for path C):** No migration concern. Current session shape is preserved.

---

### SCOPE-001: Exact pricing tiers and credit rates — deferred to pre-launch Stripe configuration

**Date:** 2026-07-01
**Context:** The discovery explicitly defers pricing model definition. The implementation uses `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` env vars validated absent in the pre-launch smoke test.
**Decision:** Plan IDs and credit rates are Stripe dashboard configuration, not code constants. Story s3.2 (Stripe Checkout) wires the checkout flow using env-var-sourced price IDs. Story s3.5 (pre-launch checklist) validates all placeholders are replaced with live Stripe values before go-live.
**Rationale:** Changing pricing must not require a code deploy. This is a named constraint from the discovery.

---

### SCOPE-002: Free tier — deferred

**Date:** 2026-07-01
**Context:** Whether a free plan exists and what its credit limit is was explicitly deferred in the discovery.
**Decision:** No free tier in MVP. The billing architecture supports a zero-cost plan (Stripe free price = $0) but MVP does not define one. Post-MVP decision.

---

### SCOPE-003: Email notifications — deferred

**Date:** 2026-07-01
**Context:** Plan upgrade confirmation, low-credit warnings, and payment failure alerts were explicitly deferred in the discovery.
**Decision:** Stripe sends its own transactional payment emails. No custom platform email notifications in MVP.

---

### TRIGGERED CONSTRAINT REGISTER (Step 4a)

_Populated after stories are written. No regulated constraints identified in discovery constraints section — no PCI DSS, GDPR, or other compliance framework references. Stripe handles cardholder data; platform is out of PCI scope._

---

## W4 RISK-ACCEPT

Solo operator posture per `.github/architecture-guardrails.md` Operating Posture section. W4 (no second reviewer) is the standard posture for this repository. Risk accepted for all stories in this feature.
