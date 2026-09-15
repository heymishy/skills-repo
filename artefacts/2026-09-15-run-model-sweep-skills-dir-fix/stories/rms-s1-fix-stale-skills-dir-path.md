## Story: Fix run-model-sweep.js's stale SKILLS_DIR path

**Track:** Short-track (bug fix, found while trying to launch a real model-routing experiment)
**Epic reference:** (none — standalone tooling fix)
**Domain:** software-engineering

## User Story

As **an operator trying to run a model-comparison experiment via `scripts/run-model-sweep.js`**,
I want **the script to find skills at their real location**,
So that **`--list-skills` and every sweep command work instead of failing immediately with "Skills directory not found"**.

## Problem

`scripts/run-model-sweep.js` hardcodes `SKILLS_DIR = path.join(REPO_ROOT, '.github', 'skills')` (line 68). That directory does not exist in this repo — skills live at `skills/<name>/` (confirmed: `skills/discovery/`, `skills/test-plan/`, `skills/definition-of-ready/`, `skills/review/` all exist with `SKILL.md`, `EVAL.md`, and `corpus/`).

Running `node scripts/run-model-sweep.js --list-skills` fails immediately:
```
Fatal: Skills directory not found: <repo>\.github\skills
```

Root cause: PR #753 (`pisd-s1`, 2026-08-22, "Point platform-init.js at the real skills/ and templates/ source directories") fixed this exact drift in `platform-init.js` but missed `run-model-sweep.js`, which still points at the pre-migration `.github/skills/` location. `run-model-sweep.js` has no existing test coverage (`tests/check-*model-sweep*` returns zero files), which is why this has gone undetected — every invocation of the script has been broken since PR #753 merged, with no experiment run since able to reach even `--list-skills`.

This was discovered while trying to launch a real experiment (haiku-vs-sonnet on `test-plan`/`definition-of-ready`/`review`, following the same methodology EXP-021 used for `discovery`) — the harness itself is the blocker.

## Fix

Change `SKILLS_DIR` in `scripts/run-model-sweep.js` from `path.join(REPO_ROOT, '.github', 'skills')` to `path.join(REPO_ROOT, 'skills')`, matching the real, current skill location and the same fix already applied to `platform-init.js` in PR #753.

## Acceptance Criteria

**AC1:** Given the real repo layout (skills at `skills/<name>/`), When `node scripts/run-model-sweep.js --list-skills` is run, Then it lists real skills (including `discovery`, `test-plan`, `definition-of-ready`, `review`) instead of throwing "Skills directory not found".

**AC2:** Given `discoverSkills()` is called directly with no filter, When the real `skills/` directory is scanned, Then it returns an entry for every skill directory containing an `EVAL.md` file, with `corpusDir` set when a `corpus/` subdirectory exists.

**AC3:** Given a `--dry-run` sweep targeting a real skill with corpus cases (e.g. `definition-of-ready`), When the command runs, Then it builds the expected matrix (skill × model × case × trial) without hitting the API, proving the corpus-discovery path also works end-to-end post-fix.

## Out of Scope

- Actually running the haiku-vs-sonnet experiment on `test-plan`/`definition-of-ready`/`review` — that's the follow-up this fix unblocks, not part of this story.
- Auditing other scripts for the same `.github/skills/` drift beyond `run-model-sweep.js` (a quick grep found no other hits, but a full audit is not this story's scope).
- Adding new corpus cases or EVAL.md rubric content for any skill.

## NFRs

- None new.

## Complexity Rating

**Rating:** 1 — single-constant fix, well understood, verified against the exact same precedent (`pisd-s1`).
**Scope stability:** Stable.
