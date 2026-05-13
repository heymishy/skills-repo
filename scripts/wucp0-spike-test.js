#!/usr/bin/env node
/**
 * wucp0-spike-test.js
 *
 * wucp.0 MM1 prompt validation spike — automated runner.
 * Runs 20 scenarios through claude-sonnet-4-6 with the WEB UI PROTOCOL instruction,
 * scores each response for <TOOL:read_file path="..."/> or <TOOL:list_dir path="..."/> marker
 * emission, and writes prompt-validation-results.md to the wucp artefact reference folder.
 *
 * Usage:
 *   node scripts/wucp0-spike-test.js
 *   node scripts/wucp0-spike-test.js --dry-run              (print scenarios, skip API calls)
 *   node scripts/wucp0-spike-test.js --scenarios S05,S13,S14  (run subset only; comma-separated IDs)
 *   node scripts/wucp0-spike-test.js --delay 5000             (ms pause between calls; default 500)
 *
 * Environment (auto-loaded from .env if present):
 *   GITHUB_TOKEN       — GitHub CLI token with copilot scope (preferred; same token the web UI uses)
 *   ANTHROPIC_API_KEY  — direct Anthropic API key (fallback if GITHUB_TOKEN absent)
 *   WUCE_TURN_MODEL    — overrides model name for Copilot proxy (default: claude-sonnet-4.6)
 *
 * Output:
 *   artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/prompt-validation-results.md
 *   workspace/experiments/wucp0-spike-raw-results.json   (raw API responses for audit)
 *
 * Scoring rubric:
 *   PASS (1) — response contains a well-formed marker: <TOOL:read_file path="..."/> or
 *              <TOOL:list_dir path="..."/> (self-closing, colon-verb, path attribute, no spaces
 *              after opening angle bracket, no space after TOOL: prefix)
 *   FAIL (0) — marker absent, malformed (e.g. <TOOL: read_file ...>, <tool:read_file ...>,
 *              [read_file path=...], plain English description of file read intention)
 *
 * This is a spike script — not production code. No test wiring in package.json.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ─── Load .env (no external deps) ────────────────────────────────────────────
(function loadDotEnv() {
  const envPath = path.join(path.resolve(__dirname, '..'), '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
})();

// ─── Config ─────────────────────────────────────────────────────────────────

const REPO_ROOT   = path.resolve(__dirname, '..');
const ARTEFACT_DIR = path.join(REPO_ROOT, 'artefacts', '2026-05-08-web-ui-copilot-chat-parity', 'reference');
const RAW_OUTPUT  = path.join(REPO_ROOT, 'workspace', 'experiments', 'wucp0-spike-raw-results.json');
const RESULT_DOC  = path.join(ARTEFACT_DIR, 'prompt-validation-results.md');

// Provider: prefer GITHUB_TOKEN (Copilot proxy, same as web UI) over direct Anthropic.
// Copilot proxy uses dot notation 'claude-sonnet-4.6'; Anthropic uses 'claude-sonnet-4-6'.
const USE_COPILOT_PROXY = !!(process.env.GITHUB_TOKEN);
const TARGET_MODEL = USE_COPILOT_PROXY
  ? (process.env.WUCE_TURN_MODEL || 'claude-sonnet-4.6')
  : 'claude-sonnet-4-6';
const MAX_TOKENS   = 600;
const DRY_RUN      = process.argv.includes('--dry-run');

// --scenarios S05,S13,S14  — run only the named scenario IDs (comma-separated, no spaces)
const SCENARIO_FILTER = (() => {
  const idx = process.argv.indexOf('--scenarios');
  if (idx < 0) return null;
  return (process.argv[idx + 1] || '').split(',').map(s => s.trim()).filter(Boolean);
})();

// --delay N  — milliseconds between API calls (default 500)
const CALL_DELAY = (() => {
  const idx = process.argv.indexOf('--delay');
  if (idx >= 0) { const v = parseInt(process.argv[idx + 1], 10); if (!isNaN(v)) return v; }
  return 500;
})();

// ─── WEB UI PROTOCOL instruction ────────────────────────────────────────────
// This is what will be injected into buildSystemPrompt() in wucp.3.
// The spike tests whether this exact wording produces reliable marker emission.
// AC6 of wucp.3 says: "The specific instruction wording comes from the
// recommendation in prompt-validation-results.md (wucp.0 AC3)."

const WEB_UI_PROTOCOL = `You are running inside a web UI for a software delivery pipeline. The repository is checked out on the server.

When you need to read a file to answer this request, emit exactly this marker on its own line BEFORE writing your response:

<TOOL:read_file path="relative/path/to/file"/>

When you need to list a directory, emit exactly this marker on its own line:

<TOOL:list_dir path="relative/path/to/dir"/>

Rules:
- Always use paths relative to the repo root (e.g. workspace/state.json, not /absolute/path)
- Emit the marker first — do not describe what you are about to read, just emit the marker
- After the marker, continue your response as if you have access to the file contents
- Use only these two tool verbs: read_file, list_dir — no others
- Markers are self-closing: end with />  not with a separate </TOOL:read_file>`;

// ─── Test scenarios ──────────────────────────────────────────────────────────
// 8 /workflow + 6 /trace + 6 /improve = 20 total
// Each scenario should clearly require reading at least one file.
// Pass condition: response contains a well-formed <TOOL:read_file .../> or <TOOL:list_dir .../>

const SCENARIOS = [
  // /workflow — 8 scenarios (S01–S08)
  {
    id: 'S01', skill: '/workflow',
    prompt: 'I am starting a new session. What phase is the current feature at? Check workspace/state.json first.',
  },
  {
    id: 'S02', skill: '/workflow',
    prompt: 'Run /workflow. What story should I work on next and why?',
  },
  {
    id: 'S03', skill: '/workflow',
    prompt: 'What is the current pipeline status? I need to know which skill to run next.',
  },
  {
    id: 'S04', skill: '/workflow',
    prompt: 'Are there any blocked stories right now? Read the pipeline state to find out.',
  },
  {
    id: 'S05', skill: '/workflow',
    prompt: 'I want to resume work from my last session. What should I pick up? Check workspace/state.json.',
  },
  {
    id: 'S06', skill: '/workflow',
    prompt: 'How many stories currently have a signed-off DoR? Please check the pipeline state file.',
  },
  {
    id: 'S07', skill: '/workflow',
    prompt: 'What features are in flight right now and what stage are they at?',
  },
  {
    id: 'S08', skill: '/workflow',
    prompt: 'Which story is the next one ready for coding? Check the state before answering.',
  },

  // /trace — 6 scenarios (S09–S14)
  {
    id: 'S09', skill: '/trace',
    prompt: 'Run /trace on the wucp feature. Start by reading the discovery artefact to validate it exists.',
  },
  {
    id: 'S10', skill: '/trace',
    prompt: 'Is there a test plan artefact for wucp.1? Check the artefacts directory to confirm.',
  },
  {
    id: 'S11', skill: '/trace',
    prompt: 'Validate the traceability chain for the wucp feature. Read the benefit-metric artefact first.',
  },
  {
    id: 'S12', skill: '/trace',
    prompt: 'Does the DoR for wucp.1 reference a valid test plan path? Check both the DoR and test-plans folder.',
  },
  {
    id: 'S13', skill: '/trace',
    prompt: 'Are there any artefacts missing from the wucp feature folder? List the directory and report any gaps.',
  },
  {
    id: 'S14', skill: '/trace',
    prompt: 'Check whether wucp.2 has a definition-of-done artefact. Read the dod folder to confirm.',
  },

  // /improve — 6 scenarios (S15–S20)
  {
    id: 'S15', skill: '/improve',
    prompt: 'Run /improve on the last completed story. Read the DoD artefact first to understand what shipped.',
  },
  {
    id: 'S16', skill: '/improve',
    prompt: 'What reusable patterns should we extract from the wucp feature? Check the decisions log to start.',
  },
  {
    id: 'S17', skill: '/improve',
    prompt: 'Extract learnings from wucp.2 for the knowledge base. Read the story artefact to begin.',
  },
  {
    id: 'S18', skill: '/improve',
    prompt: 'What should be added to copilot-instructions.md from recent work? Check workspace/learnings.md first.',
  },
  {
    id: 'S19', skill: '/improve',
    prompt: 'Run /improve for the wucp feature. Start by reading the discovery artefact to understand original intent.',
  },
  {
    id: 'S20', skill: '/improve',
    prompt: 'Were any standards decisions made during wucp delivery that should be promoted? Check decisions.md.',
  },
];

// ─── Scoring ────────────────────────────────────────────────────────────────

/**
 * Scores a model response for well-formed TOOL marker emission.
 *
 * PASS — contains <TOOL:read_file path="..."/> or <TOOL:list_dir path="..."/>
 *        (case-sensitive verb, no space after TOOL:, path= attribute, self-closing)
 *
 * FAIL — marker absent, wrong case (<tool:), space (<TOOL: read_file>),
 *        wrong delimiter, plain English ("I'll read the file"), backtick wrapper
 *
 * @param {string} response
 * @returns {{ pass: boolean, markerFound: string|null, failReason: string|null }}
 */
