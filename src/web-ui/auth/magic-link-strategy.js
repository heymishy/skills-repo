'use strict';

// magic-link-strategy.js -- story-3-self-service-provisioning
// (artefacts/2026-07-30-agency-client-organisations)
//
// ONE shared Passport.js + passport-magic-login strategy instance,
// registered here and ONLY here. Story 3 (this story) wires it for
// invitation issuance/redemption; Story 4 (dual-path authentication) reuses
// the SAME registered instance for ongoing magic-link login by calling
// setVerifyCallback() to extend/replace the verify() callback -- Story 4
// must NEVER call registerMagicLinkStrategy() a second time, which would
// construct a second, divergent strategy instance even though
// passport.use() would silently let it replace the registered slot. See
// decisions.md (2026-07-31 ARCH entry, Stories 3+4) for the full writeup,
// and CLAUDE.md's Coding Agent Instructions for this story ("be deliberate
// about where you register the strategy").
//
// Passport.js does NOT own sessions here (decisions.md, same entry) -- it is
// used purely as the token-issuance/verification engine (the real
// `passport-magic-login` MagicLoginStrategy: .send() issues a signed JWT
// magic link; the verify() callback resolves the payload to a
// user/session). Callers (routes/agency-provisioning.js) populate
// req.session fields and rotate the session ID themselves afterward, using
// this app's own existing session middleware (middleware/session.js) --
// exactly the same shape as routes/auth.js's OAuth callback and
// routes/auth-email.js's signup/login.
//
// Why authenticate() is invoked manually instead of through
// passport.authenticate(): the real `strategy.authenticate(req)` (see
// node_modules/passport-magic-login/src/index.ts) is a Passport
// Strategy-protocol method that expects `this.fail/this.success/this.error`
// to be supplied by Passport's own Express-style `passport.authenticate()`
// middleware. This app has no such middleware pipeline (raw
// http.createServer -- web-ui-patterns.md's "no Express" stack constraint).
// verifyMagicLinkToken() below binds a minimal {fail, success, error}
// context object itself and calls strategy.authenticate.call(...) directly,
// so the EXACT SAME JWT-decode logic and the EXACT SAME registered verify()
// callback the real npm package ships run unmodified, without requiring a
// full Express/Passport middleware stack this app does not have.

const passport = require('passport');
const MagicLoginStrategy = require('passport-magic-login').default;

const STRATEGY_NAME = 'magiclogin';

let _strategy = null;
let _verifyCallback = null;

/**
 * Register the ONE shared magic-login strategy instance at server startup
 * (server.js). Must be called exactly once per process. Story 4 must use
 * setVerifyCallback() to extend behaviour -- NOT call this function again.
 * @param {{secret: string, callbackUrl: string, sendMagicLink: Function, verify: Function, jwtOptions?: object}} options
 * @returns {object} the registered MagicLoginStrategy instance
 */
function registerMagicLinkStrategy(options) {
  _verifyCallback = options.verify;
  _strategy = new MagicLoginStrategy({
    secret: options.secret,
    callbackUrl: options.callbackUrl,
    jwtOptions: options.jwtOptions || { expiresIn: '60min' },
    sendMagicLink: options.sendMagicLink,
    verify: function(payload, callback, req) {
      return _verifyCallback(payload, callback, req);
    }
  });
  passport.use(STRATEGY_NAME, _strategy);
  return _strategy;
}

/**
 * Story 4 extension point: replace the verify() callback the ONE registered
 * strategy instance delegates to, WITHOUT creating a second strategy
 * instance. Throws if the strategy has not been registered yet.
 * @param {Function} fn
 */
function setVerifyCallback(fn) {
  if (!_strategy) {
    throw new Error('Adapter not wired: magicLoginStrategy. Call registerMagicLinkStrategy() before setVerifyCallback().');
  }
  _verifyCallback = fn;
}

/** @returns {object} the registered strategy instance (throws if unregistered) */
function getStrategy() {
  if (!_strategy) {
    throw new Error('Adapter not wired: magicLoginStrategy. Call registerMagicLinkStrategy() with a real implementation before use.');
  }
  return _strategy;
}

/**
 * Issue a magic link for `destination` (the invited email), carrying `extra`
 * fields (e.g. { invitationId }) through the signed JWT payload alongside
 * `destination`. Delegates to the real strategy's own .send() (an
 * Express-middleware-shaped function -- see module header) via a minimal
 * req/res shim, so the exact same JWT-signing code path the npm package
 * ships is exercised, not a reimplementation of it.
 * @param {string} destination
 * @param {object} [extra]
 * @returns {Promise<{success: boolean, code?: string, error?: any}>}
 */
function issueMagicLink(destination, extra) {
  const strategy = getStrategy();
  return new Promise(function(resolve, reject) {
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: Object.assign({ destination: destination }, extra || {})
    };
    const res = {
      _status: 200,
      status: function(code) { this._status = code; return this; },
      json: function(body) { resolve(Object.assign({ httpStatus: this._status }, body)); },
      send: function(text) { reject(new Error('magic link send failed: ' + text)); }
    };
    try {
      strategy.send(req, res);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Verify a redeemed token by running it through the registered strategy's
 * real authenticate() JWT-decode + the registered verify() callback -- see
 * module header for why this binds {fail, success, error} directly instead
 * of routing through Passport's Express middleware.
 * @param {string} token
 * @param {object} [req] - forwarded to the verify() callback as its third argument
 * @returns {Promise<{ok: boolean, user?: object, info?: any}>}
 */
function verifyMagicLinkToken(token, req) {
  const strategy = getStrategy();
  return new Promise(function(resolve, reject) {
    const fakeReq = Object.assign({ query: { token: token } }, req || {});
    strategy.authenticate.call({
      // _options must be bound too -- authenticate() reads self._options.secret
      // to decode the JWT and self._options.verify to resolve the payload.
      _options: strategy._options,
      fail: function(info) { resolve({ ok: false, info: info }); },
      success: function(user, info) { resolve({ ok: true, user: user, info: info }); },
      error: function(err) { reject(err); }
    }, fakeReq);
  });
}

/** Test-only reset -- clears the registered strategy/verify callback. */
function _resetForTesting() {
  _strategy = null;
  _verifyCallback = null;
}

module.exports = {
  STRATEGY_NAME,
  registerMagicLinkStrategy,
  setVerifyCallback,
  getStrategy,
  issueMagicLink,
  verifyMagicLinkToken,
  _resetForTesting
};
