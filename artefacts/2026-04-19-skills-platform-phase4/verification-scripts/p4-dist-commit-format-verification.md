# Verification Script: p4-dist-commit-format

**Story:** Operator-configured commit-format validation
**Operator scenarios:** Run after implementation to confirm AC coverage.

---

## Scenario 1 — Non-matching commit blocked (AC1)

**Setup:** Set `distribution.commit_format_regex: "^JIRA-[0-9]+"` in context.yml. Make a commit with message `"fix: typo"` (does not match).
**Run:** `skills-repo advance`
**Expected:** Command exits non-zero. Output contains: 8-char commit SHA, excerpt of `"fix: typo"`, and the regex string `"^JIRA-[0-9]+"`. No state advance occurs.

---

## Scenario 2 — No config → no validation (AC2)

**Setup:** Remove `distribution.commit_format_regex` from context.yml entirely.
**Run:** `skills-repo advance`
**Expected:** Advance proceeds without format validation. No error about commit format.

---

## Scenario 3 — Matching commit passes (AC3)

**Setup:** `distribution.commit_format_regex: "^JIRA-[0-9]+"` in context.yml. Make a commit with message `"JIRA-42 feat: add new skill"`.
**Run:** `skills-repo advance`
**Expected:** Command proceeds. No format validation error.

---

## Scenario 4 — Invalid regex → friendly error (AC4)

**Setup:** Set `distribution.commit_format_regex: "[invalid"` (unclosed character class) in context.yml.
**Run:** `skills-repo advance` (or any distribution command that reads config)
**Expected:** Output contains `"distribution.commit_format_regex"` and `"context.yml"`. No Node.js `SyntaxError` stack trace visible to user.

---

## Scenario 5 — NFR: Commit message not sent externally

**Setup:** Network monitoring active (e.g. Wireshark filter on outbound HTTP).
**Run:** `skills-repo advance` with a failing format check.
**Expected:** No outbound network request containing the commit message text.
