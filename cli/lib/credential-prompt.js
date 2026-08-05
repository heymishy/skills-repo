'use strict';

// credential-prompt.js — rb-s4 AC1 / Security NFR
//
// Prompts for the SaaS credential interactively, without ever reading it
// from an environment variable or accepting it as a CLI argument
// (product/constraints.md #12 -- credentials are structural, never in the
// agent's environment). No external npm dependency, consistent with
// scripts/platform-fetch.js's zero-dependency style.
//
// When stdin is a real TTY, each keystroke is consumed in raw mode and
// never echoed back -- the credential never appears on screen. When stdin
// is not a TTY (piped input, as in this story's own test harness), falls
// back to a single-line readline read; it still never touches process.env
// or process.argv for the credential value.

const readline = require('readline');

const CTRL_C = String.fromCharCode(3);
const BACKSPACE = String.fromCharCode(127);
const BACKSPACE_ALT = '\b';

/**
 * @param {{ message?: string, input?: NodeJS.ReadStream, output?: NodeJS.WriteStream }} [opts]
 * @returns {Promise<string>}
 */
function promptForCredential(opts) {
  opts = opts || {};
  const message = opts.message || 'SaaS credential (input hidden): ';
  const input = opts.input || process.stdin;
  const output = opts.output || process.stdout;

  if (!input.isTTY) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({ input, output, terminal: false });
      rl.on('line', (line) => {
        rl.close();
        resolve(line);
      });
    });
  }

  return new Promise((resolve, reject) => {
    output.write(message);
    let value = '';

    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');

    function cleanup() {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
    }

    function onData(chunk) {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          cleanup();
          output.write('\n');
          resolve(value);
          return;
        }
        if (char === CTRL_C) {
          cleanup();
          reject(new Error('Credential prompt cancelled'));
          return;
        }
        if (char === BACKSPACE || char === BACKSPACE_ALT) {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    }

    input.on('data', onData);
  });
}

module.exports = { promptForCredential };
