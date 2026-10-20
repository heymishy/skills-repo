# Discovery: Production Playback Capture

> ⚠️ **SUPERSEDED — do not resume from this artefact.** Caught at `/definition` Step 3, 2026-10-21: this entire document is built around the wrong mechanism (an internal operator CLI tool with one synthetic capture tenant) when the actual requirement is a self-service, in-product, multi-tenant capability (every real tenant's own users triggering and viewing a playback of their own DoD-complete features). See `decisions.md`'s own 2026-10-21 CORRECTION entry for the full explanation of what survives and what doesn't. **Next session: restart `/discovery` from Section 1 with the corrected frame — do not patch this file.**

**Status:** Approved
**Created:** 2026-10-20
**Approved by:** Hamish King — Platform Owner — 2026-10-21
**Author:** Claude Sonnet 5 (session), with Hamish King

---

## Problem Statement

The real-playback-capture-automation mechanism built in a prior session (`rpca-s1`–`rpca-s5` + 4 hotfixes) only authenticates against `wuce-staging`, via a staging-only secret (`E2E_STAGING_AUTH_STUB_SECRET`) that is deliberately never present on production. So the mechanism — now proven correct against staging — still cannot capture real evidence for a feature once it's actually live on production (`wuce.fly.dev`), which is where a sponsor's real acceptance decision ultimately happens. The gap isn't technical readiness anymore (that's proven); it's that no production-safe, tenant-scoped authentication path exists for the capture CLI to use.

## Who It Affects

**Primary — Feature sponsors / business owners:** Same persona as the original epic's discovery. For a feature that's gone live on production, they'd want to review *real* production evidence (not a staging proxy) before signing off acceptance — staging data can differ from what real tenants actually see.

**Primary — The operator / engineer:** Currently has no automated way to capture production evidence at all; would fall back to the same manual Chrome-session toil this whole epic was built to eliminate, just for production instead of staging.

