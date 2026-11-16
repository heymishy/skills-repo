# Verification script: tvl-s1 (turn body validation)

Steps 1 to 8 are covered by `node tests/check-tvl-s1-turn-body-validation.js`, the existing turn test files and the full suite; step 9 needs the operator's staging session after deploy.

1. T1: malformed, empty or non-object bodies answer 400 INVALID_BODY with no model call, no credits and no lock left.
2. T2: missing, non-string, empty or whitespace answers answer 400 INVALID_ANSWER; `__init__` is still accepted.
3. T3a, T3b: oversized answers and bodies answer 413; the reader stops at the limit; exactly 100000 characters is accepted.
4. T4: a wrong skill name in the URL answers 404.
5. T5: the same on the streaming endpoint, as JSON before any SSE headers.
6. T6: valid turns (sentence, unicode, `__init__`) are unchanged on both endpoints.
7. T7, T8: no error reports and no input in logs; validation never throws.
8. Full suite: only the known baseline failures; the 30-odd existing turn tests pass.
9. **Live (staging, mock model, operator signed in):** from a signed-in staging page, replay the garbage set against a staging skill session: `{"answer": ` (malformed), `{}`, `{"answer":""}`, `{"answer":42}`, a 200 KB answer, a 2 MB answer, and a wrong skill name in the URL; expect 400, 400, 400, 400, 413, 413 and 404 respectively, and an ordinary answer still 200.
