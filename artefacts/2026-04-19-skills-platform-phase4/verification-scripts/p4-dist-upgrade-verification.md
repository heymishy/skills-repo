# Verification Script: p4-dist-upgrade

**Story:** Upgrade command with diff and confirm flow
**Operator scenarios:** Run after implementation to confirm AC coverage.

---

## Scenario 1 — Diff and confirm flow (AC1)

**Setup:** Consumer with existing sidecar pinned to an older ref. Upstream has newer content.
**Run:** `skills-repo upgrade` (interactive)
**Expected:** Command presents a diff listing each changed skill. Waits for `y/N` prompt. Does not modify files until confirmed.

---

## Scenario 2 — Confirmed upgrade → verify passes (AC2)

**Setup:** Same as Scenario 1, confirm with `y`.
**Run:** `skills-repo upgrade` → confirm `y`
**Expected:** Sidecar updated. `skills-repo verify` runs automatically and passes. Lockfile `pinnedRef` updated. Lockfile `previousPinnedRef` set to old ref.

---

## Scenario 3 — Abort leaves sidecar unchanged (AC3)

**Setup:** Consumer with existing sidecar.
**Run:** `skills-repo upgrade` → respond `N`
**Expected:** `diff -r .skills-repo-before .skills-repo-after` (or equivalent snapshot comparison) shows zero differences. Lockfile unchanged.

---

## Scenario 4 — POLICY.md floor change highlighted (AC4)

**Setup:** Upstream has a skill with a POLICY.md floor version bump.
**Run:** `skills-repo upgrade` (show diff before confirming)
**Expected:** Diff output contains `"⚠ POLICY FLOOR CHANGE:"` before the relevant skill diff line.

---

## Scenario 5 — C4: No silent upgrade in non-interactive CI (AC1 / NFR)

**Setup:** CI environment with no terminal (non-interactive mode), no `--confirm` flag.
**Run:** `skills-repo upgrade`
**Expected:** Exits non-zero with message: "Upgrade requires operator confirmation — run with --confirm flag or interactively".

---

## Scenario 6 — NFR: No credentials in diff output

**Run:** `skills-repo upgrade 2>&1 | grep -iE '(token|Bearer|password|secret)'`
**Expected:** Zero matches.
