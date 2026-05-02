'use strict';
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'web-ui', 'server.js');
const content = fs.readFileSync(file, 'utf8');

// Find and replace the entire conflict block
const conflictStart = content.indexOf('<<<<<<<');
const conflictEnd = content.lastIndexOf('>>>>>>> feat: wuce.7 -- Programme manager pipeline status view') + '>>>>>>> feat: wuce.7 -- Programme manager pipeline status view'.length;

if (conflictStart === -1) {
  console.log('No conflict markers found — nothing to fix.');
  process.exit(0);
}

const replacement = [
  "  } else if (pathname === '/sign-off' && req.method === 'POST') {",
  "    authGuard(req, res, () => handleSignOff(req, res));",
  "",
  "  } else if (/^\\/artefact\\/[^/]+\\/discovery$/.test(pathname) && req.method === 'GET') {",
  "    const slug = pathname.split('/')[2];",
  "    authGuard(req, res, () => handleArtefactRead(req, res, slug));",
  "",
  "  } else if (pathname === '/api/actions' && req.method === 'GET') {",
  "    await handleGetActions(req, res);",
  "",
  "  } else if (pathname === '/status/export' && req.method === 'GET') {",
  "    await handleGetStatusExport(req, res);",
  "",
  "  } else if (pathname === '/status' && req.method === 'GET') {",
  "    await handleGetStatus(req, res);"
].join('\n');

const fixed = content.slice(0, conflictStart) + replacement + content.slice(conflictEnd);
const remaining = (fixed.match(/(<<<<<<<|=======|>>>>>>>)/g) || []).length;

fs.writeFileSync(file, fixed, 'utf8');
console.log('Fixed server.js. Remaining conflict markers:', remaining);
