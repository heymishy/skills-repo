# Verification Script: p4-dist-install

**Story:** Sidecar install via init command without forking
**Operator scenarios:** Run after implementation to confirm AC coverage.

---

## Scenario 1 — Full init flow (AC1)

**Setup:** Fresh consumer repo, `.github/context.yml` with valid `skills_upstream.repo`. Record `BEFORE=$(git rev-list --count HEAD)`.
**Run:** `skills-repo init`
**Expected:**
- Sidecar directory exists (path per Spike C output, e.g. `.skills-repo/`)
- `skills-lock.json` exists inside the sidecar
- `.gitignore` contains the sidecar directory name
- `AFTER=$(git rev-list --count HEAD)` equals BEFORE
- `git status` shows no staged or modified tracked files

---

## Scenario 2 — Skill isolation (AC2)

**Setup:** After a successful init.
**Run:** `find . -name "SKILL.md" -not -path "./.skills-repo/*"` (adjust sidecar path per Spike C)
**Expected:** Zero results. No SKILL.md file exists outside the sidecar.

---

## Scenario 3 — Missing upstream config → pre-network error (AC3)

**Setup:** Consumer repo with `skills_upstream.repo` absent from context.yml.
**Run:** `skills-repo init`
**Expected:** Exits non-zero. Error message is exactly: `"No upstream source configured — set skills_upstream.repo in .github/context.yml"`. No network request made.

---

## Scenario 4 — Already installed (AC4)

**Setup:** Consumer repo with sidecar already installed.
**Run:** `skills-repo init` (second run)
**Expected:** Either:
  (a) Exits with error containing "Sidecar already installed — run `skills-repo upgrade` to update", OR
  (b) Completes with identical sidecar + lockfile and zero additional commits.
In both cases: `git rev-list --count HEAD` unchanged.

---

## Scenario 5 — NFR: No credentials in output or lockfile

**Run:** `skills-repo init 2>&1 | grep -iE '(token|password|secret|key=|apikey)'`
**And:** Inspect `skills-lock.json` for credential fields.
**Expected:** Zero matches in both checks.
