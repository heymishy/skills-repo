## Story: Replace the landing page's fake illustrative hash with a real, live-computed one

**Epic reference:** None — short-track (bug fix, found via informal agentic-review trial of rubber-duck-review-capture)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **security/crypto-literate visitor evaluating whether this platform's governance claims are real**,
I want **the "Cryptographic instruction-set verification" hero card to show an actual, real hash of the instruction set it names — not a fabricated value**,
So that **the one hero card whose entire pitch is "prove it, don't just claim it" doesn't undermine that exact claim for the audience most likely to check it**.

## Benefit Linkage

**Metric moved:** Direct content-correctness fix (short-track, no formal benefit-metric artefact) — found during an informal pre-implementation trial of `rubber-duck-review-capture`'s own agentic-review mechanism (2026-08-09): a hybrid code+live review of the real landing page surfaced that `src/web-ui/templates/landing.html:75` hardcodes `sha256:e3b0c4...` as its illustrative "recomputed hash" — this is the universally-recognized SHA-256 hash of an **empty string**, not a hash of `skills/review/SKILL.md` (the file the card names). The real hash of that file is `334e1d2e...`.

**How:** `skills/` (unlike `workspace/`) IS copied into the deployed Docker image (`Dockerfile` line 43: `COPY --chown=node:node skills/ ./skills/`), so — unlike `lcdf-s1`'s learnings-count fix — no build-time-injection workaround is needed here. The real hash can be computed directly at runtime from the file that's actually present in every deployed environment.

## Architecture Constraints

- **No build-time injection needed, unlike `lcdf-s1`.** `skills/review/SKILL.md` is genuinely present in the deployed image; compute its hash live, the same way `getLearningsCount()` computes its count live from a file that (in that case) is only present locally/in CI. Follow that function's exact fail-open shape (try the real read/hash; on any failure, fall back to a safe placeholder value rather than crashing).
- **Drop the unverifiable "✓ matches trace" claim.** No real trace record in `workspace/traces/` references `skills/review/SKILL.md`'s hash — asserting a match against a trace that doesn't exist would just be a second fabricated claim in place of the first. Reframe the copy to invite independent verification instead (e.g. naming the exact command a visitor could run themselves), which is a more literal expression of "provable, not claimed" than a static checkmark ever was.
- **No change to `decisions.md` D3** (static, curated snapshot convention) — the hash is still computed fresh on each server start/request from a real, present file; this does not reintroduce a live database/API query, it's the same class of "compute from what's actually there" the golden-trace demo and learnings-count card already do.

## Dependencies

- **Upstream:** None.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given the deployed application is running, When the landing page renders the "Cryptographic instruction-set verification" hero card, Then the displayed hash is the real, current SHA-256 hash of `skills/review/SKILL.md` — not a hardcoded or fabricated value.

**AC2:** Given the real hash is computed, When the card is rendered, Then it does not claim "✓ matches trace" (a claim this codebase cannot currently back with a real trace record for this file) — the copy instead invites independent verification (e.g. names the exact file and hash algorithm a visitor could recompute themselves).

**AC3:** Given `skills/review/SKILL.md` is somehow missing or unreadable at runtime (e.g. a future refactor moves the file), When the hash computation runs, Then it fails open to a safe fallback display rather than crashing the page — consistent with this codebase's established `lccf-s1` fail-open pattern.

**AC4:** Given the existing `check-lphf-s1-golden-trace-demo.js`/other landing-page test suites, When re-run after this change, Then they still pass unchanged — this fix is additive to one hero card, not a restructuring of the page.

## Out of Scope

- **Building a real trace-matching feature** (recording and checking against an actual audit trail entry for this specific hash) — a reasonable future enhancement, but a materially larger scope than this quick content-correctness fix.
- **Any other hero card's content** — the "Scope-contract enforcement" and "Self-improving harness" cards are unaffected.
- **Changing which instruction set file is named** (`skills/review/SKILL.md` stays the example) — only the displayed hash value and its supporting copy change.

## NFRs

- **Performance:** Negligible — one file read + SHA-256 computation per render (or cached at module load, coding agent's choice), consistent with this repo's other landing-page content functions.
- **Security:** None identified — no new input handling; reading a repo-tracked file that's already deployed.
- **Accessibility:** Not applicable — no markup/structure change beyond the text content of one `<code>` element.
- **Audit:** Improves — replaces a fabricated claim with a genuinely true, independently-checkable one.

## Complexity Rating

**Rating:** 1 — a single function computing a hash from an already-deployed file, following an already-established fail-open pattern in this exact codebase.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
