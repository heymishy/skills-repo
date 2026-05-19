# Discovery: Artefact-First Governance Gate (check-artefact-coverage.js)

**Feature slug:** 2026-04-21-artefact-coverage-gate
**Discovery date:** 2026-04-21
**Status:** Approved — proceeding to short-track (test-plan → DoR → implementation)

---

## Problem

The artefact-first rule (ADR-011) is instruction-enforced only. Nothing in `npm test` will fail if a new skill is committed to `.github/skills/` or a new module to `src/` without a corresponding story artefact. The `/estimate` skill is the concrete proof: it shipped without a discovery, story, test-plan, or DoR, and is untraceable by any upgrade-path agent. Any agent or contributor can add skills out-of-band and the governance gate passes.

## MVP scope

A single governance check script (`tests/check-artefact-coverage.js`) that:
- Enumerates `.github/skills/` and `src/` for skill and module slugs
- For each slug, searches `artefacts/` for a DoR file matching the slug
- Reports UNCOVERED findings; exits non-zero if UNCOVERED and not exempted
- Reads an exemption list from `artefact-coverage-exemptions.json` (with mandatory comments)
- Runs as part of `npm test`

## Benefit

Structural enforcement of ADR-011 at CI boundary. UNCOVERED skills/modules fail the gate, not just human review.

## Short-track rationale

Bug-fix and governance gate. No new feature capabilities, no new user-facing behaviour. Short-track path (test-plan → DoR) is appropriate per pipeline conventions.
