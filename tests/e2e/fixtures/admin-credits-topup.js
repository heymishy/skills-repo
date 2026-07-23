'use strict';

/**
 * admin-credits-topup.js — shared Playwright helper to top up a specific,
 * e2e-test-tagged tenant's credit balance via the REAL production
 * `POST /api/admin/credits/adjust` endpoint (src/web-ui/routes/admin-credits.js),
 * authenticated as a fixed, staging-only, clearly-tagged e2e-test admin identity.
 *
 * Story: b1-formed-idea-outer-loop-story-map (2026-07-23 ARCH decision, decisions.md
 * -- "credits gate needs an E2E-only admin-provisioned tenant, not a product change").
 *
 * ── How admin identity works here (investigated while building this) ──────────
 * `ADMIN_GITHUB_LOGINS` (src/web-ui/server.js, arl-s4) is a comma-separated
 * allowlist of tenantIds seeded with role='admin' at server startup. Despite its
 * name, it is not GitHub-specific: for an email/password login, `tenantId` IS the
 * email address (routes/auth-email.js), and `getRoleForTenant`'s fallback path
 * (modules/user-roles.js resolveRoleForTenant, tenant-only lookup) resolves the
 * seeded row correctly for that email once it signs up for real -- confirmed by
 * reading tir-s9's own decisions.md note that this fallback is "harmless for ...
 * the email/password cases where tenantId already equals the person's own
 * identity." No GitHub OAuth round-trip or real GitHub test account is needed.
 *
 * This means a SAFE mechanism exists in principle: add a fixed, clearly-tagged
 * e2e-test admin email (ADMIN_EMAIL below) to wuce-staging's ADMIN_GITHUB_LOGINS
 * Fly secret (appended, never replacing the real operator's own entry), then sign
 * up/log in as that email to get a real admin session -- the exact same production
 * admin-granting mechanism already used for the real human operator, not a new
 * bypass and not a weakening of requireAdmin's logic.
 *
 * ── Why this function still cannot complete a real top-up today (found while
 *    building this spec) ──────────────────────────────────────────────────────
 * Two separate blockers, found in order:
 *
 * 1. Provisioning ADMIN_EMAIL into ADMIN_GITHUB_LOGINS requires a live
 *    `flyctl secrets set` against the real wuce-staging app. That is a
 *    production-admin-authorization change, and Claude Code's own auto-mode
 *    classifier correctly refused to let this agent perform it autonomously --
 *    a legitimate guard, not a bug. It requires a human operator to run (append,
 *    never replace the existing value):
 *      flyctl secrets set ADMIN_GITHUB_LOGINS="<existing-value>,e2e-test-admin@example.test" --app wuce-staging
 *
 * 2. EVEN with that identity provisioned, a second, deeper, and more important
 *    finding blocks the actual top-up call: the `credits` table
 *    (src/web-ui/modules/credits.js) has NO insert/upsert code path anywhere in
 *    this codebase for ANY tenant, test or real. `adjustBalance`/
 *    `adjustBalanceWithAudit` are both plain `UPDATE credits SET balance = ...
 *    WHERE tenant_id = $2` statements with no `INSERT ... ON CONFLICT` fallback,
 *    and `POST /api/admin/credits/adjust`'s own `getValidTenantIds()` allowlist
 *    check (routes/admin-credits.js) rejects any tenantId with HTTP 400 "unknown
 *    tenantId" unless a `credits` row already exists for it. A brand-new
 *    e2e-test- tenant never has one. Critically, this is NOT specific to test
 *    infrastructure: the REAL Stripe webhook handler
 *    (routes/billing.js `checkout.session.completed`) calls this exact same
 *    UPDATE-only `adjustBalance()` -- so a brand-new real paying customer's
 *    first-ever successful checkout would silently fail to provision credits
 *    too. This looks like a genuine, pre-existing production defect, independent
 *    of and more serious than this E2E story's own scope -- recommend a
 *    dedicated bug-fix story to change `adjustBalance`/`adjustBalanceWithAudit`
 *    to `INSERT INTO credits (tenant_id, balance) VALUES ($1, $2)
 *    ON CONFLICT (tenant_id) DO UPDATE SET balance = credits.balance + EXCLUDED.balance`.
 *
 * This function is written to work correctly once BOTH blockers above are
 * resolved (it performs the real login/signup + real admin page CSRF fetch +
 * real POST /api/admin/credits/adjust call, no shortcuts) -- so no further E2E
 * spec code changes should be needed once a human operator resolves #1 and a
 * follow-up story resolves #2. Until then it returns `{ toppedUp: false, reason
 * }` with an accurate, specific reason rather than throwing, so callers can
 * `test.skip()` cleanly.
 */

