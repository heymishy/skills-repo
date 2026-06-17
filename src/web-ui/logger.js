'use strict';

var pino = require('pino');

/**
 * Create a pino logger instance.
 * @param {{ destination?: NodeJS.WritableStream }} [opts]
 * @returns {import('pino').Logger}
 */
function createLogger(opts) {
  var dest;
  if (opts && opts.destination) {
    dest = opts.destination;
  } else if (process.env.NODE_ENV === 'test') {
    // Suppress pino output during test runs to avoid colliding with test assertions
    var { Writable } = require('stream');
    dest = new Writable({ write: function(_c, _e, cb) { cb(); } });
  } else {
    dest = pino.destination(1); // 1 = stdout fd
  }
  return pino({ level: 'info', timestamp: pino.stdTimeFunctions.isoTime }, dest);
}

module.exports = { createLogger: createLogger };
