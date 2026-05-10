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
 *   node scripts/run-model-sweep.js --experiment EXP-002 --dry-run
 *   node scripts/run-model-sweep.js --list-skills
 *
 * Environment:
 *   ANTHROPIC_API_KEY — required (except for --dry-run and --list-skills)
 *
 * Security:
 *   - API key is never written to any output file
 *   - No user-controlled input is interpolated into API calls without sanitisation
 *   - Output files are written under workspace/experiments/ only
 *
 * Pricing reference (verify at https://www.anthropic.com/pricing before large sweeps):
 *   claude-sonnet-4-6: $3/$15 per million input/output tokens  (as of 2026-05-10)
 *   claude-opus-4-6:   $15/$75 per million input/output tokens (as of 2026-05-10)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── Configuration ─────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(REPO_ROOT, '.github', 'skills');
const EXPERIMENTS_DIR = path.join(REPO_ROOT, 'workspace', 'experiments');

/** Canonical judge model — never changes between experiments (prevents judge preference bias) */
const JUDGE_MODEL = 'claude-sonnet-4-6';

/** Number of trials per matrix cell (averaged for stability) */
const DEFAULT_TRIALS = 3;

/** Anthropic API endpoint */
const ANTHROPIC_API_HOST = 'api.anthropic.com';
const ANTHROPIC_API_PATH = '/v1/messages';
const ANTHROPIC_API_VERSION = '2023-06-01';

/** Pricing per million tokens — update when Anthropic changes pricing */
const PRICING = {
  'claude-sonnet-4-6': { inputPerM: 3.00, outputPerM: 15.00 },
  'claude-opus-4-6':   { inputPerM: 15.00, outputPerM: 75.00 },
  'claude-haiku-3-5':  { inputPerM: 0.80, outputPerM: 4.00 },
};

// ─── CLI argument parsing ───────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { skills: null, models: null, trials: DEFAULT_TRIALS, dryRun: false, listSkills: false, experiment: null };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') { args.dryRun = true; continue; }
    if (arg === '--list-skills') { args.listSkills = true; continue; }
    if (arg === '--experiment' && argv[i + 1]) { args.experiment = argv[++i]; continue; }
    if (arg === '--skills' && argv[i + 1]) { args.skills = argv[++i].split(',').map(s => s.trim()); continue; }
    if (arg === '--models' && argv[i + 1]) { args.models = argv[++i].split(',').map(s => s.trim()); continue; }
    if (arg === '--trials' && argv[i + 1]) { args.trials = parseInt(argv[++i], 10); continue; }
  }
  return args;
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

/**
 * Calls the Anthropic Messages API.
 * Returns { content, inputTokens, outputTokens }
 * Throws on non-200 responses.
 *
 * Security: apiKey is read from environment only, never logged or written to disk.
 */
function callAnthropicApi(apiKey, model, messages, maxTokens = 4096) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages,
    });
    const options = {
      hostname: ANTHROPIC_API_HOST,
      path: ANTHROPIC_API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_API_VERSION,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          // Do not include apiKey in error message
          return reject(new Error(`API error ${res.statusCode}: ${data.slice(0, 200)}`));
        }
        let parsed;
        try { parsed = JSON.parse(data); } catch (e) { return reject(new Error(`JSON parse error: ${e.message}`)); }
        const content = (parsed.content || []).map(b => b.text || '').join('');
        const inputTokens = parsed.usage?.input_tokens || 0;
        const outputTokens = parsed.usage?.output_tokens || 0;
        resolve({ content, inputTokens, outputTokens });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Cost tracking ──────────────────────────────────────────────────────────

function estimateCost(model, inputTokens, outputTokens) {
  const pricing = PRICING[model];
  if (!pricing) return null;
  return (inputTokens / 1e6) * pricing.inputPerM + (outputTokens / 1e6) * pricing.outputPerM;
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

  // Experiment ID required for all other modes
  if (!args.experiment) {
    console.error('Error: --experiment EXP-XXX is required');
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !args.dryRun) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set');
    console.error('For a dry run (no API calls), use --dry-run');
    process.exit(1);
  }

  // Discover skills
  const skills = discoverSkills(args.skills);
  if (skills.length === 0) {
    console.error('No skills with EVAL.md found' + (args.skills ? ` matching: ${args.skills.join(', ')}` : ''));
    process.exit(1);
  }

  // Determine models
  const models = args.models || Object.keys(PRICING);

  // Experiment directory
  const experimentDir = path.join(EXPERIMENTS_DIR, args.experiment);
  ensureDir(experimentDir);
  ensureDir(path.join(experimentDir, 'runs'));
  ensureDir(path.join(experimentDir, 'results'));

  // Build matrix
  const matrix = [];
  for (const skill of skills) {
    const cases = discoverCorpusCases(skill.corpusDir);
    if (cases.length === 0) {
      console.warn(`Warning: no corpus cases found for skill '${skill.skillName}' — skipping`);
      continue;
    }
    for (const corpusCase of cases) {
      for (const model of models) {
        matrix.push({ skill, corpusCase, model });
      }
    }
  }

  console.log(`\nExperiment: ${args.experiment}`);
  console.log(`Skills: ${[...new Set(matrix.map(m => m.skill.skillName))].join(', ')}`);
  console.log(`Models: ${models.join(', ')}`);
  console.log(`Matrix cells: ${matrix.length} (× ${args.trials} trials = ${matrix.length * args.trials} runs)`);

  if (args.dryRun) {
    console.log('\nDry run — no API calls. Matrix:');
    for (const cell of matrix) {
      console.log(`  ${cell.skill.skillName} × ${cell.corpusCase.caseId} × ${cell.model} × ${args.trials} trials`);
    }
    return;
  }

  // Execute matrix
  const allResults = {};
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

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

      // Step 1: Run candidate model on corpus case
      let runContent, runInputTokens, runOutputTokens;
      try {
        const skillPrompt = `You are running the /${skill.skillName} pipeline skill. ${operatorInput}`;
        const result = await callAnthropicApi(apiKey, model, [{ role: 'user', content: skillPrompt }]);
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
          const judgeResult = await callAnthropicApi(apiKey, JUDGE_MODEL, [{ role: 'user', content: judgePromptFilled }], 1024);
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

      // Save result
      const resultFilePath = writeResultFile(experimentDir, skill.skillName, corpusCase.caseId, model, trial, scoreJson || { error: 'judge failed', model_label: model });
      console.log(`  Result saved: ${path.relative(REPO_ROOT, resultFilePath)}`);

      const cost = estimateCost(model, runInputTokens, runOutputTokens);
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
  if (totalCost) console.log(`Estimated total cost: $${totalCost.toFixed(3)}`);
  console.log('\nSweep complete.');
}

main().catch(err => {
  // Ensure API key is never in the error output
  const msg = err.message.includes(process.env.ANTHROPIC_API_KEY || '____NEVER____')
    ? 'Internal error (redacted — potential credential leak in error path)'
    : err.message;
  console.error(`Fatal: ${msg}`);
  process.exit(1);
});