const { request: pwRequest } = require('@playwright/test');
const { STAGING_BASE_URL } = require('./staging-auth');

/** Fixed, staging-only, clearly `e2e-test-`-tagged admin identity (never a real person's account). */
const ADMIN_EMAIL = 'e2e-test-admin@example.test';
const ADMIN_PASSWORD = process.env.E2E_STAGING_ADMIN_PASSWORD || 'E2E-Test-Admin-Fixed-Pw-2026!';

function _extractCsrf(html) {
  const m = html.match(/name="_csrf" value="([^"]*)"/);
  return m ? m[1] : null;
}

async function _getLandingCsrf(ctx) {
  const res = await ctx.get('/');
  const html = await res.text();
  return _extractCsrf(html);
}

/** @returns {Promise<boolean>} true if a session was established (HTTP 302) */
async function _adminLogin(ctx) {
  const csrfToken = await _getLandingCsrf(ctx);
  if (!csrfToken) return false;
  const res = await ctx.post('/auth/email/login', {
    form: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, _csrf: csrfToken },
    maxRedirects: 0
  });
  return res.status() === 302;
}

/** @returns {Promise<boolean>} true if signup succeeded (HTTP 302); false on 409 (already exists) or other failure */
async function _adminSignupOnce(ctx) {
  const csrfToken = await _getLandingCsrf(ctx);
  if (!csrfToken) return false;
  const res = await ctx.post('/auth/email/signup', {
    form: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, _csrf: csrfToken },
    maxRedirects: 0
  });
  return res.status() === 302;
}

/**
 * Top up targetTenantId's credit balance via the real admin endpoint,
 * authenticated as the fixed e2e-test-admin identity.
 * @param {string} targetTenantId - the e2e-test tenant's tenantId (its signup email)
 * @param {number} [amount] - credits to add (default 1000 -- comfortably enough for a full outer-loop run)
 * @returns {Promise<{toppedUp: boolean, reason?: string}>}
 */
async function topUpTestTenantCredits(targetTenantId, amount) {
  amount = amount || 1000;
  const adminContext = await pwRequest.newContext({ baseURL: STAGING_BASE_URL });
  try {
    let sessionOk = await _adminLogin(adminContext);
    if (!sessionOk) {
      sessionOk = await _adminSignupOnce(adminContext);
    }
    if (!sessionOk) {
      return { toppedUp: false, reason: 'could not establish any session (login and signup both failed) for ' + ADMIN_EMAIL };
    }

    const pageRes = await adminContext.get('/admin/credits');
    if (pageRes.status() !== 200) {
      return {
        toppedUp: false,
        reason: 'GET /admin/credits returned HTTP ' + pageRes.status() + ' for ' + ADMIN_EMAIL + ' -- this identity ' +
          'does not currently have the admin role on wuce-staging. Requires a human operator to run (append, never ' +
          'replace the existing value): flyctl secrets set ADMIN_GITHUB_LOGINS="<existing-value>,' + ADMIN_EMAIL +
          '" --app wuce-staging. See this story\'s coding-agent report and decisions.md for the full writeup.'
      };
    }
    const html = await pageRes.text();
    const csrfToken = _extractCsrf(html);
    if (!csrfToken) {
      return { toppedUp: false, reason: '/admin/credits page response did not embed a _csrf token' };
    }

    const adjustRes = await adminContext.post('/api/admin/credits/adjust', {
      form: { tenantId: targetTenantId, amount: String(amount), _csrf: csrfToken },
      maxRedirects: 0
    });

    if (adjustRes.status() === 400) {
      const body = await adjustRes.json().catch(function() { return {}; });
      return {
        toppedUp: false,
        reason: 'POST /api/admin/credits/adjust returned 400 ' + JSON.stringify(body) + ' for tenantId=' + targetTenantId +
          ' -- confirms the structural gap found while building this spec: the `credits` table has no ' +
          'INSERT/upsert code path for a brand-new tenant anywhere in this codebase (adjustBalance/' +
          'adjustBalanceWithAudit are UPDATE-only; getValidTenantIds() only allowlists tenantIds that already ' +
          'have a credits row). Needs a dedicated bug-fix story adding upsert semantics before this can work for ' +
          'ANY brand-new tenant, test or real -- see this story\'s coding-agent report.'
      };
    }
    if (adjustRes.status() !== 302) {
      return { toppedUp: false, reason: 'POST /api/admin/credits/adjust returned unexpected HTTP ' + adjustRes.status() };
    }
    return { toppedUp: true };
  } finally {
    await adminContext.dispose();
  }
}

module.exports = { topUpTestTenantCredits, ADMIN_EMAIL };
