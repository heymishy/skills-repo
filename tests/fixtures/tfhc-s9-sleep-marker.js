#!/usr/bin/env node
'use strict';
const fs = require('fs');
const logPath = process.env.TFHC_S9_LOG_PATH;
const sleepMs = parseInt(process.env.TFHC_S9_SLEEP_MS || '100', 10);
if (!logPath) {
  console.error('[tfhc-s9-sleep-marker] TFHC_S9_LOG_PATH not set');
  process.exit(1);
}
fs.appendFileSync(logPath, 'START ' + process.pid + ' ' + Date.now() + '\n');
setTimeout(function() {
  fs.appendFileSync(logPath, 'END ' + process.pid + ' ' + Date.now() + '\n');
  process.exit(0);
}, sleepMs);
