## Story: Wire standardsList to read from the git-backed cache, with promote/opt-out proven unaffected

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-3-standards-git-tracked.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **tenant admin configuring a new product / engineer pairing**,
I want to **see genuinely git-backed standards content when I view the standards list, with no change to how promote or opt-out already behave**,
So that **the DB-to-git architectural change (prc-s3.1, prc-s3.2) is real end-to-end, not just true for the write path**.

## Benefit Linkage

**Metric moved:** Metric 1 — Time from idea to DoR-ready, git-committed artefact
**How:** `prc-s3.1` made the write path (`standardsPost`/`standardsPut`) git-backed; without this story, `standardsList` could still be silently reading stale or DB-only content, and nothing would prove `standardsPromote`/`optoutPost`/`optoutDelete` weren't accidentally broken by the surrounding change — this story is the read-side and regression-boundary proof that makes the earlier two stories' work actually trustworthy for anyone using the existing UI, not just correct on paper.

## Architecture Constraints

None new — this story wires `standardsList` to `prc-s3.2`'s cache and adds regression coverage for `standardsPromote`/`optoutPost`/`optoutDelete`. Note: `standardsPost`/`standardsPut`'s write-through behaviour is `prc-s3.1`'s scope, not this story's — see the corrected Dependencies and Out of Scope below (this scope boundary was tightened after `/review` run 1 flagged the original version's overlap with `prc-s3.1`, see `decisions.md`).

## Dependencies

- **Upstream:** prc-s3.1, prc-s3.2
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given the existing `standardsList` test suite (pre-existing, DB-only), When this story ships, Then it's updated to assert content comes from `prc-s3.2`'s git-backed cache, and continues passing — no regression in the documented route contract (status codes, response shape).

**AC2:** Given `standardsPromote` (visibility-tier promotion) and `optoutPost`/`optoutDelete` (opt-out tracking), When this story ships, Then their existing test suites pass unmodified — proving the surrounding architectural change didn't regress behaviour that was explicitly out of scope for `prc-s3.1`/`prc-s3.2` to touch.

**AC3:** Given a real end-to-end flow (create a standard via the web UI, then read it back via `standardsList`), When both actions happen through the actual routes, Then the returned content matches exactly what was written, round-tripped through git and the cache — proving `prc-s3.1`'s write path and this story's read path agree.

## Out of Scope

- `standardsPost`/`standardsPut`'s write-through behaviour — that's `prc-s3.1`'s scope; this story only touches the read side (`standardsList`) and confirms promote/opt-out are unaffected.
- Any new route or endpoint — this story only changes the internals of `standardsList`.

## NFRs

- **Performance:** `standardsList` should not regress in response time versus today's DB-only behaviour, per `prc-s3.2`'s cache requirement.
- **Security:** No change to `standards.js`'s existing auth/tenant-scoping checks.
- **Accessibility:** Not applicable.
- **Audit:** None new.

## Complexity Rating

**Rating:** 1
<!-- Narrower than the original version — read-side wiring plus regression tests, the write-side complexity lives in prc-s3.1. -->
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
