# Decisions: E2E Core Journey Coverage on Staging

## RISK — Staging test-data accumulation (2026-07-23)

**Context:** Surfaced during /clarify. Both new E2E scenarios create real staging data on every run — signup, product creation, Stripe test-mode customers — since they run against real `wuce-staging`, not a disposable per-run environment.

**Decision (resolved at /review, 2026-07-23):** Option (b) chosen — a strict naming/tagging convention (`e2e-test-*` prefix on emails/product/feature names, established by story A3) plus a manually-triggered purge script (`scripts/cleanup-e2e-staging-data.js` or equivalent, story B3), rather than a scheduled nightly job. Rationale: simplest for a solo-operator repo — no scheduled-job infrastructure (cron/CI schedule) to build or maintain, and staging's data volume from CI runs is low enough that periodic manual purges are sufficient. Story B3's AC1 was reworded from a conditional "whichever option is selected" to this concrete mechanism.

**Source:** /clarify pass, this session; resolved during /review walkthrough of MEDIUM finding B3 [1-M1].

---

## RISK — Staging staleness relative to merged code (2026-07-23)

**Context:** Surfaced during /clarify. CI auto-deploy to `wuce-staging` has been broken all session (`FLY_API_TOKEN` expired, confirmed via `gh secret list` showing no update since 2026-06-29) — every deploy this session was a manual `flyctl deploy`. The operator confirmed proceeding with E2E work anyway (manual deploy is acceptable), but this means an E2E failure could reflect stale staging content rather than a genuine regression in the PR under test, until the token is fixed.

**Decision (tracked, not yet resolved):** Proceeding without blocking on the token fix, per operator instruction. `/definition` or `/test-plan` should note this as a known limitation of the E2E gate's reliability until `FLY_API_TOKEN` is refreshed (see the two commands already provided to the operator earlier this session: `flyctl tokens create deploy` + `gh secret set FLY_API_TOKEN`).

**Source:** /clarify pass, this session; original token-expiry finding from earlier in this same session (tmc-s1/pvc-s1 deploy investigation).

---

## RISK-ACCEPT — W4 (AC verification scripts not pre-walked by a domain expert before DoR) (2026-07-23)

**Context:** /definition-of-ready's W4 warning applies to all 8 stories (A1-A5, B1-B3): each story's AC verification script was written at `/test-plan` but has not been walked through end-to-end by a domain expert before DoR sign-off.

**Decision:** Acknowledged and accepted for all 8 stories. This is a solo-operator repo (Hamish King, Founder/Operator) — the same person who authored, reviewed (twice, across Run 1 and Run 2), and is now signing off on these stories already has direct familiarity with every AC's intended behaviour. A full manual script walkthrough is deferred to post-merge smoke testing rather than blocking DoR sign-off now. This matches the Operating Posture in `.github/architecture-guardrails.md` (W4 RISK-ACCEPT is the standard posture for this repo, not a per-story exception).

**Source:** /definition-of-ready run, 2026-07-23, applied uniformly to A1, A2, A3, A4, A5, B1, B2, B3.
