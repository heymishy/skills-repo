#!/usr/bin/env node
/**
 * surface-adapter/resolver.js
 *
 * Surface type resolver — Path A (EA registry) and Path B (explicit-declaration).
 *
 * Path B: reads context.yml for surface.path: "explicit-declaration" and selects
 * the matching registered adapter. No outbound registry calls.
 *
 * Path A (p2.6): when context.yml contains registry_source: ea-registry,
 * registry_url, and app_id, performs an HTTPS GET to the EA registry, reads
 * technology.hosting to derive the surface type, and selects the adapter.
 * Falls back to Path B surface: declaration on registry unavailability.
 *
 * Security:
 *   MC-SEC-03 — registry_url must use HTTPS; plain HTTP is rejected before any call.
 *   MC-SEC-02 — only the resolved surface type string is logged; the full registry
 *               response body is never written to stdout/stderr.
 *
 * Reference: artefacts/2026-04-09-skills-platform-phase1/stories/p1.2-surface-adapter-model-foundations.md
 * Reference: artefacts/2026-04-11-skills-platform-phase2/stories/p2.6-ea-registry-path-a.md
 */
'use strict';

const fs       = require('fs');
const https_mod = require('https');

// ── EA registry technology.hosting → skills-platform surface type mapping ──────
// Confirmed from registry/applications/_template.yaml commit 7d9edae (RESOLUTION-ASSUMPTION-02)
const HOSTING_TO_SURFACE = {
  'saas':   'saas-api',
  'cloud':  'iac',
  'on-prem': 'manual',
  // 'hybrid' is context-dependent — falls back to Path B or returns an error
};

// ── Test hooks (module-level, overridden in tests) ────────────────────────────
// Override _httpFetch to stub HTTPS calls in tests.
// Signature: (url: string, timeoutMs: number) => Promise<{ statusCode: number, body: string }>
let _httpFetchOverride = null;
// Override _httpTimeoutMs to reduce the 3-second timeout in performance tests.
let _httpTimeoutMsVal = 3000;

/**
 * Remove surrounding quotes from a string only when the opening and closing
 * quote characters match (both single or both double). Prevents mismatched
 * quote removal (e.g. `'test"` should not be stripped).
 *
 * @param {string} s
 * @returns {string}
 */
function stripMatchingQuotes(s) {
  if (s.length >= 2) {
    if ((s[0] === "'" && s[s.length - 1] === "'") ||
        (s[0] === '"' && s[s.length - 1] === '"')) {
      return s.slice(1, -1);
    }
  }
  return s;
}

/**
 * Extract Path A registry configuration fields from a YAML string.
 * Reads only top-level key: value pairs for the four Path A fields.
 *
 * @param {string} yamlText - Raw YAML content
 * @returns {{ registry_source?: string, registry_url?: string, app_id?: string, adapter_override?: string } | null}
 */
