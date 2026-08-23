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
  const res = await ctx.get(path);
  const html = await res.text();
  const csrfMatch = html.match(/name="_csrf" value="([^"]*)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : null;
  if (!csrfToken) {
    throw new Error((label || path) + ' did not embed a _csrf token');
  }
  return csrfToken;
}

module.exports = { getCsrfToken };
