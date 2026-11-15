'use strict';

// src/web-ui/utils/invalid-id-error.js -- uid-s1, ure-s1
//
// A malformed value in a URL is a client mistake, not a server defect: answer 404 (the same answer an unknown id or page
// gets) and do not report it as an error. Two cases are recognised, each deliberately narrow so a genuine server bug is
// never hidden:
//
//  1. uid-s1: a malformed id (for example /products/not-a-uuid) reaches Postgres as written and is refused with SQLSTATE
//     22P02, message `invalid input syntax for type uuid: "<value>"`. Matches only if that quoted value is non-empty AND
//     appears in the request url (raw or percent-decoded).
//  2. ure-s1: a broken percent-escape (for example /journey/x/stage/%E0%A4%A) makes decodeURIComponent throw
//     `URIError: URI malformed`. Matches only if the request's own url really cannot be decoded, so a URIError raised from
//     data that did not come from the url stays a reported 500.

var UUID_SYNTAX_MESSAGE = /^invalid input syntax for type uuid: "([^"]*)"/;

function isUuidSyntaxError(err, req) {
  if (err.code !== '22P02') { return false; }
  var message = err.message;
  if (typeof message !== 'string') { return false; }
  var match = UUID_SYNTAX_MESSAGE.exec(message);
  if (!match || !match[1]) { return false; }
  var url = req && req.url;
  if (typeof url !== 'string') { return false; }
  var value = match[1];
  if (url.indexOf(value) !== -1) { return true; }
  try { return decodeURIComponent(url).indexOf(value) !== -1; } catch (_decodeErr) { return false; }
}

// True only if the url (path segments or query) contains an escape that decodeURIComponent rejects. A url that decodes
// fine means the URIError did not come from it.
function urlCannotBeDecoded(url) {
  if (typeof url !== 'string') { return false; }
  try { decodeURIComponent(url); return false; } catch (_) { return true; }
}

function isMalformedEscapeError(err, req) {
  if (err.name !== 'URIError' || err.message !== 'URI malformed') { return false; }
  return urlCannotBeDecoded(req && req.url);
}

/**
 * @param {*} err - whatever a failed handler threw or rejected with
 * @param {{url?: string}} req
 * @returns {boolean} true only for a client mistake in the request url (see the two cases above). Never throws.
 */
function isInvalidIdError(err, req) {
  try {
    if (!err || typeof err !== 'object') { return false; }
    return isUuidSyntaxError(err, req) || isMalformedEscapeError(err, req);
  } catch (_) {
    return false;
  }
}

/**
 * The same answer handleGetProductView gives a well-formed but unknown id. Writes nothing if the response has
 * already been sent or ended.
 */
function respondNotFound(res) {
  if (res.headersSent || res.writableEnded) { return; }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
}

module.exports = { isInvalidIdError, respondNotFound };
