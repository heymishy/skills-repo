# Story: Fix validate-trace.ps1's discovery_approved check to suppress false positives on already-Approved features

**Epic reference:** None — short-track (bounded refactor, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported/session-investigated pattern below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** None — governance tooling script, not web-ui/api/auth/data/security

## User Story

As an **operator relying on `npm test`'s trace-validation gate on Windows**,
I want **`scripts/validate-trace.ps1`'s `discovery_approved` check to stop flagging an already-`Approved` feature as "still Draft" just because its discovery.md contains the word "status" and "Draft" co-occurring elsewhere in the document (e.g. a historical correction note)**,
So that **the trace-validation gate's pass/fail verdict is trustworthy — a real governance regression is distinguishable from this scripting false positive, instead of both looking identical**.

## Benefit Linkage

**Metric moved:** Trust in `npm test`'s own trace-validation signal on Windows (operational correctness, not a formal benefit-metric artefact — short-track).
**How:** Confirmed live, 2026-10-04: `validate-trace.ps1 --ci` currently fails on 2 real, already-`Approved` features (`new-feature-2b74a292`, `new-feature-af17f555`) purely because of this regex gap — a real false positive that was initially (incorrectly) assumed to be "environment-specific" rather than investigated, exactly the kind of noise that erodes trust in a gate and causes genuine future regressions to be waved through as "probably the same known flake." Fixing it restores the gate's real signal value.

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. This story touches a governance check script (`scripts/validate-trace.ps1`), not application architecture; no ADR governs trace-validation script internals. Per the artefact-first rule (ADR-011), a governance check script change does need a story artefact before/alongside the commit — this story satisfies that.

**Cross-platform parity requirement:** `scripts/validate-trace.sh` (the Linux/CI-path equivalent, `Check-DiscoveryApproved`'s Python/Bash counterpart at lines 268-269 and 474-480) already implements the correct suppression logic (an `approved_flag` match short-circuits a `draft_flag` match before failing). `validate-trace.ps1`'s own `Check-DiscoveryApproved` function (lines 156-186) is missing this exact logic — it only checks `content -match '(?i)status.*draft'` with no corresponding `status.*approved` check. This story brings `.ps1` to parity with `.sh`'s already-correct behaviour, not a novel design.

## Dependencies

- **Upstream:** None.
- **Downstream:** None directly — unblocks trustworthy local Windows trace-validation for all future work in this repo.

## Acceptance Criteria

**AC1:** Given a feature's discovery.md contains a real `**Status:** Approved` line (or any line matching `(?i)status.*approved`) and, elsewhere in the same document, a separate sentence where the words "status" and "Draft" co-occur in that order (e.g. a historical note like `"status corrected from stale \"Draft\""`), When `validate-trace.ps1 --ci`'s `Check-DiscoveryApproved` function runs against it, Then it does NOT flag that feature as Draft — matching `validate-trace.sh`'s own existing approved-suppresses-draft behaviour exactly.

**AC2:** Given a feature's discovery.md genuinely has `**Status:** Draft` (or any Draft-indicating status line) with no corresponding approved-match anywhere in the file, When `Check-DiscoveryApproved` runs, Then it DOES still flag that feature as Draft — the fix must not suppress genuine, real Draft detection, only the false-positive case.

**AC3:** Given this repo's own real current state (confirmed 2026-10-04: `new-feature-2b74a292` and `new-feature-af17f555` are real false positives under the pre-fix script), When the fixed `validate-trace.ps1 --ci` runs against this real repo, Then it no longer flags either of those two features, and the script's own `discovery_approved` check passes (0 unapproved features reported for that check specifically — other checks are out of this story's scope).

**AC4:** Given `validate-trace.sh`'s own `approved`/`draft` detection logic (lines 268-269: `approved = any(re.search(r'status.*approved', l, re.IGNORECASE) for l in lines)`, `draft = any(re.search(r'status.*draft', l, re.IGNORECASE) for l in lines)`, each checked per-line not whole-content), When the fixed `.ps1` logic is compared against it, Then both scripts produce an identical `discovery_approved` pass/fail verdict for the same real repo state — true parity, confirmed by running both against this repo and diffing their `discovery_approved` results.

## Out of Scope

- Rewriting `Check-DiscoveryApproved`'s detection to use a more precise single-field extraction (e.g. parsing only the literal `**Status:**` metadata line, ignoring the rest of the document entirely) — that would be a stronger, more correct fix but is a larger behavioural change than restoring parity with the already-accepted `.sh` logic; worth a future follow-up if the `approved`-suppresses-`draft` heuristic itself proves insufficient.
- Any change to `validate-trace.sh` itself — it already has the correct behaviour; this story only changes `.ps1`.
- Fixing the genuine (non-false-positive) Draft-status governance gaps this session separately found and resolved via `/clarify` — already handled directly in each feature's own `discovery.md`, unrelated to this script bug.

## NFRs

- **Performance:** No measurable change — same per-feature regex scan, one additional regex match per file.
- **Security:** None identified — local governance tooling script, no new input surface, no new file writes.
- **Accessibility:** N/A — CLI script, no UI.
- **Audit:** N/A — not a user-facing or data-handling change.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
