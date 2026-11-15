# Verification script: anf-s1 (artefact not found: fast, and never 503 for an impossible link)

Steps 1 to 8 are covered by `node tests/check-anf-s1-artefact-not-found.js`, `node tests/check-adlr-s1-artefact-link-resolution.js`, `node tests/check-cat-s5-artefact-fetch-integration.js` and the full suite; step 9 needs the operator's session.

1. T1: control character, leftover `%`, empty and over-long slug or type answer 404 "artefact not found" with no GitHub request and no report.
2. T2: traversal-shaped types and slugs answer the same 404.
3. T3a, T3b: well-formed requests fetch and render as before; every real directory under `artefacts/` passes the slug check.
4. T4: the real route table answers 404 for `/artefact/%00/%00` and `/artefact/%E0%A4%A/discovery` without calling GitHub; unsigned stays 302.
5. T5: an unknown bare name is reported not found in under 1.5 s with 150 ms per request.
6. T6: probe priority order, earlier failure still raises, at most 24 requests.
7. T7: a real upstream failure is still 503.
8. T8 and the full suite: validation never throws; only the known baseline failures.
9. **Live (read-only requests):** signed in on skills-framework.fly.dev, request `/artefact/%00/%00` (expect 404 immediately, no new GitHub issue within a few minutes) and `/artefact/some-unknown-slug/not-a-real-artefact` (expect 404 in noticeably under the old ~6 s; note the time).
