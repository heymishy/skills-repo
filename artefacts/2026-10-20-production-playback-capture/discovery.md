# Discovery: Production Playback Capture

<!--
  Produced by the /discovery skill. The structured outcome of early exploration —
  what problem we're solving, for whom, and what success looks like at the edges.

  Status must be "Approved" before /benefit-metric can proceed.
  MVP scope and out-of-scope fields are the primary review targets.
-->

> **Correction note (2026-10-21):** This version replaces an earlier draft (Approved 2026-10-21) that was built around the wrong mechanism — an internal operator CLI tool with a dedicated synthetic capture tenant and CI-service-credential auth. The operator surfaced the correct frame during `/definition` Step 3: this is a self-service, in-product, multi-tenant capability — every real tenant's own users trigger and view playback of their own DoD-complete features, within their own tenancy, with no platform-operator involvement. See `decisions.md`'s 2026-10-21 CORRECTION entry for the full history. The `video-capture-library` spike's findings (`spikes/video-capture-library-outcome.md`) still apply to the presentation/redaction layer and are carried forward unchanged below.

**Status:** Approved
**Created:** 2026-10-21
**Approved by:** Hamish King — Platform Owner — 2026-10-21
**Author:** Claude (session), with Hamish King (Platform Owner)

---

## Problem Statement

Within the multi-tenant SaaS skills platform, once a story reaches Definition of Done, a tenant's own stakeholders have no easy way to validate that the delivered feature actually behaves as claimed in production. Today, confirming a DoD claim means either trusting the written DoD artefact at face value, or someone with access manually walking through the live product to re-check each acceptance criterion by hand. There's no built-in, self-service way for a tenant's own users to trigger and view captured evidence (screenshot/video playback) of their own DoD-complete feature running for real, inside their own tenancy. This makes DoD validation slow, manual, and dependent on someone re-deriving evidence that delivery should have produced as a by-product in the first place.

## Who It Affects

**Primary persona: Tenant Product Owner** — the person within a tenant who commissioned or owns the brief for a feature. Wants to demo and review a delivered feature against its original brief/acceptance criteria, confirm it does what was promised, and sign off on it as done — without needing engineering help to reproduce the scenario live, and without leaving their own tenancy to do it.

**Secondary persona: Engineer/delivery person** — currently the one who absorbs the manual cost: finding the story and its ACs, manually demoing the feature, collating screenshots/evidence, and building a presentation to hand to the Product Owner for sign-off. This is the toil this feature is meant to remove or automate away.

## Why Now

Two things converged. First, accumulated pain hit a measurable tipping point: `feature-playback-demo`'s own real-world run (fpd-s5) found that only 1 of ~50 acceptance criteria across a real feature (`journey-cx-redesign`) had actual captured evidence — proving the manual demo/evidence-collation process doesn't scale and mostly doesn't happen at all. Second, the hard technical blocker just got removed: the `real-playback-capture-automation` epic (rpca-s1–s5, just completed) built and proved a real, working capture mechanism — auth → launch browser → interact → capture screenshot/video → embed → caption — end-to-end against real staging. That mechanism currently only runs as an internal/operator-triggered pipeline authenticated via a CI service credential. Now that the underlying capture tech is proven, extending it into a self-service, in-tenant capability is a scoping and auth-boundary problem, not an unsolved technical one — making this the right time to build the tenant-facing version rather than leaving the capability stuck behind an operator-only interface.

## MVP Scope

A tenant's own Product Owner, logged into the product with their own normal tenant credentials (no CI service credential, no synthetic capture tenant), can open one of their own DoD-complete features within one of their own products and trigger an on-demand **screenshot-per-AC capture** — reusing the proven `rpca` mechanism (`captureAcScreenshots`) — scoped by the existing `tenant_id`/`product_id`/`feature_slug` relationships already present on `journeys`, and view the result inline against the feature's ACs well enough to sign off without an engineer demoing it by hand.

**Confirmed against the codebase (2026-10-21):** the tenant → product → connected-GitHub-repo mapping already exists and is production-wired — `products.tenant_id`, `product-repo.js`'s `POST /products/:id/repo` (`repo_provider`/`repo_owner`/`repo_name`), and `journeys.product_id`/`tenant_id`/`feature_slug` with repo-backfill via `_applyRepoChange`. This means the MVP is mostly an auth-scoping and UI-surfacing change layered on the already-proven `rpca` mechanism — not a new architectural layer.

