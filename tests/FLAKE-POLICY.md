# Flake policy

## What counts as a flake

A flake is a browser test that fails on some runs and passes on others with the same code. A test that passes on a rerun of a job, after failing in the first attempt, is a flake until shown otherwise. A test that always fails is a broken test, not a flake, and goes through the normal fix path.

## The rerun rule

A failing job may be rerun. A rerun that passes is not a result until the flake is recorded. Before a passing rerun counts, the test must have an entry in `tests/e2e/flake-ledger.json` with the first failure's message in its note. A rerun without an entry means the flake is not yet tracked and the operator must add one.

Retries inside a single run (the Playwright retry setting) are off in this repository. If they are turned on, a test that passes on retry is a flake and needs an entry in the same way.

## The ledger

`tests/e2e/flake-ledger.json` is the only list of flaky tests. Each entry needs:

- `test`: the file and title, joined as `file > title` (the same form `scripts/flake-check.js --report` prints).
- `firstSeen`: the date the flake was first recorded.
- `owner`: the person who will fix it.
- `issue`: the tracking issue.
- `reviewBy`: the date by which the owner reviews it. It must be no more than 14 days after `firstSeen`.
- `note`: the first failure's message, and how often it has been seen.

`node scripts/flake-check.js --check` fails on an incomplete entry, on a `reviewBy` more than 14 days after `firstSeen`, and on a `reviewBy` that has passed. An overdue flake is either fixed, or its review date is moved with a reason in `note`.

## Quarantine is not a flake entry

A spec that is excluded from the core lane is recorded in `tests/e2e/capability-matrix.json` with a reason, an owner and a review date. Do not also add it to the ledger; the matrix already answers "is this excluded, and until when".

## Checking a run

`node scripts/flake-check.js --report <playwright-json-report>` lists the tests the run marked flaky, marked tracked or NOT IN LEDGER. `--strict` exits 1 when a flake is not in the ledger.

## What is not enforced yet

Nothing in CI reruns a job on the operator's behalf, and no CI step runs `--strict` on pull requests. Adding that step is a separate decision. Until it is made, this policy is followed by the operator and checked locally.