function extractRegistryConfig(yamlText) {
  const FIELDS = ['registry_source', 'registry_url', 'app_id', 'adapter_override'];
  const config = {};

  for (const rawLine of yamlText.split('\n')) {
    const stripped = rawLine.replace(/\s*#.*$/, '').trimEnd();
    if (stripped.trim() === '') continue;
    // Top-level keys only — skip any indented lines
    if (/^\s/.test(stripped)) continue;
    const colonIdx = stripped.indexOf(':');
    if (colonIdx < 0) continue;
    const key = stripped.slice(0, colonIdx).trim();
    if (!FIELDS.includes(key)) continue;
    const rawVal = stripped.slice(colonIdx + 1).trim();
    config[key] = stripMatchingQuotes(rawVal);
  }

  return Object.keys(config).length > 0 ? config : null;
}

/**
 * Parse the minimal subset of an EA registry YAML application entry needed for
 * surface type resolution: technology.hosting (nested string) and owner (string).
 * Only one level of nesting is handled.
 *
 * @param {string} yamlText - Raw YAML response body from EA registry
 * @returns {{ technology?: { hosting?: string }, owner?: string, [key: string]: any }}
 */
function parseRegistryEntry(yamlText) {
  const result = {};
  let currentTopKey = null;

  for (const rawLine of yamlText.split('\n')) {
    const stripped = rawLine.replace(/\s*#.*$/, '').trimEnd();
    if (stripped.trim() === '') continue;

    const indent  = stripped.match(/^(\s*)/)[1].length;
    const content = stripped.trim();
    const colonIdx = content.indexOf(':');
    if (colonIdx < 0) continue;

    const key    = content.slice(0, colonIdx).trim();
    const rawVal = content.slice(colonIdx + 1).trim();
    const val    = rawVal === '' ? null : stripMatchingQuotes(rawVal);

    if (indent === 0) {
      currentTopKey = key;
      result[key]   = val !== null ? val : {};
    } else if (currentTopKey !== null && typeof result[currentTopKey] === 'object') {
      result[currentTopKey][key] = val;
    }
  }

  return result;
}

/**
 * Perform an HTTPS GET request with a timeout.
 * Uses _httpFetchOverride when set (test hook).
 *
 * @param {string} url      - Full HTTPS URL including query string
 * @param {number} timeoutMs - Request timeout in milliseconds
 * @returns {Promise<{ statusCode: number, body: string }>}
 */
function httpsGet(url, timeoutMs) {
  if (_httpFetchOverride) return _httpFetchOverride(url, timeoutMs);

  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn) => (v) => { if (!settled) { settled = true; fn(v); } };

    let body = '';
    const req = https_mod.get(url, (res) => {
      res.on('data',  chunk => { body += chunk; });
      res.on('end',   () => settle(resolve)({ statusCode: res.statusCode, body }));
      res.on('error', settle(reject));
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('EA registry HTTP call timed out'));
    });
    req.on('error', settle(reject));
  });
}

/**
 * Handle EA registry unavailability. If the context.yml contains any surface
 * type declaration (type or types field under surface:), falls back to that
 * surface type and logs the fallback message. Otherwise returns an error result.
 *
 * Note: this fallback intentionally does NOT require surface.path: explicit-declaration —
 * it is a registry-unavailability safety net, not a full Path B resolution.
 *
 * @param {string} contextYmlPath
 * @param {Object} adapterRegistry
 * @returns {{ surfaceType: string, adapter: object|null }[] | { status: string, error: string }}
 */
function handleRegistryUnavailable(contextYmlPath, adapterRegistry) {
  const content = fs.readFileSync(contextYmlPath, 'utf8');
  const surface = extractSurfaceConfig(content);

  let types = null;
  if (surface) {
    if (Array.isArray(surface.types) && surface.types.length > 0) {
      types = surface.types;
    } else if (surface.type && typeof surface.type === 'string') {
      types = [surface.type];
    }
  }

  if (types) {
    console.log('EA registry unavailable — falling back to explicit surface declaration');
    return types.map(surfaceType => ({
      surfaceType,
      adapter: adapterRegistry[surfaceType] || null,
    }));
  }

  return {
    status: 'error',
    error:  'EA registry unavailable and no fallback surface declaration found',
  };
}

/**
 * Perform Path A resolution: fetch the EA registry entry for app_id, map
 * technology.hosting to a skills-platform surface type, apply adapter_override
 * if present, and return the adapter selection.
 *
 * @param {string} contextYmlPath
 * @param {Object} adapterRegistry
 * @param {{ registry_url: string, app_id: string, adapter_override?: string }} regConfig
 * @returns {Promise<{ surfaceType: string, adapter: object|null }[] | { status: string, error: string }>}
 */
