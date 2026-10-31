#!/usr/bin/env node
'use strict';
const label = 'P' + process.pid;
const count = parseInt(process.env.TFHC_S9_LINE_COUNT || '5', 10);
const delayMs = parseInt(process.env.TFHC_S9_LINE_DELAY_MS || '15', 10);
let i = 0;
function next() {
  if (i >= count) { process.exit(0); return; }
  process.stdout.write(label + '-line-' + i + '\n');
  i++;
  setTimeout(next, delayMs);
}
next();
