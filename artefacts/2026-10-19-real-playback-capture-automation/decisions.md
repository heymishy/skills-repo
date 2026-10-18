# Decisions: Real Playback Capture Automation

---

**2026-10-19 | SCOPE | Production capture deferred to a fast-follow story, not bundled into this epic**
**Decision:** This epic's MVP targets `wuce-staging` only. Production (`skills-framework`) capture is explicitly out of scope, to be scoped as a separate fast-follow story once the staging mechanism is proven in practice.
**Context:** At `/discovery`, the operator was asked whether production should be included in this epic's own MVP. A production-equivalent auth-bypass secret carries materially higher risk than staging's `E2E_STAGING_AUTH_STUB_SECRET` — staging holds non-production data, so a leaked staging secret has a low blast radius; a leaked production secret could mint a session for a real tenant on the real app.
**Rationale:** Separating the two risk profiles into two stories/epics means the higher-risk production decision gets its own explicit review once there's real evidence the staging mechanism works, rather than being approved as a package deal alongside the lower-risk staging work.
**Made by:** Hamish King (Platform Owner), via direct `AskUserQuestion` reply ("Staging first, production as a fast-follow story"), 2026-10-19.
**Revisit trigger:** Once `rpca-s1`-`rpca-s4` are DoD-complete and the staging mechanism has been used for at least one real feature, scope the production fast-follow story.

---

**2026-10-19 | DESIGN | Capture CLI authenticates by reusing the existing `GET /test/session` route, not a new one**
**Decision:** `rpca-s1`'s own `authenticateStagingSession` function calls the already-deployed `GET /test/session` route (gated by `_isTestEndpointAllowed`, `src/web-ui/server.js` ~line 1773-2263) with the `x-e2e-test-endpoint-bypass` header. No new route is introduced.
**Context:** At `/clarify`, confirmed directly from code that `tests/e2e/fixtures/auth.js` already calls this exact route for every local E2E test today — the capture CLI is simply a new caller of an existing, unchanged, already-proven mechanism.
**Rationale:** Per ADR-026 (reuse an existing entity/primitive when its shape already covers a new concept) — introducing a second auth-bypass route would duplicate an already-working mechanism and widen the real audit surface for no benefit.
**Made by:** Claude (session), confirmed via direct code investigation at `/clarify`, 2026-10-19.
**Revisit trigger:** None — this is a settled design decision, not a pending question.

---

**2026-10-19 | RISK-ACCEPT | rpca-s1 AC1/AC2 and rpca-s3 AC1 — real-world execution requires a secret this sandbox does not hold**
**Decision:** `rpca-s1`'s AC1 (real authentication against `wuce-staging`) and AC2 (a real screenshot captured and saved), and `rpca-s3`'s AC1 (a real `.webm` file produced), are RISK-ACCEPTed for automated execution in this development sandbox. Each AC's own underlying logic is covered by a unit or integration test against a mocked/local-mock-server target (see each story's own test plan); the real end-to-end claim — that the mechanism actually works against the real deployed `wuce-staging` with a real secret — is covered by a manual scenario in each story's own AC verification script, 🔴, to be executed by the operator (who can retrieve the real secret) or by a CI run with the secret configured as an environment variable.
**Context:** This sandbox does not hold a real `E2E_STAGING_AUTH_STUB_SECRET` value. Retrieving it ad hoc, mid-investigation, was deliberately declined earlier this session pending proper scoping — this epic is that proper scoping. The gap is the same class every `fpd-*` story's own decisions.md already used repeatedly (`fpd-s1` AC3, `fpd-s2` AC1, `fpd-s3`, `fpd-s4` AC4, `fpd-s5` AC4) — a real-world claim that cannot be proven inside a sandboxed CI run, proven instead by live operator-run verification at `/verify-completion`.
**Rationale:** Logging this once, covering all three affected ACs across two stories, rather than three separate near-identical entries — they share one root cause (no secret value in this sandbox), not three independent gaps.
**Made by:** Claude (session), during `/definition-of-ready` for `rpca-s1`.
**Revisit trigger:** Once the operator (or a configured CI run) executes the real manual scenario for any of these ACs, record the result here and in the corresponding story's own DoD artefact, same pattern `fpd-s5` AC4 used when it was closed for real.

---