async function resolvePathA(contextYmlPath, adapterRegistry, regConfig) {
  const registryUrl    = regConfig.registry_url;
  const appId          = regConfig.app_id;
  const adapterOverride = (regConfig.adapter_override && regConfig.adapter_override.length > 0)
    ? regConfig.adapter_override
    : null;

  // MC-SEC-03: HTTPS only — reject plain HTTP before making any call
  if (!registryUrl.startsWith('https://')) {
    return {
      status: 'error',
      error:  'EA registry registry_url must use HTTPS (MC-SEC-03) — plain HTTP is not permitted',
    };
  }

  // Build URL: append app_id as query parameter
  const separator  = registryUrl.includes('?') ? '&' : '?';
  const requestUrl = `${registryUrl}${separator}app_id=${encodeURIComponent(appId)}`;

  let response;
  try {
    response = await httpsGet(requestUrl, _httpTimeoutMsVal);
  } catch (_err) {
    return handleRegistryUnavailable(contextYmlPath, adapterRegistry);
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    return handleRegistryUnavailable(contextYmlPath, adapterRegistry);
  }

  // Parse EA registry entry — extract technology.hosting only
  // MC-SEC-02: do NOT log the full response body
  const entry   = parseRegistryEntry(response.body);
  const hosting = (entry.technology && typeof entry.technology === 'object')
    ? entry.technology.hosting
    : null;

  // Determine surface type: adapter_override from context.yml takes precedence
  let surfaceType;
  if (adapterOverride) {
    surfaceType = adapterOverride;
  } else if (hosting === 'hybrid') {
    // hybrid is context-dependent — fall back to Path B or error
    return handleRegistryUnavailable(contextYmlPath, adapterRegistry);
  } else if (HOSTING_TO_SURFACE[hosting]) {
    surfaceType = HOSTING_TO_SURFACE[hosting];
  } else {
    return {
      status: 'error',
      error:  `EA registry returned unknown technology.hosting value: "${hosting}"`,
    };
  }

  // MC-SEC-02: log only the resolved surface type string, not the full response body
  console.log(`[surface-adapter] Path A resolved: ${surfaceType}`);

  return [{ surfaceType, adapter: adapterRegistry[surfaceType] || null }];
}

/**
 * Extract the surface configuration block from a YAML string.
 * Handles the Path B explicit-declaration format used in context.yml.
 * Parses only the subset of YAML used in context.yml surface blocks:
 *   - key: value pairs (string values)
 *   - key: followed by a list of - items
 *
 * @param {string} yamlText - Raw YAML content
 * @returns {{ path?: string, type?: string, types?: string[] } | null}
 */