function scoreResponse(response) {
  // Well-formed marker regex: <TOOL:read_file path="..."/> or <TOOL:list_dir path="..."/>
  // path value must be non-empty, no path traversal required for scoring (that's wucp.3 AC8)
  const wellFormed = /<TOOL:(read_file|list_dir)\s+path="([^"]+)"\s*\/>/;
  const m = response.match(wellFormed);
  if (m) {
    return { pass: true, markerFound: m[0], failReason: null };
  }

  // Detect common failure patterns for notes
  let failReason = 'Marker absent';
  if (/<TOOL:\s+(read_file|list_dir)/i.test(response)) {
    failReason = 'Malformed: space after TOOL: prefix';
  } else if (/<tool:(read_file|list_dir)/i.test(response) && !/<TOOL:(read_file|list_dir)/.test(response)) {
    failReason = 'Malformed: wrong case (lowercase tool:)';
  } else if (/\bTOOL:(read_file|list_dir)\b/.test(response) && !/<TOOL:/.test(response)) {
    failReason = 'Malformed: missing angle bracket';
  } else if (/\[read_file|\[list_dir/i.test(response)) {
    failReason = 'Malformed: square bracket instead of angle bracket';
  } else if (/I.{0,30}(read|check|look at|examine|open|access).{0,30}(file|workspace|artefact|state|json)/i.test(response)) {
    failReason = 'Plain English description of file intent — marker not emitted';
  } else if (/```[\s\S]*?TOOL:/i.test(response)) {
    failReason = 'Marker wrapped in code block (not executable)';
  }
  return { pass: false, markerFound: null, failReason };
}

// ─── API call ───────────────────────────────────────────────────────────────

function callViaCopilotProxy(prompt) {
  return new Promise((resolve, reject) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return reject(new Error('GITHUB_TOKEN not set'));
    const messages = [
      { role: 'system', content: WEB_UI_PROTOCOL },
      { role: 'user',   content: prompt },
    ];
    const body = JSON.stringify({ model: TARGET_MODEL, max_tokens: MAX_TOKENS, messages });
    const options = {
      hostname: 'api.githubcopilot.com',
      path:     '/chat/completions',
      method:   'POST',
      headers:  {
        'Authorization':          'Bearer ' + token,
        'User-Agent':             'skills-repo-spike-test',
        'Copilot-Integration-Id': 'vscode-chat',
        'Content-Type':           'application/json',
        'Content-Length':         Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 429 || res.statusCode === 529) {
            return reject(Object.assign(new Error(`HTTP ${res.statusCode} Overloaded`), { retryable: true }));
          }
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(`API error: ${JSON.stringify(parsed.error)}`.slice(0, 200)));
          const content = (parsed.choices || []).map(c => c.message && c.message.content || '').join('');
          const usage   = parsed.usage || {};
          resolve({ content, inputTokens: usage.prompt_tokens || 0, outputTokens: usage.completion_tokens || 0 });
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function callViaAnthropic(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return reject(new Error('ANTHROPIC_API_KEY not set'));
    const bodyObj = {
      model: TARGET_MODEL, max_tokens: MAX_TOKENS,
      system: WEB_UI_PROTOCOL,
      messages: [{ role: 'user', content: prompt }],
    };
    const body = JSON.stringify(bodyObj);
    const headers = {
      'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body),
      'x-api-key': apiKey, 'anthropic-version': '2023-06-01',
    };
    const req = https.request(
      { hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST', headers },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode === 529) return reject(Object.assign(new Error('API error: Overloaded'), { retryable: true }));
            const parsed = JSON.parse(data);
            if (parsed.error) return reject(new Error(`API error: ${parsed.error.message}`));
            const content = (parsed.content || []).map(b => b.text || '').join('');
            resolve({ content, inputTokens: parsed.usage && parsed.usage.input_tokens || 0, outputTokens: parsed.usage && parsed.usage.output_tokens || 0 });
          } catch (e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function callModel(prompt) {
  const fn = USE_COPILOT_PROXY ? callViaCopilotProxy : callViaAnthropic;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn(prompt);
    } catch (err) {
      lastErr = err;
      if (err.retryable && attempt < 3) {
        const waitMs = attempt * 8000;
        process.stdout.write(` [overloaded, retry ${attempt}/3 in ${waitMs/1000}s] `);
        await delay(waitMs);
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

// ─── Delay helper ───────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const activeScenarios = SCENARIO_FILTER
    ? SCENARIOS.filter(s => SCENARIO_FILTER.includes(s.id))
    : SCENARIOS;

  if (SCENARIO_FILTER && activeScenarios.length === 0) {
    console.error(`ERROR: --scenarios filter matched no scenarios. Valid IDs: ${SCENARIOS.map(s=>s.id).join(', ')}`);
    process.exit(1);
  }

  console.log(`\nwucp.0 MM1 Prompt Validation Spike`);
  const providerLabel = USE_COPILOT_PROXY ? 'Copilot proxy (GITHUB_TOKEN)' : 'Direct Anthropic (ANTHROPIC_API_KEY)';
  console.log(`Model: ${TARGET_MODEL}  |  Provider: ${providerLabel}`);
  console.log(`Scenarios: ${activeScenarios.length}/${SCENARIOS.length}  |  Dry run: ${DRY_RUN}  |  Delay: ${CALL_DELAY}ms`);
  if (SCENARIO_FILTER) console.log(`Filter: ${SCENARIO_FILTER.join(', ')}`);
  console.log(`Output: ${RESULT_DOC}\n`);

  if (DRY_RUN) {
    console.log('=== DRY RUN — scenarios only ===\n');
    activeScenarios.forEach(s => {
      console.log(`[${s.id}] ${s.skill}`);
      console.log(`  ${s.prompt}\n`);
    });
    console.log(`WEB UI PROTOCOL (${WEB_UI_PROTOCOL.length} chars):\n`);
    console.log(WEB_UI_PROTOCOL);
    return;
  }

  if (!process.env.GITHUB_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: No API credentials found in environment or .env file.');
    console.error('GITHUB_TOKEN (preferred) or ANTHROPIC_API_KEY must be set.');
    process.exit(1);
  }

  // When running a subset, seed results from the existing raw file so the doc stays complete
  let priorResults = [];
  if (SCENARIO_FILTER && fs.existsSync(RAW_OUTPUT)) {
    try {
      const prior = JSON.parse(fs.readFileSync(RAW_OUTPUT, 'utf8'));
      // Keep results for scenarios NOT in the filter (preserve prior passing results)
      priorResults = (prior.results || []).filter(r => !SCENARIO_FILTER.includes(r.id));
      console.log(`Seeded ${priorResults.length} prior results from ${RAW_OUTPUT}`);
    } catch (e) { console.warn(`Could not read prior results: ${e.message}`); }
  }

  const results = [];
  let totalPass = 0;
  let totalTokens = { input: 0, output: 0 };

  for (let i = 0; i < activeScenarios.length; i++) {
    const s = activeScenarios[i];
    process.stdout.write(`[${s.id}] ${s.skill} ... `);

    try {
      const { content, inputTokens, outputTokens } = await callModel(s.prompt);
      const { pass, markerFound, failReason } = scoreResponse(content);

      if (pass) totalPass++;
      totalTokens.input  += inputTokens;
      totalTokens.output += outputTokens;

      const status = pass ? 'PASS ✓' : 'FAIL ✗';
      console.log(`${status}${pass ? '' : `  (${failReason})`}`);

      results.push({
        id: s.id,
        skill: s.skill,
        prompt: s.prompt,
        pass,
        markerFound,
        failReason,
        response: content,
        inputTokens,
        outputTokens,
      });
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results.push({ id: s.id, skill: s.skill, prompt: s.prompt, pass: false, failReason: `API error: ${err.message}`, response: '', inputTokens: 0, outputTokens: 0 });
    }

    // Polite rate-limit pause between calls — configurable via --delay (default 500ms)
    if (i < activeScenarios.length - 1) await delay(CALL_DELAY);
  }

  // Merge new results with prior results (subset re-run case)
  const allResults = SCENARIO_FILTER
    ? [...priorResults, ...results].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    : results;
  const allPass = allResults.filter(r => r.pass).length;
  const emissionRate = Math.round((allPass / allResults.length) * 100);
  const outcomeLabel = emissionRate >= 80 ? 'A — GO (≥ 80%)' : emissionRate >= 60 ? 'B — MARGINAL (60–79%)' : 'C — BLOCKED (< 60%)';
  const proceed = emissionRate >= 60;

  console.log(`\n=== Results ===`);
  console.log(`Pass: ${allPass}/${allResults.length}  |  Emission rate: ${emissionRate}%  |  Outcome: ${outcomeLabel}`);
  console.log(`Tokens: ${totalTokens.input} in / ${totalTokens.output} out`);
  if (SCENARIO_FILTER) console.log(`(${priorResults.length} prior + ${results.length} new = ${allResults.length} total)`);

  // Write raw results JSON (audit trail)
  fs.mkdirSync(path.dirname(RAW_OUTPUT), { recursive: true });
  fs.writeFileSync(RAW_OUTPUT, JSON.stringify({ emissionRate, totalPass: allPass, scenarios: allResults.length, outcomeLabel, results: allResults }, null, 2), 'utf8');
  console.log(`Raw results written to: ${RAW_OUTPUT}`);

  // ─── Build prompt-validation-results.md ───────────────────────────────────
  const passedFailedExamples = buildExamples(allResults);
  const instructionRecommendation = buildInstructionRecommendation(allResults, emissionRate);
  const goNogo = buildGoNogo(emissionRate, outcomeLabel, allResults);

  const doc = `# wucp.0 Spike — MM1 Prompt Validation Results

**Experiment:** wucp.0 — Tool marker emission baseline
**Date:** ${new Date().toISOString().slice(0, 10)}
**Model tested:** ${TARGET_MODEL}
**Scenario count:** ${SCENARIOS.length} (8 /workflow + 6 /trace + 6 /improve)
**Scored by:** Automated marker detection (see scripts/wucp0-spike-test.js scoring rubric)

---

## Summary

| | |
|---|---|
| **Emission rate** | **${emissionRate}%** (${allPass}/${allResults.length} scenarios) |
| **Outcome** | **${outcomeLabel}** |
| **wucp.3 DoR gate** | ${proceed ? '✅ PROCEED — emission rate ≥ 60%' : '❌ BLOCKED — emission rate < 60%; see go/no-go decision below'} |
| **Tokens consumed** | ${totalTokens.input} input / ${totalTokens.output} output |

---

## Per-scenario pass/fail table

| ID | Skill | Pass | Marker emitted | Fail reason |
|----|-------|------|---------------|-------------|
${allResults.map(r =>
  `| ${r.id} | ${r.skill} | ${r.pass ? '✓' : '✗'} | ${r.markerFound ? `\`${r.markerFound.replace(/`/g, "'")}\`` : '—'} | ${r.failReason || '—'} |`
).join('\n')}

---

## Representative failure examples

${passedFailedExamples}

---

## WEB UI PROTOCOL instruction wording used

The following wording was used in the system prompt for all 20 scenarios. This is the candidate wording for inclusion in \`buildSystemPrompt()\` per wucp.3 AC6.

\`\`\`
${WEB_UI_PROTOCOL}
\`\`\`

---

## Instruction wording recommendation (wucp.3 AC3)

${instructionRecommendation}

---

## Go/no-go decision

${goNogo}
`;

  fs.mkdirSync(ARTEFACT_DIR, { recursive: true });
  fs.writeFileSync(RESULT_DOC, doc, 'utf8');
  console.log(`\nResults document written to:\n  ${RESULT_DOC}`);

  if (!proceed) {
    console.log('\n⚠ Outcome C — wucp.3 is BLOCKED. Review alternatives in prompt-validation-results.md.');
    process.exit(1);
  }
}

// ─── Report helpers ──────────────────────────────────────────────────────────

function buildExamples(results) {
  const failures = results.filter(r => !r.pass).slice(0, 3);
  const passes   = results.filter(r =>  r.pass).slice(0, 2);
  let out = '';

  if (passes.length > 0) {
    out += '### Passing examples (marker well-formed)\n\n';
    passes.forEach(r => {
      const preview = r.response.slice(0, 400).replace(/\n/g, '\\n');
      out += `**${r.id} (${r.skill}):** \`${r.prompt.slice(0, 80)}...\`\n`;
      out += `> Response (truncated): ${preview}\n\n`;
    });
  }

  if (failures.length > 0) {
    out += '### Failure examples (marker absent or malformed)\n\n';
    failures.forEach(r => {
      const preview = r.response.slice(0, 400).replace(/\n/g, '\\n');
      out += `**${r.id} (${r.skill}):** Reason: _${r.failReason}_\n`;
      out += `> Prompt: \`${r.prompt.slice(0, 80)}...\`\n`;
      out += `> Response (truncated): ${preview}\n\n`;
    });
  }

  if (out === '') out = '_No examples available._';
  return out;
}

function buildInstructionRecommendation(results, emissionRate) {
  const bySkill = {};
  SCENARIOS.forEach(s => {
    if (!bySkill[s.skill]) bySkill[s.skill] = { pass: 0, total: 0 };
    bySkill[s.skill].total++;
  });
  results.forEach(r => {
    if (r.pass) bySkill[r.skill].pass++;
  });

  const lines = Object.entries(bySkill).map(([skill, { pass, total }]) => {
    const rate = Math.round((pass / total) * 100);
    return `- **${skill}:** ${pass}/${total} (${rate}%)`;
  }).join('\n');

  if (emissionRate >= 80) {
    return `Emission rate is ${emissionRate}% (Outcome A — GO). The WEB UI PROTOCOL wording above is the **recommended verbatim text** for wucp.3 \`buildSystemPrompt()\` AC6.

Per-skill breakdown:
${lines}

No changes to the instruction wording are required before wucp.3 implementation.`;
  }

  if (emissionRate >= 60) {
    return `Emission rate is ${emissionRate}% (Outcome B — MARGINAL). The WEB UI PROTOCOL wording above **may be used in wucp.3** with an additional fallback notification AC as described below.

Per-skill breakdown:
${lines}

**Recommended addition for wucp.3 AC3 (fallback notification):**
When the model fails to emit a marker (i.e. the response contains a plain English description of file read intent without a well-formed marker), the server should inject a corrective turn:
\`[Tool marker not detected. If you intended to read a file, emit exactly: <TOOL:read_file path="..."/>]\`

This fallback notification is required at Outcome B emission rates to prevent silent tool-loop failures.`;
  }

  return `Emission rate is ${emissionRate}% (Outcome C — BLOCKED). The WEB UI PROTOCOL wording above is **not sufficient**. Two alternative approaches for wucp.3 scope revision:

**Alternative A — Structured output format:** Replace the marker approach with a two-turn conversation protocol: the server sends a structured schema as system context, and the model responds with a JSON object \`{"tool": "read_file", "path": "..."}\` when a file read is needed. More reliable but requires server-side JSON parse and error handling.

**Alternative B — Function calling via system prompt framing:** If the model consistently ignores the marker instruction in prose mode, try a tighter constraint: make the system prompt begin with an explicit instruction and reinforce the ONLY way to respond is via the marker. This is a prompt engineering adjustment only.

Per-skill breakdown:
${lines}`;
}

function buildGoNogo(emissionRate, outcomeLabel, results) {
  const failurePatterns = {};
  results.filter(r => !r.pass).forEach(r => {
    const k = r.failReason || 'Unknown';
    failurePatterns[k] = (failurePatterns[k] || 0) + 1;
  });
  const patternLines = Object.entries(failurePatterns)
    .sort((a, b) => b[1] - a[1])
    .map(([p, c]) => `- ${p}: ${c} case(s)`)
    .join('\n');

  if (emissionRate >= 80) {
    return `**Decision: GO — proceed with wucp.3 as designed (marker-based approach)**

Emission rate ${emissionRate}% exceeds the Outcome A threshold (≥ 80%). The marker-based tool loop approach is confirmed viable. wucp.3 may be dispatched.

${patternLines ? `Residual failure patterns (${100 - emissionRate}% of cases):\n${patternLines}` : 'No residual failures.'}`;
  }

  if (emissionRate >= 60) {
    return `**Decision: GO with fallback — proceed with wucp.3 with Outcome B additions**

Emission rate ${emissionRate}% meets the minimum signal (≥ 60%) but not the target (≥ 80%). wucp.3 proceeds with the marker-based approach AND must include a fallback notification strategy. See instruction recommendation section for the required addition to AC3.

Failure patterns:
${patternLines || '_None recorded._'}`;
  }

  return `**Decision: BLOCKED — wucp.3 must not be dispatched**

Emission rate ${emissionRate}% is below the minimum signal (< 60%). The marker-based approach is not viable at this reliability level. Review the alternative approaches in the instruction recommendation section. A revised spike or updated AC scope is required before wucp.3 can proceed.

Failure patterns:
${patternLines || '_None recorded._'}

**Next step:** Select Alternative A or Alternative B from the instruction recommendation section, update wucp.3 ACs accordingly, and re-run this spike with the revised instruction.`;
}

// ─── Entry point ─────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
