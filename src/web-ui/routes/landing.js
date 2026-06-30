'use strict';

// landing.js — GET / public landing page route handler
// Serves the skills platform landing page to unauthenticated visitors.
// Redirects authenticated users (req.session.accessToken set) to /journeys.
// No Express — uses raw writeHead/end pattern.
// No external npm dependencies — HTML served from a static file.

const fs   = require('fs');
const path = require('path');

// HTML loaded once at module init from a static file.
// Path assembled from __dirname + literal segment — never from request data.
const _LANDING_HTML = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'landing.html'),
  'utf8'
);

// ---------------------------------------------------------------------------
// bee.3 — PostHog CDN snippet helpers (AC1, AC3, AC4, AC8)
// ---------------------------------------------------------------------------

/**
 * Build the PostHog CDN initialisation snippet for the landing page.
 * Returns empty string when key is falsy or empty (AC8 graceful degradation).
 * Includes posthog.capture('landing_page_view') on load (AC3).
 * Uses the standard PostHog stub array — queues calls before the CDN loads.
 * @param {string} key - process.env.POSTHOG_KEY value
 * @returns {string} HTML snippet to inject before </body>
 */
function buildPostHogSnippet(key) {
  if (!key) return '';
  return '<script async src="https://us-assets.i.posthog.com/static/array.js"></script>' +
    '<script>' +
    '!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){' +
    'function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}' +
    '(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,' +
    'p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",' +
    '(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);' +
    'var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},' +
    'u.people.toString=function(){return u.toString(1)+" (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group resetGroups setPersonProperties get_distinct_id getGroups get_session_id get_session_replay_url startSessionRecording stopSessionRecording".split(" "),' +
    'n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])}e.__SV=1}(document,window.posthog||(window.posthog=[]));' +
    'posthog.init("' + key + '",{api_host:"https://us.i.posthog.com",person_profiles:"always"});' +
    'posthog.capture("landing_page_view");' +
    '</script>';
}

/**
 * Build the CTA click-tracking script for the landing page.
 * Returns empty string when key is falsy or empty (AC8 graceful degradation).
 * Uses typeof guard (AC4) — navigation is never blocked.
 * @param {string} key - process.env.POSTHOG_KEY value
 * @returns {string} HTML script tag
 */
function buildCtaScript(key) {
  if (!key) return '';
  return '<script>' +
    'document.addEventListener("DOMContentLoaded",function(){' +
    'var cta=document.querySelector(\'a[href="/auth/github"]\');' +
    'if(cta){cta.addEventListener("click",function(){' +
    'if(typeof posthog !== \'undefined\'){posthog.capture(\'cta_clicked\');}' +
    '});}' +
    '});' +
    '</script>';
}

/**
 * Handle GET / — public landing page.
 *
 * Session check uses req.session.accessToken (canonical field).
 * The old-style token field is NOT checked — only accessToken is authoritative.
 *
 * @param {object} req
 * @param {object} res
 */
function handleLanding(req, res) {
  // AC2: redirect authenticated users to the journey dashboard.
  // Only req.session.accessToken signals an authenticated session.
  if (req.session && req.session.accessToken) {
    res.setHeader('Location', '/journeys');
    res.writeHead(302);
    res.end();
    return;
  }

  // AC1/AC3/AC4/AC8: inject PostHog snippet when POSTHOG_KEY is set and non-empty.
  var key = process.env.POSTHOG_KEY || '';
  var html = _LANDING_HTML;
  if (key) {
    var phSnippet = buildPostHogSnippet(key);
    var ctaScript = buildCtaScript(key);
    html = html.replace('</body>', phSnippet + ctaScript + '</body>');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.writeHead(200);
  res.end(html);
}

module.exports = { handleLanding };