function extractSurfaceConfig(yamlText) {
  const lines = yamlText.split('\n');
  let inSurface = false;
  let surfaceLineIndent = 0;
  const surface = {};
  let currentArray = null;

  for (const rawLine of lines) {
    // Strip inline comments and trailing whitespace
    const stripped = rawLine.replace(/\s*#.*$/, '').trimEnd();
    if (stripped.trim() === '') continue;

    const indent = stripped.match(/^(\s*)/)[1].length;
    const content = stripped.trim();

    if (!inSurface) {
      if (content === 'surface:') {
        inSurface = true;
        surfaceLineIndent = indent;
      }
      continue;
    }

    // Leaving the surface block: back to top level (same or lesser indent, not an array item)
    if (indent <= surfaceLineIndent && !content.startsWith('-')) {
      break;
    }

    // Array item within the current key
    if (content.startsWith('- ')) {
      if (currentArray !== null) {
        currentArray.push(stripMatchingQuotes(content.slice(2).trim()));
      }
      continue;
    }

    // Key: value pair
    const colonIdx = content.indexOf(':');
    if (colonIdx < 0) continue;

    const key = content.slice(0, colonIdx).trim();
    const rawVal = content.slice(colonIdx + 1).trim();
    const val = stripMatchingQuotes(rawVal);

    currentArray = null; // reset array collector for previous key

    if (rawVal === '') {
      // Empty value — array or nested object follows
      currentArray = [];
      surface[key] = currentArray;
    } else {
      surface[key] = val;
    }
  }

  return Object.keys(surface).length > 0 ? surface : null;
}

/**
 * Resolve surface types from a context.yml file using Path B (explicit-declaration).
 * Short-circuits before any Path A (EA registry) lookup.
 *
 * For each declared surface type, returns the matching adapter from the registry
 * (or null if no adapter is registered for that type).
 *
 * @param {string} contextYmlPath - Absolute path to context.yml file
 * @param {Object.<string, { execute: function }>} adapterRegistry - Map of surfaceType → adapter
 * @returns {{ surfaceType: string, adapter: object|null }[]}
 */
function resolvePathB(contextYmlPath, adapterRegistry) {
  const content = fs.readFileSync(contextYmlPath, 'utf8');
  const surface = extractSurfaceConfig(content);

  if (!surface) {
    throw new Error('No surface block found in context.yml — add a surface: declaration block');
  }

  if (surface.path !== 'explicit-declaration') {
    throw new Error(
      `Surface resolution path "${surface.path}" is not supported in Phase 1. ` +
      'Path B requires surface.path: explicit-declaration. ' +
      'Path A (EA registry) is Phase 2 scope.'
    );
  }

  // Collect declared surface types (single type or types array)
  let types;
  if (Array.isArray(surface.types) && surface.types.length > 0) {
    types = surface.types;
  } else if (surface.type && typeof surface.type === 'string') {
    types = [surface.type];
  } else {
    throw new Error(
      'No surface type(s) declared under surface.path: explicit-declaration. ' +
      'Add surface.type: <type> or surface.types: [<type>, ...]'
    );
  }

  return types.map(surfaceType => ({
    surfaceType,
    adapter: adapterRegistry[surfaceType] || null,
  }));
}

/**
 * Main resolver entry point — handles both Path A (EA registry) and Path B
 * (explicit surface: declaration) from a single context.yml.
 *
 * Routing logic:
 *  1. Both registry_source and surface.path: explicit-declaration declared →
 *     AC5 guard: Path B wins immediately; warning logged; no HTTP call.
 *  2. Only registry_source declared → Path A (HTTPS registry lookup).
 *  3. Only surface: declared (or neither) → Path B (unchanged from pre-p2.6).
 *
 * @param {string} contextYmlPath - Absolute path to context.yml
 * @param {Object.<string, { execute: function }>} adapterRegistry
 * @returns {Promise<{ surfaceType: string, adapter: object|null }[] | { status: string, error: string }>}
 */
async function resolve(contextYmlPath, adapterRegistry) {
  const content        = fs.readFileSync(contextYmlPath, 'utf8');
  const registryConfig = extractRegistryConfig(content);
  const surface        = extractSurfaceConfig(content);

  const hasPathA = !!(registryConfig && registryConfig.registry_source === 'ea-registry');
  const hasPathB = !!(surface && surface.path === 'explicit-declaration');

  // AC5: both fully-declared paths present — Path B takes precedence; warn; no HTTP call
  if (hasPathA && hasPathB) {
    console.log(
      'Both Path A (registry_source) and Path B (surface:) declared — ' +
      'Path B (explicit) takes precedence. Remove one to resolve.'
    );
    return resolvePathB(contextYmlPath, adapterRegistry);
  }

  // Path A: EA registry lookup
  if (hasPathA) {
    if (!registryConfig.registry_url || !registryConfig.app_id) {
      return {
        status: 'error',
        error:  'Path A requires registry_url and app_id in context.yml',
      };
    }
    return resolvePathA(contextYmlPath, adapterRegistry, registryConfig);
  }

  // Path B: explicit declaration (behaviour identical to pre-p2.6)
  return resolvePathB(contextYmlPath, adapterRegistry);
}

module.exports = {
  resolvePathB,
  extractSurfaceConfig,
  resolve,
  // Test hooks — set these to override module-level state during unit tests
  set _httpFetch(fn)    { _httpFetchOverride = fn; },
  get _httpFetch()      { return _httpFetchOverride; },
  set _httpTimeoutMs(v) { _httpTimeoutMsVal  = v; },
  get _httpTimeoutMs()  { return _httpTimeoutMsVal; },
};
