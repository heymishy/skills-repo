# Test Design Patterns — Cross-Cutting

Rules for writing tests that genuinely prove what they claim to prove, independent of any single domain. Extracted from recurring findings across multiple features (res-s2, res-s3, res-s4).

---

## Mutation-test a fix's own new test before trusting it

When a code-quality review or a corrective task adds a NEW test specifically to prove a specific bug is fixed, do not trust that the test passing means the fix is real. Temporarily revert the fix (or disable the specific guard/branch it added) and re-run the unmodified test. If the test still passes with the fix reverted, the test is not exercising what it claims to — it is passing for an unrelated reason.

**Confirmed pattern across three independent cases:**

- res-s2's path-traversal guard test passed even with the guard's `if` condition forced to never fire (`if (false && ...)`), because an unrelated pre-existing error handler produced an indistinguishable failure — caught only by disabling the guard and re-running.
- res-s4's Task 5 fixes (F1: third render site, O1: flag-union) were both independently reverted and re-confirmed to fail their own new tests, then restored and re-confirmed to pass, before being trusted.
- res-s4's Task 5b fix (N1: DOM-patch-in-place) had one of its own new tests caught as vacuous DURING this exact mutation-test discipline — see the next section.

**Rule:** For any test whose entire purpose is proving a specific code branch is what prevents/produces an outcome (not just that *some* related event occurred), revert the specific change under test and confirm the test then fails for the expected reason, before committing the test as evidence.

---

## A whole-file source-text regex assertion is vacuous if the same string legitimately appears elsewhere in the file

A test that asserts "attribute/string X is present in this source file" via an unscoped regex over the entire file passes even when X only appears in a DIFFERENT function than the one under test — most dangerously, when a producer and its consumer legitimately share the same literal (an attribute name, an event name, a class name).

**Confirmed case (res-s4, Task 5b):** an initial test asserted `data-stage-id` appears somewhere in `skills.js`'s source, intending to prove the SERVER-side render emits the attribute. It would have passed even if that server-side emission were removed entirely, because the CLIENT-side consumer code (`document.querySelector('.sn-steps li[data-stage-id="..."]')`) also legitimately contains the same string. Caught via the mutation-test discipline above (removing the server-side emission left the test passing), then rewritten to assert directly against RENDERED HTML OUTPUT (the actual `<li data-stage-id="...">` in a real render call) instead of file-wide source search.

**Rule:** When a source-inspection test is the only available technique (e.g. no DOM/jsdom harness for client-side JS), scope the regex match to the specific function/component under test — not the whole file — or prefer asserting against genuine render OUTPUT over source TEXT wherever a render call is reachable. Before trusting a whole-file source-regex test, ask: "does this exact string also legitimately appear in this string's own consumer or producer elsewhere in the file?" If yes, the test needs narrowing.

---

## Source

- res-s2 `decisions.md`, path-traversal guard mutation-test finding (2026-08-28)
- res-s4 `capture-log.md` and `decisions.md`, Task 5/5b mutation-test findings (2026-08-29)
