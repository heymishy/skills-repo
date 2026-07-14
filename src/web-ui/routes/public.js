'use strict';

// public.js — GET / handler for the public landing page (lab-s1.2)
//             GET /welcome handler for first-login plan selection (lab-s2.3)
// Serves the Skills Platform landing page to unauthenticated visitors.
// Authenticated users (req.session.accessToken) are redirected to /dashboard.
// PostHog server-side event is fired fire-and-forget on each unauthenticated visit.

var fs   = require('fs');
var path = require('path');
var csrf = require('../middleware/csrf'); // sec-perf-s3

// HTML loaded once at module init — path uses __dirname, never request data (path traversal safe).
var _LANDING_HTML = fs.readFileSync(
  path.join(__dirname, '..', 'templates', 'landing.html'),
  'utf8'
);

// Welcome page HTML loaded once at module init (lab-s2.3).
var _WELCOME_HTML = fs.readFileSync(
  path.join(__dirname, '..', 'templates', 'welcome.html'),
  'utf8'
);

// Lazy getter for PostHog module — allows monkeypatching in tests without
// requiring the adapter at module load time.
function _getPosthog() {
  return require('../modules/posthog-server');
}

/**
 * Handle GET / — public landing page.
 *
 * AC3: Authenticated users (req.session.accessToken set) are redirected to /dashboard.
 * AC1: Unauthenticated visitors receive HTTP 200 with the landing page HTML.
 * AC4: A `landing_page_viewed` PostHog event is fired server-side (fire-and-forget).
 * AC6: The HTML response never contains session tokens or user identity data.
 *
 * Uses the raw http writeHead/end pattern — no Express dependency.
 *
 * @param {object} req
 * @param {object} res
 */
async function handleRoot(req, res) {
  // AC3: redirect authenticated users away from the landing page.
  // Only req.session.accessToken signals an authenticated session (canonical field).
  if (req.session && req.session.accessToken) {
    res.setHeader('Location', '/dashboard');
    res.writeHead(302);
    res.end();
    return;
  }

  // AC4: fire PostHog event — fire-and-forget (do NOT await).
  // Wrapped in try/catch so PostHog errors never affect the response.
  try {
    _getPosthog().capture('anonymous', 'landing_page_viewed');
  } catch (_) {}

  // sec-perf-s3 AC4: embed a session-scoped CSRF token into the sign-in/sign-up forms.
  // AC6 ("never contains session tokens or user identity data") is unaffected — a CSRF
  // token is a per-session anti-forgery nonce, not an access token or identity value
  // (see artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s3.md, Architecture
  // Constraints). The rest of the page remains the same static HTML as before this story.
  var csrfToken = csrf.generateCsrfToken(req);
  var html = _LANDING_HTML.split('<!--CSRF_TOKEN-->').join(csrf.csrfField(csrfToken));

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.writeHead(200);
  res.end(html);
}

/**
 * Build available plan options from env vars.
 * Plans whose price-ID env var is absent or contains 'PLACEHOLDER' are skipped (AC4/NFR).
 * Returns array of { id, name } objects.
 * @returns {Array<{id:string, name:string}>}
 */
function _buildPlanOptions() {
  var plans = [];

  var starterPriceId = process.env.STRIPE_PRICE_ID_STARTER || '';
  if (starterPriceId && !starterPriceId.includes('PLACEHOLDER')) {
    plans.push({
      id:   'starter',
      name: process.env.PLAN_NAME_STARTER || 'Starter'
    });
  }

  var proPriceId = process.env.STRIPE_PRICE_ID_PRO || '';
  if (proPriceId && !proPriceId.includes('PLACEHOLDER')) {
    plans.push({
      id:   'pro',
      name: process.env.PLAN_NAME_PRO || 'Pro'
    });
  }

  return plans;
}

/**
 * Handle GET /welcome — plan selection page for first-time users (lab-s2.3).
 *
 * AC3: Unauthenticated users → 302 /.
 * AC7: Authenticated users with no firstLogin flag → 302 /dashboard.
 * AC4: Authenticated first-time users (req.session.firstLogin = true) → 200 with plan options.
 * AC5: Each plan's form targets POST /billing/checkout with a planId field.
 * AC6: plan_selected PostHog event fired fire-and-forget when first-login user reaches page.
 *
 * @param {object} req
 * @param {object} res
 */
async function handleWelcome(req, res) {
  // AC3: unauthenticated → 302 /
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  // AC7: returning user (firstLogin absent or false) → 302 /dashboard
  if (!req.session.firstLogin) {
    res.writeHead(302, { Location: '/dashboard' });
    res.end();
    return;
  }

  // Build available plan options (placeholder-filtered)
  var plans = _buildPlanOptions();

  // sec-perf-s3 AC3: session-scoped CSRF token, embedded in each plan's checkout form below.
  var csrfToken = csrf.generateCsrfToken(req);

  // AC6: fire plan_selected PostHog event — fire-and-forget (do NOT await).
  // Fires once per welcome page view by a first-login user; planName is the first
  // available plan as proxy for "user entered the plan selection funnel".
  if (plans.length > 0) {
    try {
      _getPosthog().capture(
        String(req.session.userId || 'anonymous'),
        'plan_selected',
        { planName: plans[0].name }
      );
    } catch (_) {}
  }

  // Render plan option HTML — one card + form per available plan (AC4/AC5)
  var planOptionsHtml = plans.map(function(plan) {
    return (
      '<div class="plan-card">' +
        '<p class="plan-name">' + plan.name + '</p>' +
        '<form action="/billing/checkout" method="POST">' +
          csrf.csrfField(csrfToken) +
          '<input type="hidden" name="planId" value="' + plan.id + '">' +
          '<button type="submit">Get started</button>' +
        '</form>' +
      '</div>'
    );
  }).join('\n      ');

  var html = _WELCOME_HTML.replace('<!--PLAN_OPTIONS-->', planOptionsHtml);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.writeHead(200);
  res.end(html);
}

module.exports = { handleRoot, handleWelcome };