**Entry point (resolved via /clarify, 2026-10-21):** a `/playback` viewer route already exists (`fpd-s3`/`fpd-s4`), but its own DoD explicitly documents that it reads `pipeline-state.json`'s `features[]` array, which "has no tenant dimension at all in this data model" — every authenticated user can already see every feature through it, zero tenant filtering. That's this repo's own internal engineering bookkeeping (tracking delivery of the wuce product itself), not the tenant-scoped Postgres model (`products`/`journeys`/`tenant_id`/`product_id`) real SaaS tenants' own features live in. **Reusing `/playback` as-is for this feature would leak every tenant's features to every other tenant — it is the wrong surface to extend.** A new, properly tenant-scoped surface must be built instead, reading from the Postgres `journeys`/`products` model. The plumbing for that already exists: `repo-adapter.js`/`artefact-fetcher.js` already read a tenant's own connected repo's artefacts by `featureSlug` + `artefactType`, scoped via `product_id`/`tenant_id` — exactly what's needed to pull a tenant's own feature's DoD status/ACs. `fpd`'s own UI pattern (AC-grouped layout, embedded screenshot rendering) is likely reusable as a template even though its data-access layer is not. **Architectural choice — log in `decisions.md` once past discovery:** new tenant-scoped surface vs. reusing `/playback`.

