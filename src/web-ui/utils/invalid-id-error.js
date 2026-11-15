'use strict';

// src/web-ui/utils/invalid-id-error.js -- uid-s1
//
// A malformed id in a URL (for example /products/not-a-uuid) reaches Postgres as written and is refused with
// SQLSTATE 22P02, message `invalid input syntax for type uuid: "<value>"`. That is a client mistake, not a server
// defect: answer 404 (the same answer an unknown id gets) and do not report it as an error.
//
// The match is deliberately narrow so a genuine server bug is never hidden: the error must be that database error
// AND its quoted value must be non-empty AND must appear in the request url (raw or percent-decoded). A uuid error
// whose value did not come from the request stays a reported 500.

var UUID_SYNTAX_MESSAGE = /^invalid input syntax for type uuid: "([^"]*)"/;

/**
 * @param {*} err - whatever a failed handler threw or rejected with
 * @param {{url?: string}} req
 * @returns {boolean} true only for a uuid-syntax database error caused by a value in the request url. Never throws.
 */
function isInvalidIdError(err, req) {
  try {
    if (!err || typeof err !== 'object' || err.code !== '22P02') { return false; }
    var message = err.message;
    if (typeof message !== 'string') { return false; }
    var match = UUID_SYNTAX_MESSAGE.exec(message);
    if (!match || !match[1]) { return false; }
    var url = req && req.url;
    if (typeof url !== 'string') { return false; }
    var value = match[1];
    if (url.indexOf(value) !== -1) { return true; }
    try { return decodeURIComponent(url).indexOf(value) !== -1; } catch (_decodeErr) { return false; }
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
