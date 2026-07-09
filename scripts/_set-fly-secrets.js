'use strict';
// Reads .env and sets required Fly.io secrets for the skills-framework app.
// Run with: node scripts/_set-fly-secrets.js
// Requires flyctl on PATH or at /c/Users/Hamis/.fly/bin/fly
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envFile = path.join(__dirname, '../.env');
const raw = fs.readFileSync(envFile, 'utf8').replace(/^﻿/, '');
const env = {};
raw.split('\n').forEach(line => {
  const t = line.trim();
  if (!t || t[0] === '#') return;
  const idx = t.indexOf('=');
  if (idx === -1) return;
  const key = t.slice(0, idx).trim();
  const val = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  env[key] = val;
});

const FLY = 'C:\\Users\\Hamis\\.fly\\bin\\fly.exe';
const APP = 'skills-framework';
const CALLBACK_URL = `https://${APP}.fly.dev/auth/github/callback`;

const secrets = {
  NODE_ENV:                     'production',
  GITHUB_CLIENT_ID:             env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET:         env.GITHUB_CLIENT_SECRET,
  SESSION_SECRET:               env.SESSION_SECRET,
  GITHUB_CALLBACK_URL:          CALLBACK_URL,
  GITHUB_TOKEN:                 env.GITHUB_TOKEN,
  GITHUB_REPO_OWNER:            env.GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME:             env.GITHUB_REPO_NAME,
  GITHUB_REPO:                  env.GITHUB_REPO,
  WUCE_REPOSITORIES:            env.WUCE_REPOSITORIES,
  WUCE_TURN_MODEL:              env.WUCE_TURN_MODEL,
  WUCE_ENABLE_THINKING:         env.WUCE_ENABLE_THINKING,
  WUCE_THINKING_BUDGET_TOKENS:  env.WUCE_THINKING_BUDGET_TOKENS,
  WUCE_OPERATOR_THINKING_BUDGET:env.WUCE_OPERATOR_THINKING_BUDGET,
  WUCE_MAX_HISTORY_TURNS:       env.WUCE_MAX_HISTORY_TURNS,
  WUCE_INIT_MAX_TOKENS:         env.WUCE_INIT_MAX_TOKENS,
  WUCE_MAX_LEARNINGS_LINES:     env.WUCE_MAX_LEARNINGS_LINES,
  SKILL_EXECUTOR_PROVIDER:      'copilot',
  ANTHROPIC_API_KEY:            env.ANTHROPIC_API_KEY,
  DATABASE_URL:                 env.DATABASE_URL,
  UPSTASH_REDIS_REST_URL:       env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN:     env.UPSTASH_REDIS_REST_TOKEN,
  TENANT_ORG_ALLOWLIST:         '',
  ADMIN_GITHUB_LOGINS:          env.ADMIN_GITHUB_LOGINS || '',
  MAX_JOURNEYS_PER_TENANT:      '5',
};

// Verify nothing critical is blank
const required = ['GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET','SESSION_SECRET','GITHUB_TOKEN','DATABASE_URL','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'];
const missing = required.filter(k => !secrets[k]);
if (missing.length) {
  console.error('ERROR: missing values for:', missing.join(', '));
  process.exit(1);
}

// Build the fly secrets set command
const pairs = Object.entries(secrets)
  .map(([k, v]) => `${k}=${v}`)
  .join(' ');

const cmd = `"${FLY}" secrets set --app ${APP} ${pairs}`;
console.log(`Setting ${Object.keys(secrets).length} secrets on ${APP}...`);
try {
  const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
  console.log(out);
  console.log('✅ All secrets set.');
  console.log(`\nNext: Update GitHub OAuth App callback URL to:\n  ${CALLBACK_URL}`);
  console.log(`Then run: "${FLY}" deploy --app ${APP}`);
} catch (err) {
  console.error(err.stderr || err.message);
  process.exit(1);
}
