'use strict';

// posthog-client-snippet.js — rpiw-s1: shared builder for the client-side
// PostHog CDN init snippet, replacing the drift risk of near-identical
// copies previously duplicated across landing.js and journey.js (only one
// of which was ever reachable, and neither on the route real users hit).
//
// SECURITY (NFR-T1/T11, carried over from journey.js's existing pattern):
// callers must only ever pass session.login and session.tenantId into
// opts.identify. This module never reads req/session itself, so the
// invariant is enforced entirely by what call sites choose to pass in —
// but it never accepts or renders an `accessToken` field even if one is
// present on the identify object, as a defence-in-depth guard.

var POSTHOG_STUB =
  '!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){' +
  'function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}' +
  '(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,' +
  'p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",' +
  '(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);' +
  'var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},' +
  'u.people.toString=function(){return u.toString(1)+" (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group resetGroups setPersonProperties get_distinct_id getGroups get_session_id get_session_replay_url startSessionRecording stopSessionRecording".split(" "),' +
  'n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||(window.posthog=[]));';

/**
 * Build the PostHog CDN initialisation snippet, with an optional identify()
 * call and an optional capture(eventName) call appended.
 * Returns '' when key is falsy/empty (AC5 graceful degradation).
 *
 * SECURITY: opts.identify may only carry { login, tenantId } — any
 * accessToken field present on it is never rendered.
 *
 * @param {string} key - process.env.POSTHOG_KEY value
 * @param {{identify?: {login: string, tenantId: string}, captureEvent?: string}} [opts]
 * @returns {string} HTML script tag(s), or '' when key is falsy
 */
function buildPostHogScript(key, opts) {
  if (!key) return '';
  opts = opts || {};

  var script = '<script async src="https://us-assets.i.posthog.com/static/array.js"></script>' +
    '<script>' + POSTHOG_STUB +
    'posthog.init("' + key + '",{api_host:"https://us.i.posthog.com",person_profiles:"always"});';

  if (opts.identify && opts.identify.login) {
    script += 'posthog.identify("' + opts.identify.login + '",{tenant_id:"' + (opts.identify.tenantId || '') + '"});';
  }

  if (opts.captureEvent) {
    script += 'posthog.capture("' + opts.captureEvent + '");';
  }

  script += '</script>';
  return script;
}

/**
 * Build a click-tracking script for a given CSS selector, firing a named
 * PostHog event on click. Guarded by typeof posthog !== 'undefined' so a
 * click is never blocked by a slow/failed PostHog load.
 * Returns '' when key is falsy/empty (AC5 graceful degradation).
 *
 * @param {string} key - process.env.POSTHOG_KEY value
 * @param {string} selector - CSS selector for the element to track
 * @param {string} eventName - PostHog event name to fire on click
 * @returns {string} HTML script tag, or '' when key is falsy
 */
function buildClickCaptureScript(key, selector, eventName) {
  if (!key) return '';
  return '<script>' +
    'document.addEventListener("DOMContentLoaded",function(){' +
    'var el=document.querySelector(' + JSON.stringify(selector) + ');' +
    'if(el){el.addEventListener("click",function(){' +
    'if(typeof posthog !== \'undefined\'){posthog.capture(' + JSON.stringify(eventName) + ');}' +
    '});}' +
    '});' +
    '</script>';
}

module.exports = { buildPostHogScript: buildPostHogScript, buildClickCaptureScript: buildClickCaptureScript };
