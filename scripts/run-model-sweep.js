#!/usr/bin/env node
/**
 * run-model-sweep.js
 *
 * Programmatic model evaluation sweep for skills with EVAL.md specifications.
 * Dynamically discovers skills and corpus cases — no skill names are hardcoded.
 *
 * Usage:
 *   node scripts/run-model-sweep.js --experiment EXP-002
 *   node scripts/run-model-sweep.js --experiment EXP-002 --skills discovery,definition-of-ready
 *   node scripts/run-model-sweep.js --experiment EXP-002 --models claude-sonnet-4-6,claude-opus-4-6
 *   node scripts/run-model-sweep.js --experiment EXP-002 --cases T5
 *   node scripts/run-model-sweep.js --experiment EXP-002b --context-files .github/architecture-guardrails.md,product/constraints.md,product/mission.md,product/tech-stack.md
 *   node scripts/run-model-sweep.js --experiment EXP-002b --context-files product/constraints.md,product/mission.md,product/tech-stack.md --provider copilot
 *   node scripts/run-model-sweep.js --experiment EXP-002b --context-files .github/architecture-guardrails.md,product/constraints.md,product/mission.md,product/tech-stack.md --pass2
 *   node scripts/run-model-sweep.js --experiment EXP-002 --delay 65000
 *   node scripts/run-model-sweep.js --experiment EXP-002 --provider copilot --dry-run
 *   node scripts/run-model-sweep.js --experiment EXP-002 --dry-run
 *   node scripts/run-model-sweep.js --list-skills
 *
 * Environment:
 *   ANTHROPIC_API_KEY      — required for direct Anthropic API calls (claude-* models)
 *   OPENAI_API_KEY         — required for direct OpenAI API calls (gpt-* models)
 *   GITHUB_TOKEN           — required for --provider copilot; also accepted as GITHUB_COPILOT_TOKEN
 *                            Auto-used when ANTHROPIC_API_KEY is absent and GITHUB_TOKEN is set.
 *
 * Security:
 *   - API key is never written to any output file
 *   - No user-controlled input is interpolated into API calls without sanitisation
 *   - Output files are written under workspace/experiments/ only
 *
 * Pricing reference (verify before large sweeps):
 *   claude-sonnet-4-6: $3/$15 per million input/output tokens  (as of 2026-05-12)
 *   claude-opus-4-7:   $5/$25 per million input/output tokens  (as of 2026-05-12)
 *   claude-haiku-4-5:  $1/$5  per million input/output tokens  (as of 2026-05-12)
 *   Sources: https://www.anthropic.com/pricing  https://platform.openai.com/pricing
 *   These are Layer 2 (direct API) rates only. Layer 1 (Copilot) costs differ — see eval-programme-roadmap.md
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// ─── Configuration ─────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(REPO_ROOT, '.github', 'skills');
const EXPERIMENTS_DIR = path.join(REPO_ROOT, 'workspace', 'experiments');

/** Canonical judge model — never changes between experiments (prevents judge preference bias) */
const JUDGE_MODEL = 'claude-sonnet-4-6';

/** Number of trials per matrix cell (averaged for stability) */
const DEFAULT_TRIALS = 3;

/** Anthropic API version header (used inside getProvider) */
const ANTHROPIC_API_VERSION = '2023-06-01';

// ─── Evaluation config reader ───────────────────────────────────────────────

/**
 * Reads the evaluation: block from .github/context.yml.
 * Returns defaults if the file is absent or the block is missing.
 *
 * @returns {{ mode: boolean, judgeModel: string, outputPath: string }}
 */
