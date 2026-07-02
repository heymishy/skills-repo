# Story lab-s1.1 — Auth tech spike: ESM/CJS path recommendation

**Feature:** 2026-07-01-landing-auth-billing
**Epic:** lab-e1-foundation
**Discovery:** artefacts/2026-07-01-landing-auth-billing/discovery.md
**Benefit-metric:** artefacts/2026-07-01-landing-auth-billing/benefit-metric.md
**Status:** Definition
**Complexity:** 2
**Scope stability:** Stable

## User story

As the operator,
I want a written, time-boxed technical investigation that produces a concrete path recommendation between Path A (dynamic import() wrapper), Path B (full ESM migration), and Path C (roll-your-own OAuth abstraction),
So that M1 (self-serve signup conversion) is unblocked — auth implementation stories begin from a decided architecture with no ESM/CJS compatibility unknowns left open.

## Metric linkage

- **M1** (Self-serve signup conversion, benefit-metric.md §M1): All auth implementation stories are blocked on this spike. Without a resolved path, no multi-provider auth can ship, and M1 cannot be measured.

## Acceptance criteria

**AC1** — Spike exit deliverable: written path recommendation in `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md`
Given the spike investigation is complete,
When the operator reads `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md`,
Then the document contains: (1) which path (A, B, or C) is recommended, (2) rationale for the recommendation, (3) for Path B: a migration cost estimate (lines of code affected, files to change, estimated time), (4) for Paths A or B: a go/no-go on Better Auth adoption with the Neon Postgres adapter confirmed or rejected, (5) for Path A or B: the session schema migration strategy (transparent mapping vs forced re-auth) confirmed, (6) explicit list of stories unblocked by this recommendation.

**AC2** — Spike completes within one time-box (maximum 1 day operator focus time)
Given the spike investigation begins,
When the spike time-box expires (1 operator day),
Then a recommendation exists even if some questions remain open — the spike exits with a decision, not "needs more investigation".

**AC3** — Path C validation: if Path C is recommended, a working proof-of-concept multi-provider OAuth `fetch()` flow exists
Given Path C (roll-your-own) is recommended,
When the operator runs the proof-of-concept against the GitHub OAuth endpoint in test mode,
Then the GitHub OAuth exchange (authorise → callback → token → user identity) completes successfully using `fetch()` calls with no Better Auth package.

**AC4** — Path A or B validation: if Better Auth is adopted, Neon Postgres adapter compatibility confirmed
Given Path A or B is recommended,
When `better-auth` is installed and the Neon Postgres adapter is configured with the existing `DATABASE_URL`,
Then Better Auth can initialise and write to the Neon database without additional pooling configuration (or the specific pooling requirement is documented in the spike outcome).

**AC5** — `decisions.md` ARCH-002 is updated with the chosen path
Given the spike recommendation is complete,
When `artefacts/2026-07-01-landing-auth-billing/decisions.md` is read,
Then ARCH-002 is updated from "DEFERRED to spike exit" to the chosen path name and rationale summary.

## Out of scope

- Implementing any auth provider flows (that is lab-s1.3, s2.1, s2.2)
- Migrating the existing `oauth-adapter.js` to any new framework
- Choosing pricing tiers or defining the /welcome flow
- Any deployment or production wiring — spike is local investigation only

## Dependencies

None — this is the first story in the feature. It is deliberately dependency-free so it can begin immediately.

## Implementation touchpoints

- `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md` (new): spike exit deliverable
- `artefacts/2026-07-01-landing-auth-billing/decisions.md`: update ARCH-002
- `package.json`: may temporarily install `better-auth` in a local branch to test (not committed to master if path C is chosen)

## Architecture Constraints

- **CJS-only baseline** (Style Guide, `.github/architecture-guardrails.md`): The web-ui server is CommonJS — `package.json` has no `"type"` field. Any recommendation that changes this (Path B) must include a full migration cost estimate.
- **ADR-011** (Artefact-first): The spike outcome document is the artefact for this story — no new `src/` modules are introduced in this story.
- **npm constraint relaxed for this feature** (discovery.md §Constraints): `better-auth` and `stripe` packages are permitted for this feature. This relaxation is scoped to this feature only.

## NFRs

- **No credentials in spike artefact**: The spike outcome document must not contain any actual API keys, client secrets, or connection strings. Use placeholders only.
- **Time-boxed investigation**: Maximum 1 operator day. The spike exits with a decision regardless of remaining unknowns.

## Test

Verification: read `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md` and confirm all 5 required sections are present (AC1). Check `decisions.md` ARCH-002 is updated (AC5). If Path C: run the proof-of-concept (AC3). If Path A/B: confirm Neon adapter tested (AC4).
