#!/usr/bin/env node
/**
 * review-server.js — Lightweight HTTP server for the pipeline review dashboard.
 *
 * Endpoints:
 *   GET  /health     → 200 {"ok":true}  (page polls this to show server-online badge)
 *   POST /advance    → reads .github/pipeline-state.json, updates feature stage, writes back
 *   POST /save       → writes an artefact .md file to disk (artefacts/ directory only)
 *   GET  /*          → serves static files from the repo root
 *
 * Usage:
 *   node scripts/review-server.js
 *   Then open: http://localhost:3131/dashboards/review.html
 *
 * Port: defaults to 3131, override with PORT env var.
 *   PORT=3132 node scripts/review-server.js
 *
 * No external dependencies — pure Node.js built-in modules only.
 */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT      = parseInt(process.env.PORT || '3131', 10);
const REPO_ROOT = path.resolve(__dirname, '..');
const STATE_PATH = path.join(REPO_ROOT, '.github', 'pipeline-state.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// ── CORS headers (allow review.html on any origin, e.g. Live Server) ─────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, code, data) {
  setCors(res);
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type':   'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendErr(res, code, message) {
  sendJson(res, code, { ok: false, error: message });
}

// ── Read full request body ────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data',  c => chunks.push(c));
    req.on('end',   () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// ── POST /advance — update feature stage in pipeline-state.json ──────────────
function handleAdvance(req, res) {
  readBody(req).then(raw => {
    let body;
    try {
      body = JSON.parse(raw);
    } catch (_) {
      return sendErr(res, 400, 'Invalid JSON body');
    }

    const { featureSlug, newStage } = body;
    if (!featureSlug || typeof featureSlug !== 'string') {
      return sendErr(res, 400, '"featureSlug" is required');
    }
    if (!newStage || typeof newStage !== 'string') {
      return sendErr(res, 400, '"newStage" is required');
    }

    if (!fs.existsSync(STATE_PATH)) {
      return sendErr(res, 404, '.github/pipeline-state.json not found');
    }

    let state;
    try {
      state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch (e) {
      return sendErr(res, 500, 'Failed to parse pipeline-state.json: ' + e.message);
    }

    const features = Array.isArray(state.features) ? state.features : [];
    const idx = features.findIndex(f => f.slug === featureSlug);
    if (idx < 0) {
      return sendErr(res, 404, 'Feature not found: ' + featureSlug);
    }

    const prevStage = features[idx].stage;
    features[idx].stage     = newStage;
    features[idx].updatedAt = new Date().toISOString();
    state.updated            = new Date().toISOString();

    // Write atomically: temp file → rename
    const tmpPath = STATE_PATH + '.tmp';
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2) + '\n', 'utf8');
      fs.renameSync(tmpPath, STATE_PATH);
    } catch (e) {
      // Clean up temp file on error
      try { fs.unlinkSync(tmpPath); } catch (_) { /* ignore */ }
      return sendErr(res, 500, 'Failed to write pipeline-state.json: ' + e.message);
    }

    console.log(`[advance] ${featureSlug}: ${prevStage} → ${newStage}`);
    sendJson(res, 200, { ok: true, featureSlug, prevStage, newStage });
  }).catch(e => sendErr(res, 500, e.message));
}

// ── POST /save — write an artefact .md file to disk ────────────────────────
function handleSave(req, res) {
  readBody(req).then(raw => {
    let body;
    try {
      body = JSON.parse(raw);
    } catch (_) {
      return sendErr(res, 400, 'Invalid JSON body');
    }

    const { filePath, content } = body;
    if (!filePath || typeof filePath !== 'string') {
      return sendErr(res, 400, '"filePath" is required');
    }
    if (typeof content !== 'string') {
      return sendErr(res, 400, '"content" is required');
    }

    // Security: only allow writing files under artefacts/
    const resolved = path.normalize(path.join(REPO_ROOT, filePath));
    const artefactsDir = path.join(REPO_ROOT, 'artefacts');
    if (!resolved.startsWith(artefactsDir + path.sep)) {
      return sendErr(res, 403, 'Save is only permitted for files under artefacts/');
    }

    // Only allow .md files
    if (path.extname(resolved).toLowerCase() !== '.md') {
      return sendErr(res, 403, 'Save is only permitted for .md files');
    }

    // Parent directory must already exist
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      return sendErr(res, 404, 'Directory does not exist: ' + path.dirname(filePath));
    }

    // Write atomically: temp file → rename
    const tmpPath = resolved + '.tmp';
    try {
      fs.writeFileSync(tmpPath, content, 'utf8');
      fs.renameSync(tmpPath, resolved);
    } catch (e) {
      try { fs.unlinkSync(tmpPath); } catch (_) { /* ignore */ }
      return sendErr(res, 500, 'Failed to write file: ' + e.message);
    }

    console.log(`[save] ${filePath} (${content.length} bytes)`);
    sendJson(res, 200, { ok: true, filePath });
  }).catch(e => sendErr(res, 500, e.message));
}

// ── GET /* — serve static files from the repo root ───────────────────────────
function serveFile(req, res) {
  let urlPath = req.url.split('?')[0].split('#')[0];

  // Default route: open the review dashboard
  if (urlPath === '/' || urlPath === '') {
    urlPath = '/dashboards/review.html';
  }

  // Security: prevent directory traversal outside the repo root
  const resolved = path.normalize(path.join(REPO_ROOT, urlPath));
  if (!resolved.startsWith(REPO_ROOT + path.sep) && resolved !== REPO_ROOT) {
    setCors(res);
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(resolved, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      setCors(res);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found: ' + urlPath);
    }

    const ext  = path.extname(resolved).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    setCors(res);
    res.writeHead(200, {
      'Content-Type':   mime,
      'Content-Length': stat.size,
      'Cache-Control':  'no-cache',
    });
    fs.createReadStream(resolved).pipe(res);
  });
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.writeHead(204);
    return res.end();
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res, 200, { ok: true, server: 'review-server', port: PORT });
  }

  // Stage advance
  if (req.method === 'POST' && req.url.split('?')[0] === '/advance') {
    return handleAdvance(req, res);
  }

  // Artefact save
  if (req.method === 'POST' && req.url.split('?')[0] === '/save') {
    return handleSave(req, res);
  }

  // Static files
  if (req.method === 'GET') {
    return serveFile(req, res);
  }

  sendErr(res, 405, 'Method Not Allowed');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log(`  review-server  →  http://localhost:${PORT}`);
  console.log(`  dashboard      →  http://localhost:${PORT}/dashboards/review.html`);
  console.log('');
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use.`);
    console.error(`  Try: PORT=3132 node scripts/review-server.js\n`);
  } else {
    console.error('Server error:', e.message);
  }
  process.exit(1);
});
