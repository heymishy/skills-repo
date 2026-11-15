# Verification script: sps-s1 (login survives a deploy)

Steps 1 to 8 are covered by `node tests/check-sps-s1-encrypted-session-token.js`, the edited existing tests and the full suite; step 9 needs the operator.

1. T1: with a key the stored value has `accessTokenEnc` and no plaintext token; nonces differ between writes.
2. T2: read and load-all restore the token and every other field.
3. T3: a ciphertext moved to another session id yields no token.
4. T4: wrong key, corruption, tampering, unknown version and a bad key length all yield no token and never throw.
5. T5: with no key the token is stripped as today and one warning is logged.
6. T6a, T6b: through the real middleware and `authGuard`, a session survives a simulated restart when a key is set, and does not when none is.
7. T7: logout deletes the Redis key.
8. T8 and full suite: no secret in any log; only the known baseline failures; the edited existing tests pass.
9. **Live (operator):**
   1. Generate a 32-byte base64 key yourself and set it as the Fly secret `SESSION_ENCRYPTION_KEY` on staging, then production. Never paste it into chat.
   2. Deploy a build containing this change (the key is read at startup, so setting the secret restarts the app and signs everyone out once).
   3. Sign in on production.
   4. Trigger a second deploy (any later merge).
   5. Reload a signed-in page. Expected: still signed in, no sign-in prompt. If you are signed out, tell the agent; the agent checks the logs for the one-line startup warning that means the key was not read.