**Trigger mechanics (resolved via /clarify, 2026-10-21):** the capture is triggered **synchronously** — the Product Owner clicks "Capture evidence," the UI shows a loading state while `captureAcScreenshots` runs against their live session, then shows results inline. Chosen for MVP simplicity over building a job queue + notification system before it's known to be needed. This is a sanity-check-early item, not an unexamined assumption: no clean capture-duration-only number exists yet in `rpca`'s own DoD evidence (the only data point, "a few minutes," bundles manual CI-secret retrieval that this MVP's session-reuse approach removes). The first build story should measure actual per-feature capture time early; if a full feature's ACs push past ~30-60 seconds, that's the trigger to revisit async.

Deferred from this first slice (see Out of Scope below):
- **Video capture** — `captureVideoForClip` is proven but adds capture time and a bigger redaction surface than screenshots for v1.
- **Redaction/PII handling** — v1 targets screenshot evidence on data a tenant's own Product Owner is already authorized to see; general automated redaction is not required for this slice. The local OCR+pattern-match redaction pipeline from the `video-capture-library` spike needs its own build-and-measure story with a human-verification gate before it's trusted — that's a fast-follow, not MVP.
- **Presentation polish** (zoom/annotation via ffmpeg) — nice-to-have, not required to validate the core hypothesis.

## Out of Scope

**Fast-follow (next iteration after MVP validates):**
- **Video capture** — `captureVideoForClip` already exists; natural next step once screenshot-only is proven.
- **Presentation polish (ffmpeg zoom/annotation)** — layers on top of video capture.
- **Automated redaction/PII handling** — needed to unlock video and broader production-data capture; requires its own build-and-measure story with a human-verification gate, but it's the clear next priority, not indefinitely deferred.

**Out of scope, not currently planned:**
- **Cross-tenant or external sharing of captured evidence** — no clear need yet; reintroduces access-control/data-exposure questions this MVP deliberately avoids.
- **Scheduled/recurring or bulk capture** — a scale concern for later, not on the near-term roadmap.
- **Capturing features that are not yet DoD-complete** — a different use case (live demo/preview) than DoD validation; not something this initiative is building toward.
- **Retention/deletion policy for captured evidence** — needs a deliberate governance decision; not assumed or defaulted silently, and not yet prioritized to design.

## Assumptions and Risks

- [RESOLVED via /clarify, 2026-10-21] The tenant's own existing in-product login session CAN be reused to drive the `rpca` browser-automation mechanism's auth step, confirmed by direct inspection of `src/web-ui/middleware/session.js`: sessions are opaque, unsigned random IDs held in a server-side store (`Map` + Redis), not signed/JWT cookies. The server can seed a Playwright browser context's cookie directly from `req.sessionId` (e.g. `context.addCookies([{name: 'session_id', value: req.sessionId, ...}])`) with no new token-minting or auth plumbing required. Constraint carried forward: `session_id` is an unsigned bearer-equivalent value and must never leave the server process (no client-side exposure, no logging) — consistent with how `accessToken` is already excluded from Redis rehydration (`_sanitiseForRedis`) elsewhere in this codebase.
- [RESOLVED via /clarify, 2026-10-21] Screenshot-only capture (no redaction) is an acceptable data-exposure level for v1 — and this is a structural consequence of the Q1 session-reuse design, not a separate policy promise: because the capture mechanism drives the PO's own real session (same cookie, same role/tenant scoping the app already enforces on every request), the headless browser can only ever see what that PO could already see by clicking around the product themselves, live, today — including incidental PII of their own team/customers, already visible to them in normal use. No new exposure surface is introduced.
- **Risk — could make this not worth building:** if driving live browser automation against a tenant's own production session, triggered from within the product itself, turns out to need materially more plumbing (session/credential handling for the automation layer, rate limiting, concurrency isolation between tenants) than the "mostly auth-scoping" MVP sizing assumes, the cost/value case weakens significantly — this should be sanity-checked early, e.g. with a short technical spike, before committing full MVP scope.

## Directional Success Indicators

1. **Self-service DoD validation rate** — Baseline: 0% (the capability doesn't exist yet; `fpd-s5`'s real-world run found only 1 of ~50 ACs across a real feature had any captured evidence at all, meaning validation today mostly isn't happening, not just happening slowly). Target: tenant Product Owners trigger and view self-service capture for a meaningful share of their own DoD-complete features without engineer involvement (exact % to be set at /benefit-metric). Measured via: a PostHog event on the capture-trigger action, scoped by `tenant_id`/`product_id`.

2. **Time to DoD sign-off** — Baseline: [UNKNOWN BASELINE] — no reliable "today" number exists because manual evidence collation is rarely actually performed in practice (per the `fpd-s5` finding), so there's nothing consistent to compare against yet. Target: a tenant Product Owner can go from "feature marked DoD-complete" to "evidence viewed, sign-off decision made" within a single sitting, self-service, with no engineer in the loop. Measured via: timestamp delta between DoD-complete marking and first self-service capture view, logged via PostHog.

3. **Engineer manual-demo load removed** — Baseline: [UNKNOWN BASELINE] — not currently instrumented. Target: zero engineer-hours spent manually demoing/collating evidence for features that go through this self-service path. Measured via: no current proxy metric exists for this; would need an operator-reported or qualitative check-in signal, flagged as a measurement gap for /benefit-metric to resolve.

## Constraints

**Capture concurrency (resolved via /clarify, 2026-10-21):** add a per-tenant/per-user rate limit on the capture-trigger endpoint, reusing the existing `createRateLimiter` pattern already used in `sign-off.js` (10 req/user/min) — cheap, guards against the realistic MVP risk (accidental double-click, buggy retry loop), not a sophisticated abuse scenario. A true system-wide concurrency cap on simultaneous headless-browser sessions is a real need eventually, but is fast-follow: better sized from real usage data than guessed at MVP volume.

No other constraints identified. EA registry checked (`architecture.ea_registry_authoritative: true`, local path `C:/Users/Hamis/code/ea-registry-repo`) — no entry found for the web-ui/journeys-platform system; the registry currently only covers an unrelated `card-issuing-platform`/`payments` domain. Proceeding without blast-radius data — this does not block discovery.

## Contributors

- Hamish King — Platform Owner — 2026-10-21

## Reviewers

- None separate — solo discovery; contributor and approver are the same person.

## Approved By

Hamish King — Platform Owner — 2026-10-21

---

**Next step:** Human review and approval → /benefit-metric

---

## /clarify recommendation (resolved)

This discovery originally contained 2 unconfirmed assumptions that affected scope and benefit measurement. Both were resolved via `/clarify` on 2026-10-21 — see the Assumptions and Risks section above (now marked `[RESOLVED via /clarify, 2026-10-21]`) and the Clarification log below for the full Q&A. No unresolved `[ASSUMPTION]` lines remain.

## Clarification log

[2026-10-21] Clarified via /clarify:
- Q: How does the tenant's own in-product login session get reused for `rpca`'s browser-automation auth step?  A: Confirmed via code inspection (`middleware/session.js`) — sessions are opaque, unsigned IDs in a server-side store; the server can seed a Playwright context's cookie directly from `req.sessionId`, no new auth plumbing needed. Constraint: `session_id` must never leave the server process.
- Q: Is the capture trigger synchronous or asynchronous?  A: Synchronous for MVP (loading state while `captureAcScreenshots` runs). No clean capture-duration-only data exists yet in `rpca`'s DoD evidence; first build story should measure actual timing early, revisit async if a full feature's ACs push past ~30-60s.
- Q: Is the "screenshot-only is an acceptable exposure level" assumption bounded or could it include incidental PII beyond what the PO is normally authorized to see?  A: Bounded by construction — since capture reuses the PO's own real session (per Q1), the headless browser inherits exactly that PO's existing authorization boundary; no new exposure surface is introduced.
- Q: Where does the PO trigger this — an existing surface or a new one?  A: A new tenant-scoped surface must be built. The existing `/playback` route (`fpd-s3`/`fpd-s4`) reads untenanted `pipeline-state.json` data and would leak cross-tenant features if reused. `repo-adapter.js`/`artefact-fetcher.js` already provide tenant-scoped artefact reads by `featureSlug`/`product_id`/`tenant_id` to build the new surface on. Logged as an architectural choice for `decisions.md`.
- Q: Should simultaneous captures be limited?  A: Yes — per-tenant/per-user rate limiting now (reusing the existing `createRateLimiter` pattern from `sign-off.js`); a true system-wide concurrency cap is fast-follow, sized from real usage data later.