function readEvaluationConfig() {
  const contextPath = path.join(REPO_ROOT, '.github', 'context.yml');
  const defaults = {
    mode: false,
    judgeModel: 'claude-sonnet-4-6',
    outputPath: path.join(REPO_ROOT, 'workspace', 'eval-run-result.json'),
  };
  let content;
  try { content = fs.readFileSync(contextPath, 'utf8'); } catch (e) { return defaults; }

  const lines = content.split('\n');
  let inSection = false;
  let sectionIndent = -1;
  const result = Object.assign({}, defaults);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].replace(/\s*#.*$/, '').trimEnd();
    if (!raw.trim()) continue;
    const indent = (raw.match(/^(\s*)/) || ['', ''])[1].length;
    const trimmed = raw.trim();

    if (!inSection) {
      if (trimmed === 'evaluation:') { inSection = true; sectionIndent = indent; }
      continue;
    }
    if (indent <= sectionIndent && /^\w[\w_]*:/.test(trimmed)) break;

    const m = trimmed.match(/^([\w_]+)\s*:\s*(.+)$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2].trim().replace(/^['"]|['"]$/g, '');
    if (key === 'mode')         result.mode       = (val === 'true');
    if (key === 'judge_model')  result.judgeModel  = val;
    if (key === 'output_path')  result.outputPath  = path.join(REPO_ROOT, val);
  }
  return result;
}

// ─── Provider abstraction ───────────────────────────────────────────────────

// ─── Copilot proxy provider ──────────────────────────────────────────────────

/**
 * Model name overrides for the GitHub Copilot proxy.
 * The proxy accepts the same model IDs as direct provider APIs in most cases.
 * Add an override only when Copilot requires a different version string.
 * Current available models: https://docs.github.com/en/copilot/using-github-copilot/ai-models
 */
const COPILOT_MODEL_MAP = {
  // Copilot proxy uses dots (e.g. claude-sonnet-4.6) while harness uses dashes (claude-sonnet-4-6)
  'claude-haiku-4-5':  'claude-haiku-4.5',
  'claude-sonnet-4-6': 'claude-sonnet-4.6',
  'claude-opus-4-7':   'claude-opus-4.7',
};

function getCopilotProvider() {
  return {
    host: 'api.githubcopilot.com',
    port: null,
    path: '/chat/completions',
    buildHeaders(body) {
      const token = process.env.GITHUB_TOKEN || process.env.GITHUB_COPILOT_TOKEN;
      if (!token) throw new Error('GITHUB_TOKEN or GITHUB_COPILOT_TOKEN is not set — required for --provider copilot');
      return {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${token}`,
        'Copilot-Integration-Id': 'vscode-chat',
        'Editor-Version': 'vscode/1.89.0',
        'Editor-Plugin-Version': 'copilot-chat/0.45.0',
      };
    },
    buildBody(model, messages, maxTokens, systemPrompt) {
      const mappedModel = COPILOT_MODEL_MAP[model] || model;
      const allMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;
      return JSON.stringify({ model: mappedModel, max_tokens: maxTokens, messages: allMessages });
    },
    parseResponse(parsed) {
      const content = parsed.choices?.[0]?.message?.content || '';
      return {
        content,
        inputTokens:  parsed.usage?.prompt_tokens     || 0,
        outputTokens: parsed.usage?.completion_tokens || 0,
        inferenceMs:  null,
      };
    },
  };
}

// ─── Provider abstraction ───────────────────────────────────────────────────

/**
 * Returns provider configuration for a given model ID.
 * Supports four providers: Copilot proxy, Anthropic (claude-*), OpenAI (gpt-*), Local (local-*)
 *
 * @param {string} modelId
 * @param {string|null} [providerOverride] - 'copilot' forces the GitHub Copilot proxy regardless of model prefix
 * @returns {{ host: string, port: number|null, path: string,
 *             buildHeaders: (body: string) => object,
 *             buildBody: (model: string, messages: object[], maxTokens: number, systemPrompt?: string) => string,
 *             parseResponse: (parsed: object) => { content: string, inputTokens: number, outputTokens: number } }}
 */
function getProvider(modelId, providerOverride) {
  if (providerOverride === 'copilot') return getCopilotProvider();

  if (modelId.startsWith('claude-')) {
    return {
      host: 'api.anthropic.com',
      port: null,
      path: '/v1/messages',
      buildHeaders(body) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is not set');
        return {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
        };
      },
      buildBody(model, messages, maxTokens, systemPrompt) {
        const body = { model, max_tokens: maxTokens, messages };
        if (systemPrompt) body.system = systemPrompt;
        return JSON.stringify(body);
      },
      parseResponse(parsed) {
        const content = (parsed.content || []).map(b => b.text || '').join('');
        return { content, inputTokens: parsed.usage?.input_tokens || 0, outputTokens: parsed.usage?.output_tokens || 0 };
      },
    };
  }

  if (modelId.startsWith('gpt-')) {
    return {
      host: 'api.openai.com',
      port: null,
      path: '/v1/chat/completions',
      buildHeaders(body) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is not set');
        return {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Authorization': `Bearer ${apiKey}`,
        };
      },
      buildBody(model, messages, maxTokens, systemPrompt) {
        // System prompt goes in messages array — NOT as a top-level field.
        // Top-level system field is an Anthropic pattern; OpenAI ignores it silently
        // (root cause of EXP-001 run-1 0% emission rate on GPT models).
        const allMessages = systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages;
        return JSON.stringify({ model, max_tokens: maxTokens, messages: allMessages });
      },
      parseResponse(parsed) {
        const content = parsed.choices?.[0]?.message?.content || '';
        return {
          content,
          inputTokens:  parsed.usage?.prompt_tokens     || 0,
          outputTokens: parsed.usage?.completion_tokens || 0,
        };
      },
    };
  }

  if (modelId.startsWith('local-')) {
    return {
      host: process.env.LOCAL_MODEL_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_MODEL_PORT || '3000', 10),
      path: '/v1/chat/completions',
      buildHeaders(body) {
        const headers = {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        };
        if (process.env.LOCAL_MODEL_KEY) {
          headers['Authorization'] = `Bearer ${process.env.LOCAL_MODEL_KEY}`;
        }
        return headers;
      },
      buildBody(model, messages, maxTokens, systemPrompt) {
        const allMessages = systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages;
        return JSON.stringify({ model, max_tokens: maxTokens, messages: allMessages });
      },
      parseResponse(parsed) {
        const content = parsed.choices?.[0]?.message?.content || '';
        return {
          content,
          inputTokens:  parsed.usage?.prompt_tokens     || 0,
          outputTokens: parsed.usage?.completion_tokens || 0,
          inferenceMs:  parsed._inferenceMs             || null, // cost proxy for local models
        };
      },
    };
  }

  throw new Error(`Unknown model prefix — cannot determine provider for model: ${modelId}`);
}

/**
 * Calls the appropriate model API via the provider abstraction.
 * Returns { content, inputTokens, outputTokens }
 * Throws on non-200 responses or missing env vars.
 *
 * Security: API keys are read from environment only, never logged or written to disk.
 *
 * @param {string} modelId
 * @param {object[]} messages
 * @param {number} [maxTokens]
 * @param {string} [systemPrompt]
 * @returns {Promise<{ content: string, inputTokens: number, outputTokens: number }>}
 */
function callModel(modelId, messages, maxTokens = 4096, systemPrompt, providerOverride) {
  const provider = getProvider(modelId, providerOverride);
  return new Promise((resolve, reject) => {
    const body = provider.buildBody(modelId, messages, maxTokens, systemPrompt);
    let headers;
    try { headers = provider.buildHeaders(body); } catch (e) { return reject(e); }

    const options = {
      hostname: provider.host,
      path: provider.path,
      method: 'POST',
      headers,
    };
    if (provider.port) options.port = provider.port;

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`API error ${res.statusCode}: ${data.slice(0, 200)}`));
        }
        let parsed;
        try { parsed = JSON.parse(data); } catch (e) { return reject(new Error(`JSON parse error: ${e.message}`)); }
        try { resolve(provider.parseResponse(parsed)); } catch (e) { reject(new Error(`Response parse error: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Model routing policy ───────────────────────────────────────────────────

/**
 * Canonical model routing policy — sourced from workspace/proposals/routing-policy-framework.md.
 * Maps skill name → approved model ID for that skill's default production use.
 *
 * Used when --policy is given without --models. Supply --models to override.
 * All values MUST be keys in PRICING (enforced by tests/check-model-routing.js).
 *
 * Last updated: 2026-05-16 (EXP-002a, EXP-004, EXP-005, EXP-006, EXP-007)
 * Source: workspace/proposals/routing-policy-framework.md (current routing policy table)
 */
const MODEL_ROUTING = {
  'discovery':           'claude-sonnet-4-6',   // EXP-002a: T1+T3 avg 0.807; regulated + non-regulated default
  'definition':          'claude-haiku-4-5',     // EXP-005: all 4 cases pass; 0.33× cost
  'review':              'claude-haiku-4-5',     // EXP-006: FDR_HIGH 1.00 across T1–T3; 0.33× cost
  'test-plan':           'claude-haiku-4-5',     // EXP-007: TCF 1.00 non-regulated; PCI pending EXP-007R revalidation
  'definition-of-ready': 'claude-haiku-4-5',     // EXP-004: GF 1.00 trials 1+2; 0.33× cost
};

// PRICING MAP — Layer 2 (direct API) rates per million tokens
// For Layer 1 (GitHub Copilot AI Credits) costs, see workspace/experiments/eval-programme-roadmap.md
// Last verified: 2026-05-12
// Source: api.anthropic.com/pricing + platform.openai.com/pricing
const PRICING = {
  // Anthropic
  'claude-sonnet-4-6': { inputPerM: 3.00, outputPerM: 15.00 },
  'claude-opus-4-7':   { inputPerM: 5.00, outputPerM: 25.00 },   // NOTE: claude-opus-4-6 also remains valid as a direct API string (SDK-confirmed 2026-05-12)
  'claude-haiku-4-5':  { inputPerM: 1.00, outputPerM: 5.00 },
  // OpenAI — TODO: verify current rates at platform.openai.com/pricing before running
  'gpt-4o':            { inputPerM: 2.50, outputPerM: 10.00 },   // TODO: verify current rate
  'gpt-4o-mini':       { inputPerM: 0.15, outputPerM: 0.60 },    // TODO: verify current rate
  'gpt-4.1':           { inputPerM: 2.00, outputPerM: 8.00 },    // TODO: verify current rate — estimate only
  'gpt-5-mini':        { inputPerM: 0.15, outputPerM: 0.60 },    // TODO: verify current rate — estimate only
};

// ─── CLI argument parsing ───────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { skills: null, models: null, trials: DEFAULT_TRIALS, dryRun: false, listSkills: false, experiment: null, contextFiles: null, pass2: false, cases: null, delay: 0, provider: null, policy: false, routing: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') { args.dryRun = true; continue; }
    if (arg === '--list-skills') { args.listSkills = true; continue; }
    if (arg === '--pass2') { args.pass2 = true; continue; }
    if (arg === '--policy') { args.policy = true; continue; }
    if (arg === '--routing') { args.routing = true; continue; }
    if (arg === '--experiment' && argv[i + 1]) { args.experiment = argv[++i]; continue; }
    if (arg === '--skills' && argv[i + 1]) { args.skills = argv[++i].split(',').map(s => s.trim()); continue; }
    if (arg === '--models' && argv[i + 1]) { args.models = argv[++i].split(',').map(s => s.trim()); continue; }
    if (arg === '--trials' && argv[i + 1]) { args.trials = parseInt(argv[++i], 10); continue; }
    if (arg === '--cases' && argv[i + 1]) { args.cases = argv[++i].split(',').map(s => s.trim()); continue; }
    if (arg === '--context-files' && argv[i + 1]) { args.contextFiles = argv[++i].split(',').map(s => s.trim()); continue; }
    if (arg === '--delay' && argv[i + 1]) { args.delay = parseInt(argv[++i], 10); continue; }
    if (arg === '--provider' && argv[i + 1]) { args.provider = argv[++i]; continue; }
  }
  return args;
}

// ─── Context injection ──────────────────────────────────────────────────────

/** Human-readable section headings for well-known context files. */
const CONTEXT_SECTION_NAMES = {
  '.github/architecture-guardrails.md': 'Architecture Guardrails',
  'product/constraints.md':             'Product Constraints',
  'product/mission.md':                 'Product Mission',
  'product/tech-stack.md':              'Technology Stack',
};

/**
 * Validates that a context file path does not escape REPO_ROOT.
 * Throws on path traversal.
 *
 * @param {string} relPath - path relative to repo root (as supplied on the CLI)
 * @returns {string} absolute path
 */
function safeContextFilePath(relPath) {
  const resolved = path.resolve(REPO_ROOT, relPath);
  if (!resolved.startsWith(REPO_ROOT + path.sep) && resolved !== REPO_ROOT) {
    throw new Error(`Path traversal rejected for context file: ${relPath}`);
  }
  return resolved;
}

/**
 * Loads context files from disk in the order given.
 * Returns metadata + content for each file.
 * Throws if any file is missing or a path traversal is attempted.
 *
 * @param {string[]} relPaths - paths relative to repo root
 * @returns {{ relPath: string, absPath: string, content: string, bytes: number, sha256: string }[]}
 */
function loadContextFiles(relPaths) {
  return relPaths.map(relPath => {
    const absPath = safeContextFilePath(relPath);
    if (!fs.existsSync(absPath)) throw new Error(`Context file not found: ${relPath}`);
    const content = fs.readFileSync(absPath, 'utf8');
    const bytes = Buffer.byteLength(content, 'utf8');
    const sha256 = crypto.createHash('sha256').update(content).digest('hex');
    return { relPath, absPath, content, bytes, sha256 };
  });
}

/**
 * Builds the context-injected system prompt from context files + the base skill prompt.
 * Context files are prepended in the supplied order before the skill instructions.
 * When pass2=true a regulatory framing block is inserted between the context and the skill.
 *
 * Security: file contents are sent to the API in the system prompt.
 * Only metadata (relPath, bytes, sha256) is written to the result file on disk.
 *
 * @param {{ relPath: string, content: string }[]} contextFiles
 * @param {string} skillPrompt - SKILL.md contents (or fallback framing string)
 * @param {boolean} [pass2=false]
 * @returns {string}
 */
function buildContextSystemPrompt(contextFiles, skillPrompt, pass2 = false) {
  const lines = [
    'You are running a pipeline skill for a governed software delivery pipeline.',
    '',
    'Before receiving the operator input, read the following organisational context.',
    'This context is authoritative and takes precedence over any assumptions you might otherwise make about the operating domain.',
  ];

  for (const file of contextFiles) {
    const key = file.relPath.replace(/\\/g, '/');
    const sectionName = CONTEXT_SECTION_NAMES[key]
      || path.basename(file.relPath, '.md').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    lines.push('', '---', `## ${sectionName}`, '', file.content.trim());
  }

  if (pass2) {
    lines.push(
      '', '---', '## Regulatory and Compliance Framing', '',
      'This platform serves a regulated financial enterprise subject to prudential banking regulation and anti-money-laundering requirements. All discovery artefacts must explicitly surface:',
      '- Data residency requirements (where customer and transactional data may be stored and processed)',
      '- Retention policy constraints (including statutory retention periods where applicable)',
      '- Access control boundaries where the problem domain involves customer or financial data',
      '- Applicable regulatory filing obligations (e.g. suspicious activity reporting, transaction reporting thresholds)',
      '',
      'Where the input domain involves financial transactions, customer data, or compliance obligations, name the applicable regulatory regime before writing the problem statement. Do not proceed to MVP scoping until regulatory context is surfaced.',
    );
  }

  lines.push('', '---', '', 'You have now read the full organisational context. Proceed with the skill.', '', skillPrompt);
  return lines.join('\n');
}

/**
 * Reads manifest.md from an experiment directory and checks approved_for_external_api.
 * Returns true if approved, false if explicitly denied, null if absent/unreadable.
 *
 * @param {string} experimentDir
 * @returns {boolean|null}
 */
function parseManifestApproval(experimentDir) {
  const manifestPath = path.join(experimentDir, 'manifest.md');
  if (!fs.existsSync(manifestPath)) return null;
  const content = fs.readFileSync(manifestPath, 'utf8');
  const match = content.match(/approved_for_external_api\s*\|\s*(true|false)/);
  if (!match) return null;
  return match[1] === 'true';
}

// ─── Skill + corpus discovery ───────────────────────────────────────────────

/**
 * Finds all skills that have an EVAL.md file.
 * Returns array of { skillName, evalPath, corpusDir, evalContent }
 */
function discoverSkills(filterNames) {
  const results = [];
  if (!fs.existsSync(SKILLS_DIR)) {
    throw new Error(`Skills directory not found: ${SKILLS_DIR}`);
  }
  for (const entry of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillName = entry.name;
    if (filterNames && !filterNames.includes(skillName)) continue;
    const evalPath = path.join(SKILLS_DIR, skillName, 'EVAL.md');
    if (!fs.existsSync(evalPath)) continue;
    const corpusDir = path.join(SKILLS_DIR, skillName, 'corpus');
    results.push({
      skillName,
      evalPath,
      corpusDir: fs.existsSync(corpusDir) ? corpusDir : null,
      evalContent: fs.readFileSync(evalPath, 'utf8'),
    });
  }
  return results;
}

/**
 * Finds all corpus cases for a skill.
 * Matches files like T1-*.md, T2-*.md, case-*.md inside the corpus directory.
 */
function discoverCorpusCases(corpusDir) {
  if (!corpusDir || !fs.existsSync(corpusDir)) return [];
  const cases = [];
  for (const file of fs.readdirSync(corpusDir)) {
    if (!file.endsWith('.md')) continue;
    if (!/^(T\d+|case-)/.test(file)) continue;
    const caseId = file.replace(/\.md$/, '').split('-')[0];
    cases.push({
      caseId,
      fileName: file,
      filePath: path.join(corpusDir, file),
      content: fs.readFileSync(path.join(corpusDir, file), 'utf8'),
    });
  }
  return cases.sort((a, b) => a.caseId.localeCompare(b.caseId));
}

/**
 * Extracts the "Operator input" section from a corpus case file.
 * Returns the text between the first blockquote after "## Operator input" and the next heading.
 */
function extractOperatorInput(caseContent) {
  const lines = caseContent.split('\n');
  let inSection = false;
  let collecting = false;
  const inputLines = [];
  for (const line of lines) {
    if (/^##\s+Operator input/i.test(line)) { inSection = true; continue; }
    if (inSection && /^##/.test(line)) break;
    if (inSection) {
      if (line.startsWith('>')) { collecting = true; }
      if (collecting) { inputLines.push(line.replace(/^>\s?/, '')); }
    }
  }
  return inputLines.join('\n').trim();
}

/**
 * Extracts the "Expected ... characteristics" or "Scoring note" section for judge context.
 */
function extractJudgeContext(caseContent) {
  const lines = caseContent.split('\n');
  let collecting = false;
  const contextLines = [];
  for (const line of lines) {
    if (/^##\s+Expected/i.test(line) || /^##\s+Scoring note/i.test(line)) { collecting = true; }
    if (collecting && /^##\s+Known failure/i.test(line)) break;
    if (collecting) contextLines.push(line);
  }
  return contextLines.join('\n').trim();
}

/**
 * Extracts the judge prompt template from EVAL.md (content inside the fenced block after "## Judge prompt").
 */
function extractJudgePrompt(evalContent) {
  const fenceStart = evalContent.indexOf('## Judge prompt');
  if (fenceStart === -1) return null;
  const after = evalContent.slice(fenceStart);
  const match = after.match(/```[\s\S]*?\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

// ─── Anthropic API call ─────────────────────────────────────────────────────

// ─── Cost tracking ──────────────────────────────────────────────────────────

function estimateCost(model, inputTokens, outputTokens) {
  const pricing = PRICING[model];
  if (!pricing) return null;
  return (inputTokens / 1e6) * pricing.inputPerM + (outputTokens / 1e6) * pricing.outputPerM;
}

/**
 * Writes workspace/eval-run-result.json for a single completed eval case.
 * Overwrites on each call — last case wins (log all cases via the scorecard).
 *
 * @param {string} outputPath  - absolute path derived from evaluation.output_path
 * @param {object} result
 */
function writeEvalRunResult(outputPath, result) {
  try { fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', 'utf8'); } catch (e) { /* non-fatal */ }
}

// ─── Output file writing ────────────────────────────────────────────────────

/**
 * Resolves an output path and validates it stays within the experiments directory.
 * Throws if path traversal is attempted.
 */
function safeExperimentsPath(experimentDir, ...segments) {
  const resolved = path.resolve(experimentDir, ...segments);
  if (!resolved.startsWith(EXPERIMENTS_DIR + path.sep) && !resolved.startsWith(experimentDir + path.sep) && resolved !== experimentDir) {
    throw new Error(`Path traversal rejected: ${resolved}`);
  }
  return resolved;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeRunFile(experimentDir, skillName, caseId, modelLabel, trialN, content) {
  const runsDir = safeExperimentsPath(experimentDir, 'runs');
  ensureDir(runsDir);
  const filename = `${skillName}-${caseId}-${modelLabel}-trial-${trialN}.md`;
  const filePath = path.join(runsDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

function writeResultFile(experimentDir, skillName, caseId, modelLabel, trialN, scoreJson) {
  const resultsDir = safeExperimentsPath(experimentDir, 'results');
  ensureDir(resultsDir);
  const filename = `${skillName}-${caseId}-${modelLabel}-trial-${trialN}.json`;
  const filePath = path.join(resultsDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(scoreJson, null, 2), 'utf8');
  return filePath;
}

// ─── Scorecard generation ───────────────────────────────────────────────────

function generateScorecard(experimentId, matrix, allResults) {
  const lines = [
    `# Scorecard — ${experimentId}`,
    '',
    `Generated: ${new Date().toISOString()}`,
    `Judge model: ${JUDGE_MODEL}`,
    '',
    '## Summary',
    '',
    '| Skill | Case | Model | Trials | Avg Score | Pass Rate | Compliant | Est. Cost |',
    '|-------|------|-------|--------|-----------|-----------|-----------|-----------|',
  ];

  for (const key of Object.keys(allResults)) {
    const trials = allResults[key];
    const { skillName, caseId, modelLabel } = trials[0].meta;
    const scores = trials.map(t => t.score?.weighted_score || 0).filter(s => typeof s === 'number');
    const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3) : 'N/A';
    const passRate = `${trials.filter(t => t.score?.pass).length}/${trials.length}`;
    const compliant = trials.every(t => t.score?.compliant !== false) ? 'yes' : 'NO';
    const totalCost = trials.reduce((a, t) => a + (t.cost || 0), 0);
    const costStr = totalCost ? `$${totalCost.toFixed(3)}` : 'N/A';
    lines.push(`| ${skillName} | ${caseId} | ${modelLabel} | ${trials.length} | ${avgScore} | ${passRate} | ${compliant} | ${costStr} |`);
  }

  lines.push('', '## Notes', '', '- Compliant=NO: categorical fail triggered regardless of weighted score', '- Use this scorecard to update workspace/proposals/proposed-update-token-optimization-measurement.md');
  return lines.join('\n');
}

// ─── Main execution ─────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  // --list-skills mode
  if (args.listSkills) {
    const skills = discoverSkills(null);
    if (skills.length === 0) {
      console.log('No skills with EVAL.md found under .github/skills/');
      return;
    }
    console.log('Skills with EVAL.md:');
    for (const skill of skills) {
      const cases = discoverCorpusCases(skill.corpusDir);
      console.log(`  ${skill.skillName} — ${cases.length} corpus case(s)`);
      for (const c of cases) console.log(`    ${c.caseId} (${c.fileName})`);
    }
    return;
  }

  // --routing mode: print the routing table and exit (no experiment needed)
  if (args.routing) {
    console.log('\nModel routing policy (applies when --policy flag is used without --models):');
    console.log('\n' + 'Skill'.padEnd(24) + 'Model'.padEnd(24) + 'Layer 2 cost (input/output per M)');
    console.log('─'.repeat(72));
    for (const [skill, model] of Object.entries(MODEL_ROUTING)) {
      const pricing = PRICING[model];
      const costStr = pricing ? `$${pricing.inputPerM}/$${pricing.outputPerM}` : 'unknown';
      console.log(skill.padEnd(24) + model.padEnd(24) + costStr);
    }
    console.log('\nSource: workspace/proposals/routing-policy-framework.md');
    console.log('Override: --models <model-id>  (--policy is ignored when --models is set)');
    return;
  }

  // Experiment ID required for all other modes
  if (!args.experiment) {
    console.error('Error: --experiment EXP-XXX is required');
    process.exit(1);
  }

  // Read evaluation config (mode flag, judge model override, output path)
  const evalConfig = readEvaluationConfig();
  const effectiveJudgeModel = evalConfig.judgeModel || JUDGE_MODEL;
  const evalOutputPath = evalConfig.outputPath;

  if (evalConfig.mode) {
    console.log(`[eval] evaluation.mode: true — non-interactive mode active`);
    console.log(`[eval] judge model: ${effectiveJudgeModel}`);
    console.log(`[eval] output path: ${evalOutputPath}`);
  }

  // Pre-flight: need at least one usable credential
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_COPILOT_TOKEN;
  if (!apiKey && !githubToken && !args.dryRun) {
    console.error('Error: no API credentials found.');
    console.error('  Direct API:     set ANTHROPIC_API_KEY (claude-* models) or OPENAI_API_KEY (gpt-* models)');
    console.error('  Copilot proxy:  set GITHUB_TOKEN or GITHUB_COPILOT_TOKEN (and use --provider copilot)');
    console.error('  Dry run:        use --dry-run');
    process.exit(1);
  }

  // Provider resolution: explicit flag > auto-detect from env vars > model-prefix routing
  let effectiveProvider = args.provider || null;
  if (!effectiveProvider) {
    if (!apiKey && githubToken) {
      effectiveProvider = 'copilot';
      console.log('Auto-detected provider: ANTHROPIC_API_KEY not set, GITHUB_TOKEN found → using Copilot proxy');
    }
  } else if (effectiveProvider === 'copilot') {
    console.log('Provider: Copilot proxy (api.githubcopilot.com)');
  } else if (!['anthropic', 'openai'].includes(effectiveProvider)) {
    console.error(`Error: unknown --provider value '${effectiveProvider}'. Valid values: anthropic, openai, copilot`);
    process.exit(1);
  }

  // Discover skills
  const skills = discoverSkills(args.skills);
  if (skills.length === 0) {
    console.error('No skills with EVAL.md found' + (args.skills ? ` matching: ${args.skills.join(', ')}` : ''));
    process.exit(1);
  }

  // Determine models — --policy uses per-skill routing; --models overrides; fallback is all PRICING keys
  const policyActive = args.policy && !args.models;
  const models = args.models || (args.policy ? null : Object.keys(PRICING));
  if (args.policy && args.models) {
    console.log('Note: --models overrides --policy for this run.');
  }

  // Experiment directory
  const experimentDir = path.join(EXPERIMENTS_DIR, args.experiment);
  ensureDir(experimentDir);
  ensureDir(path.join(experimentDir, 'runs'));
  ensureDir(path.join(experimentDir, 'results'));

  // Data classification guard — required when context files will be sent to a cloud API
  if (args.contextFiles && !args.dryRun) {
    const hasCloudModel = (args.models || Object.keys(PRICING)).some(m => !m.startsWith('local-'));
    if (hasCloudModel) {
      const approved = parseManifestApproval(experimentDir);
      if (approved === false) {
        console.error('Error: manifest.md data_classification_check.approved_for_external_api is false.');
        console.error('Context files must not be sent to cloud APIs. Use --models local-* instead.');
        process.exit(1);
      }
      if (approved === null) {
        console.warn('Warning: could not verify approved_for_external_api in manifest.md. Proceeding (operator must confirm classification before running).');
      }
    }
  }

  // Load context files once — applied to every cell and trial
  let contextFilesData = null;
  if (args.contextFiles) {
    try {
      contextFilesData = loadContextFiles(args.contextFiles);
    } catch (e) {
      console.error(`Error loading context files: ${e.message}`);
      process.exit(1);
    }
  }

  // Build matrix
  const matrix = [];
  for (const skill of skills) {
    let cases = discoverCorpusCases(skill.corpusDir);
    if (cases.length === 0) {
      console.warn(`Warning: no corpus cases found for skill '${skill.skillName}' — skipping`);
      continue;
    }
    if (args.cases) {
      cases = cases.filter(c => args.cases.includes(c.caseId));
      if (cases.length === 0) {
        console.warn(`Warning: no corpus cases match --cases filter for '${skill.skillName}' — skipping`);
        continue;
      }
    }
    // Resolve models for this skill: policy lookup, explicit --models override, or all PRICING keys
    let skillModels;
    if (policyActive) {
      const routedModel = MODEL_ROUTING[skill.skillName];
      if (!routedModel) {
        console.warn(`Warning: --policy active but no routing entry for '${skill.skillName}' — skipping (add to MODEL_ROUTING to include)`);
        continue;
      }
      skillModels = [routedModel];
    } else {
      skillModels = models;
    }
    for (const corpusCase of cases) {
      for (const model of skillModels) {
        matrix.push({ skill, corpusCase, model });
      }
    }
  }

  const activeModels = policyActive ? [...new Set(matrix.map(m => m.model))] : (models || []);
  const modelSuffix = policyActive ? ' (via --policy routing table)' : (args.policy && args.models ? ' (--models overrides --policy)' : '');
  console.log(`\nExperiment: ${args.experiment}`);
  console.log(`Skills: ${[...new Set(matrix.map(m => m.skill.skillName))].join(', ')}`);
  console.log(`Models: ${activeModels.join(', ')}${modelSuffix}`);
  if (args.cases) console.log(`Cases: ${args.cases.join(', ')}`);
  console.log(`Matrix cells: ${matrix.length} (× ${args.trials} trials = ${matrix.length * args.trials} runs)`);
  if (contextFilesData) {
    console.log(`Context injection: ${contextFilesData.length} file(s) — ${contextFilesData.map(f => f.relPath).join(', ')}`);
    if (args.pass2) console.log(`Pass 2 (regulatory injection): enabled`);
  }

  if (args.dryRun) {
    console.log('\nDry run — no API calls. Matrix:');
    for (const cell of matrix) {
      console.log(`  ${cell.skill.skillName} × ${cell.corpusCase.caseId} × ${cell.model} × ${args.trials} trials`);
    }
    if (args.contextFiles) {
      console.log('\nContext files that would be injected:');
      for (const relPath of args.contextFiles) {
        const absPath = path.resolve(REPO_ROOT, relPath);
        const exists = fs.existsSync(absPath);
        console.log(`  ${relPath} — ${exists ? 'found' : 'NOT FOUND'}`);
      }
      if (args.pass2) console.log('  [Pass 2 regulatory injection: enabled]');
    }
    return;
  }

  // Execute matrix
  const allResults = {};
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let apiCallsMade = 0;  // track calls across all cells for --delay

  for (const cell of matrix) {
    const { skill, corpusCase, model } = cell;
    const cellKey = `${skill.skillName}__${corpusCase.caseId}__${model}`;
    allResults[cellKey] = [];

    const operatorInput = extractOperatorInput(corpusCase.content);
    const judgeContext = extractJudgeContext(corpusCase.content);
    const judgePromptTemplate = extractJudgePrompt(skill.evalContent);

    if (!operatorInput) {
      console.warn(`Warning: could not extract operator input from ${corpusCase.fileName} — skipping`);
      continue;
    }

    for (let trial = 1; trial <= args.trials; trial++) {
      console.log(`\nRunning: ${skill.skillName} × ${corpusCase.caseId} × ${model} trial ${trial}/${args.trials}`);

      // Optional rate-limit guard: delay before every API call after the first
      if (args.delay > 0 && apiCallsMade > 0) {
        console.log(`  Waiting ${args.delay}ms (--delay rate-limit guard)...`);
        await new Promise(r => setTimeout(r, args.delay));
      }
      apiCallsMade++;

      // Step 1: Run candidate model on corpus case
      let runContent, runInputTokens, runOutputTokens;
      try {
        let systemPrompt;
        let userContent;
        if (contextFilesData) {
          // Context-injected run: system prompt = context files + SKILL.md; user = operator input only.
          const skillMdPath = path.join(SKILLS_DIR, skill.skillName, 'SKILL.md');
          const skillMdContent = fs.existsSync(skillMdPath)
            ? fs.readFileSync(skillMdPath, 'utf8')
            : `You are running the /${skill.skillName} pipeline skill.`;
          systemPrompt = buildContextSystemPrompt(contextFilesData, skillMdContent, args.pass2);
          userContent = operatorInput;
          if (trial === 1) {
            // Only log file metadata on first trial per cell to avoid log spam
            for (const f of contextFilesData) {
              console.log(`  Context: ${f.relPath} (${f.bytes}B sha256=${f.sha256.slice(0, 8)}...)`);
            }
          }
        } else if (evalConfig.mode) {
          // Standard eval mode: non-interactive prefix in system prompt
          systemPrompt = [
            'EVALUATION MODE ACTIVE. Run in non-interactive mode. Skip all confirmation prompts.',
            'Produce the complete artefact in a single pass. Apply all substantive skill logic.',
            'Append <!-- eval-mode: true --> as the final line of the artefact.',
            `Write the eval result to ${evalOutputPath} on completion.`,
          ].join(' ');
          userContent = `You are running the /${skill.skillName} pipeline skill. ${operatorInput}`;
        } else {
          userContent = `You are running the /${skill.skillName} pipeline skill. ${operatorInput}`;
        }
        const result = await callModel(model, [{ role: 'user', content: userContent }], 4096, systemPrompt, effectiveProvider);
        runContent = result.content;
        runInputTokens = result.inputTokens;
        runOutputTokens = result.outputTokens;
        totalInputTokens += runInputTokens;
        totalOutputTokens += runOutputTokens;
      } catch (err) {
        console.error(`  API error (candidate run): ${err.message}`);
        allResults[cellKey].push({ meta: { skillName: skill.skillName, caseId: corpusCase.caseId, modelLabel: model }, score: null, cost: null, error: err.message });
        continue;
      }

      // Save raw run output
      const runFilePath = writeRunFile(experimentDir, skill.skillName, corpusCase.caseId, model, trial, runContent);
      console.log(`  Run saved: ${path.relative(REPO_ROOT, runFilePath)}`);

      // Step 2: Judge the output
      let scoreJson = null;
      if (judgePromptTemplate) {
        const judgePromptFilled = judgePromptTemplate
          .replace('{CASE_ID}', corpusCase.caseId)
          .replace('{CASE_CONTEXT}', judgeContext)
          .replace('{OUTPUT}', runContent);

        try {
          const judgeResult = await callModel(effectiveJudgeModel, [{ role: 'user', content: judgePromptFilled }], 1024, undefined, effectiveProvider);
          totalInputTokens += judgeResult.inputTokens;
          totalOutputTokens += judgeResult.outputTokens;
          // Parse JSON from judge output (strip any surrounding text)
          const jsonMatch = judgeResult.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            scoreJson = JSON.parse(jsonMatch[0]);
            scoreJson.model_label = model;
          } else {
            console.warn(`  Warning: judge did not return valid JSON`);
          }
        } catch (err) {
          console.warn(`  Judge error: ${err.message}`);
        }
      }

      // Write eval-run-result.json for this case
      writeEvalRunResult(evalOutputPath, {
        skill: skill.skillName,
        caseId: corpusCase.caseId,
        model,
        trial,
        completedAt: new Date().toISOString(),
        artefactPath: runFilePath,
        dimensionsScored: scoreJson ? Object.keys(scoreJson.scores || {}).length : null,
        verdict: scoreJson ? (scoreJson.pass ? 'pass' : 'fail') : null,
      });

      // Augment result with context injection metadata (file names + hashes, NOT contents)
      const contextMeta = contextFilesData ? {
        context_injection: true,
        pass2: args.pass2,
        context_files_meta: contextFilesData.map(f => ({ relPath: f.relPath, bytes: f.bytes, sha256: f.sha256 })),
      } : { context_injection: false };
      if (scoreJson) Object.assign(scoreJson, contextMeta);
      const resultData = scoreJson || Object.assign({ error: 'judge failed', model_label: model }, contextMeta);

      // Save result
      const resultFilePath = writeResultFile(experimentDir, skill.skillName, corpusCase.caseId, model, trial, resultData);
      console.log(`  Result saved: ${path.relative(REPO_ROOT, resultFilePath)}`);

      const cost = effectiveProvider === 'copilot' ? null : estimateCost(model, runInputTokens, runOutputTokens);
      allResults[cellKey].push({
        meta: { skillName: skill.skillName, caseId: corpusCase.caseId, modelLabel: model, trial },
        score: scoreJson,
        cost,
        runFilePath,
        resultFilePath,
      });

      if (scoreJson) {
        const passStr = scoreJson.pass ? 'PASS' : 'FAIL';
        const compliantStr = scoreJson.compliant === false ? ' [NON-COMPLIANT]' : '';
        console.log(`  Score: ${scoreJson.weighted_score?.toFixed(3) || 'N/A'} — ${passStr}${compliantStr}`);
      }
    }
  }

  // Generate scorecard
  const scorecard = generateScorecard(args.experiment, matrix, allResults);
  const scorecardPath = safeExperimentsPath(experimentDir, 'scorecard.md');
  fs.writeFileSync(scorecardPath, scorecard, 'utf8');
  console.log(`\nScorecard written: ${path.relative(REPO_ROOT, scorecardPath)}`);

  // Print cost summary
  const totalCost = Object.values(allResults).flat().reduce((a, t) => a + (t.cost || 0), 0);
  console.log(`\nTotal tokens: ${totalInputTokens.toLocaleString()} input, ${totalOutputTokens.toLocaleString()} output`);
  if (totalCost) {
    console.log(`Estimated total cost: $${totalCost.toFixed(3)}`);
  } else if (effectiveProvider === 'copilot') {
    console.log('Cost: AI Credits (Copilot proxy — no direct API spend)');
  }
  console.log('\nSweep complete.');
}

main().catch(err => {
  // Ensure API key is never in the error output
  const tokensToRedact = [
    process.env.ANTHROPIC_API_KEY,
    process.env.OPENAI_API_KEY,
    process.env.GITHUB_TOKEN,
    process.env.GITHUB_COPILOT_TOKEN,
  ].filter(Boolean);
  const msg = tokensToRedact.some(t => err.message.includes(t))
    ? 'Internal error (redacted — potential credential leak in error path)'
    : err.message;
  console.error(`Fatal: ${msg}`);
  process.exit(1);
});