**Secondary — Security/compliance reviewer:** Newly relevant for this feature specifically (wasn't a persona in the staging-only discovery) — anyone who'd need to approve a production-reaching auth mechanism would want to understand its tenant-isolation and blast-radius properties before it exists.

## Why Now

The revisit trigger set in `artefacts/2026-10-19-real-playback-capture-automation/decisions.md` is now satisfied: "Once `rpca-s1`-`rpca-s4` are DoD-complete and the staging mechanism has been used for at least one real feature, scope the production fast-follow story." All five staging stories plus four hotfixes found by actually running the mechanism are DoD-complete, and the staging mechanism was just used end-to-end for a real feature (`journey-cx-redesign`) — proving the underlying approach (authenticate → drive real browser → capture → embed) is sound. The remaining gap (production-safe auth) is now the only thing separating "proven on staging" from "actually useful for real sponsor acceptance," which is the whole point this mechanism was built for.

## MVP Scope

1. No new auth-bypass route on production — reuses the real, existing login flow, the same path a real user goes through.
2. A dedicated, isolated "capture" tenant — not a real customer's tenant. Synthetic data only, created once, reused across capture runs. This bounds blast radius: even a fully compromised credential only ever grants access to synthetic demo data, never a real customer's.
3. The credential is a real account's password, stored only in a CI secrets store (GitHub Actions secret), fetched at capture-run time by CI — never typed into a human's shell, never in the agent's environment directly (per `product/constraints.md` #12).
4. The CLI runs only from CI for production specifically, never from an interactive agent session — removing the whole class of risk a prior session hit (an agent handling a credential directly, classifier blocks, local export friction).
5. Screenshot capture only for the MVP — video capture against production is deferred (see Out of Scope).
6. If any internal admin tooling lists tenants, the capture tenant is clearly labeled ("Internal — Capture/Demo, not billable") so staff never mistake it for a real customer.

## Out of Scope

1. **Video capture against production.** Deferred for this MVP — screenshot-only proves the production auth approach without the added question of whether a recording session risks surfacing real customer PII/financial data. A spike was run (`video-capture-library`, closed REDESIGN — see `artefacts/2026-10-20-production-playback-capture/spikes/video-capture-library-outcome.md`) and found a real, locally-runnable redaction pipeline (OCR + PII pattern-matching + `ffmpeg` blur execution, no hosted service) — but its real-world reliability is unproven; an OCR-based false negative is a genuine data-exposure risk, not a cosmetic miss. Production video capture becomes a follow-on story to this MVP once that pipeline is built and measured, gated by a mandatory human-verification step before any production video is ever saved or shared — not a fully-automated-and-trusted claim. **Revisit trigger:** the redaction pipeline is built and its real-world accuracy measured against production-shaped content (forms, tables, currency).
2. **Retrofitting production capture across existing already-shipped features.** Same boundary as the staging epic — this proves the mechanism for new features going forward, not a backfill campaign.
3. **An internal admin tenant-listing UI**, if one doesn't already exist — not building new admin tooling just to label a tenant; the labeling applies if/when such tooling exists.

## Assumptions and Risks

**Risks (confirmed, not hypothetical):**
- The `video-capture-library` spike found OCR-based redaction has a real false-negative risk (confirmed via practitioner reports, not assumed) — this is why production video stays deferred behind a build-and-measure story with a mandatory human-verification gate, not treated as solved.
- The capture credential uses the real login flow (per this MVP's own "no new bypass route" design) rather than a staging-style secret-gated endpoint — if the login UI changes (form fields, CSRF handling), the capture CLI breaks in lockstep and needs updating; this is a different, ongoing maintenance burden than the staging epic's own more stable `/test/session` route.

**Confirmed (not assumed):** The capture tenant will never be billed. Per `src/web-ui/modules/tenant-plan.js`, a tenant defaults to `plan: 'trial', status: 'active'` and only moves to `plan: 'paid'` via a real Stripe `checkout.session.completed` webhook event. Since the capture tenant is created directly (never through a real checkout), it stays on the default trial state indefinitely and is never billed or metered — resolved via `/clarify`, 2026-10-20.

**Confirmed (not assumed):** A real account's password behaves like any other CI secret for rotation purposes. Checked `src/web-ui/routes/auth-email.js` directly — no password expiry, no account lockout, no 2FA/MFA logic exists in the real login flow. The only relevant mechanism is a standard per-IP rate limiter (10 attempts per 5 minutes, DDoS protection, not account-specific) — a single CI login per capture run stays well within it. No special rotation handling needed beyond standard CI-secret hygiene — resolved via `/clarify`, 2026-10-20.

## Directional Success Indicators

**Production capture exists and has been used at least once:** Baseline: 0 features have any production-sourced evidence today — it's currently impossible, not just slow (only staging capture exists). Target: at least 1 real DoD-complete feature has screenshot evidence captured directly against production via this mechanism. Measured via: a `source: production` marker distinguishing it from staging-sourced evidence in the playback package.

**Capture time, once built:** Baseline: N/A (impossible today). Target: comparable to the staging mechanism's own near-zero unattended run time (same CLI, different auth path). Measured via: session timing, same method as the staging epic's own indicator.

## Constraints

- Credentials are structural (`product/constraints.md` #12) — the production capture credential lives only in a CI secrets store, never in a human's shell or an agent's environment directly.
- No persistent agent runtime / hosted service dependency (`product/constraints.md` #11) — rules out any cloud-based redaction API; the redaction pipeline (once built) must run entirely within existing CI/CD infra.
- No new auth-bypass route on production — reuses the real, existing login flow only (this MVP's own core design choice).
- Budget/timeline: none stated by the operator — proceeding without an explicit constraint here.

## Contributors

- Hamish King — Platform Owner

## Reviewers

- Hamish King — Platform Owner

## Approved By

Hamish King — Platform Owner — 2026-10-21

---

## Clarification log

[2026-10-20] Clarified via /clarify:
- Q: Will the dedicated capture tenant automatically accrue real billing/usage metrics once created?  A: No — confirmed via `src/web-ui/modules/tenant-plan.js`: a tenant defaults to `plan: 'trial', status: 'active'` and only moves to `plan: 'paid'` via a real Stripe `checkout.session.completed` webhook event. The capture tenant, created directly, stays on the default trial state indefinitely and is never billed.
- Q: Does CI secrets-store credential rotation for a real account password follow the same operational pattern already proven for `E2E_STAGING_AUTH_STUB_SECRET`?  A: Yes — confirmed via `src/web-ui/routes/auth-email.js`: no password expiry, account lockout, or 2FA/MFA logic exists in the real login flow. Only a standard per-IP rate limiter (10 attempts/5 min, DDoS protection) applies, well within range for a single CI login per capture run. No special rotation handling needed beyond standard CI-secret hygiene.

Both resolved by direct code investigation, not operator judgment — 0 unconfirmed assumptions remain.

---

**Next step:** Human review and approval → /benefit-metric
