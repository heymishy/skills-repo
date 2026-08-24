'use strict';

/**
 * csrf.js — shared Playwright helper for extracting a real, session-scoped
 * CSRF token before a raw (non-page-driven) POST to a form-protected route.
 *
 * rcfc-s1: extending sec-perf-s3's CSRF protection to the remaining
 * server-rendered POST forms broke every E2E spec that POSTs to one of
 * those routes via a raw request context (request.post/ctx.post/
 * page.request.post) rather than driving a real browser click — a raw POST
 * has no hidden _csrf field unless the caller fetches one first. A spec that
 * clicks a real rendered form's submit button is unaffected, since the
 * browser includes whatever hidden fields are actually in the DOM.
 *
 * Mirrors the pattern already established in tests/e2e/fixtures/staging-auth.js's
 * signUpEmail()/loginEmail() (extract from a real GET-rendered page's hidden
 * input), generalised for any GET path / any protected POST route.
 */

/**
 * GET `path` on the given request context and extract the session's real
 * _csrf token from the rendered HTML's hidden field.
 *
 * @param {import('@playwright/test').APIRequestContext} ctx
 * @param {string} path - a GET route whose rendered HTML embeds a `_csrf` hidden field
 * @param {string} [label] - optional label for the assertion failure message
 * @returns {Promise<string>}
 */
async function getCsrfToken(ctx, path, label) {
  const csrfToken = await getCsrfTokenOptional(ctx, path);
  if (!csrfToken) {
    throw new Error((label || path) + ' did not embed a _csrf token');
  }
  return csrfToken;
}

/**
 * Same as getCsrfToken(), but returns null instead of throwing when no
 * token is found — for @real-staging specs (Scenario A/B's CI-blocking
 * gates) that must keep passing against whatever is *currently deployed*
 * to real wuce-staging, which lags behind this branch until it merges and
 * redeploys. Before rcfc-s1 ships to staging, the target GET page won't
 * embed a _csrf field at all (matching pre-rcfc-s1 behaviour); after it
 * ships, a real token will be present and used. @mocked specs always run
 * against a fresh local server built from this branch's own code, so they
 * should prefer the strict getCsrfToken() above — a null return there would
 * silently mask a real regression instead of failing at the fetch site.
 *
 * @param {import('@playwright/test').APIRequestContext} ctx
 * @param {string} path
 * @returns {Promise<string|null>}
 */
async function getCsrfTokenOptional(ctx, path) {
  const res = await ctx.get(path);
  const html = await res.text();
  const csrfMatch = html.match(/name="_csrf" value="([^"]*)"/);
  return csrfMatch ? csrfMatch[1] : null;
}

module.exports = { getCsrfToken, getCsrfTokenOptional };
