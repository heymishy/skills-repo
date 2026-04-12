#!/usr/bin/env node
/**
 * parse-session-timing.js
 *
 * Parses GitHub Copilot Chat transcript JSONL files to extract per-prompt
 * and per-session timing data for operator focus time estimation (E3).
 *
 * Usage:
 *   node scripts/parse-session-timing.js [path]
 *
 * [path] can be:
 *   - A single .jsonl file
 *   - A directory containing .jsonl files (processes all)
 *   - Omitted: auto-discovers workspace transcript directories under
 *     %APPDATA%\Code\User\workspaceStorage\*\GitHub.copilot-chat\transcripts\
 *
 * Flags:
 *   --detail       Show per-prompt timeline
 *   --summary      Compact one-liner per session + aggregate totals
 *   --max-gap N    Cap idle gaps at N minutes (default: 15). Gaps longer than
 *                  this are excluded from focusTime as away/idle time.
 *
 * Output:
 *   Per-prompt timeline (prompt time, model start, model end, gaps)
 *   Per-session summary (span, active focus time, model time, tool time, prompts)
 *   TSV row for pasting into estimation-norms / results.tsv
 *
 * Definitions:
 *   focusTime  — sum of (user.message.ts - prev assistant.turn_end.ts)
 *                for gaps <= --max-gap threshold. Represents time operator
 *                was actively reading responses and composing prompts.
 *                Gaps above the threshold are counted as idleTime (away, sleep,
 *                other work) and excluded.
 *   modelTime  — sum of (assistant.turn_end.ts - assistant.turn_start.ts)
 *                = time model was generating (includes tool execution)
 *   toolTime   — sum of (tool.execution_complete.ts - tool.execution_start.ts)
 *                only for tool calls scoped within a single turn window.
 *                Cross-turn or cross-session tool matches are excluded.
 *   span       — last event timestamp - session.start
 *   idleTime   — sum of gaps > --max-gap threshold (overnight, context switches)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(ms) {
  if (ms < 0) return '-' + fmt(-ms);
  const s = Math.round(ms / 1000);
  if (s < 60)  return s + 's';
  const m = Math.floor(s / 60), rs = s % 60;
  if (m < 60)  return m + 'm' + (rs ? rs + 's' : '');
  const h = Math.floor(m / 60), rm = m % 60;
  return h + 'h' + (rm ? rm + 'm' : '');
}

function fmtMs(ms) {
  return ms < 0 ? '-' + fmtMs(-ms) : ms + 'ms';
}

function ts(iso) { return new Date(iso).getTime(); }

// ─── transcript parser ────────────────────────────────────────────────────────

function parseTranscript(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n').filter(l => l.trim());
  const events = [];
  for (const line of lines) {
    try { events.push(JSON.parse(line)); } catch { /* skip malformed */ }
  }
  if (!events.length) return null;

  // ── gather keyed events ────────────────────────────────────────────────────
  let sessionStart = null;
  const userMessages    = [];  // { ts, content, id }
  const turnStarts      = [];  // { ts, turnId, id }
  const turnEnds        = [];  // { ts, turnId, id }
  const toolStartsList  = [];  // [ { callId, ts, name } ] ordered
  const toolEndsList    = [];  // [ { callId, ts } ] ordered

  for (const e of events) {
    switch (e.type) {
      case 'session.start':
        sessionStart = { ts: ts(e.timestamp), raw: e };
        break;
      case 'user.message':
        userMessages.push({ ts: ts(e.timestamp), content: e.data.content, id: e.id });
        break;
      case 'assistant.turn_start':
        turnStarts.push({ ts: ts(e.timestamp), turnId: e.data?.turnId, id: e.id });
        break;
      case 'assistant.turn_end':
        turnEnds.push({ ts: ts(e.timestamp), turnId: e.data?.turnId, id: e.id });
        break;
      case 'tool.execution_start':
        toolStartsList.push({ callId: e.data.toolCallId, ts: ts(e.timestamp), name: e.data.toolName });
        break;
      case 'tool.execution_complete':
        toolEndsList.push({ callId: e.data.toolCallId, ts: ts(e.timestamp) });
        break;
    }
  }

  if (!sessionStart || !userMessages.length) return null;

  // ── per-prompt turn reconstruction ────────────────────────────────────────
  // Build turn windows: each prompt → next turn_start → next turn_end
  const turns = [];
  let tStartIdx = 0;
  let tEndIdx   = 0;
  for (let i = 0; i < userMessages.length; i++) {
    const prompt = userMessages[i];
    const prevTurnEnd = i === 0 ? null : (turns[i - 1]?.tEnd || null);

    // Find the next turn_start at or after this prompt (advance index)
    while (tStartIdx < turnStarts.length && turnStarts[tStartIdx].ts < prompt.ts) tStartIdx++;
    const tStart = turnStarts[tStartIdx] || null;
    if (tStart) tStartIdx++;

    // Find the next turn_end at or after tStart
    const tEndSearch = tStart ? tStart.ts : prompt.ts;
    while (tEndIdx < turnEnds.length && turnEnds[tEndIdx].ts < tEndSearch) tEndIdx++;
    const tEnd = turnEnds[tEndIdx] || null;
    if (tEnd) tEndIdx++;

    const modelDuration = (tStart && tEnd) ? tEnd.ts - tStart.ts : null;
    const promptDelay   = (tStart)          ? tStart.ts - prompt.ts : null;
    const focusGap      = prevTurnEnd       ? prompt.ts - prevTurnEnd.ts : null;

    turns.push({ i: i + 1, prompt, tStart, tEnd, modelDuration, promptDelay, focusGap,
                 turnWindow: tStart && tEnd ? { from: tStart.ts, to: tEnd.ts } : null });
  }

  // ── per-tool durations — only within confirmed turn windows ───────────────
  // Build a map from callId → start event, then match complete events
  const toolStartMap = {};
  for (const s of toolStartsList) toolStartMap[s.callId] = s;

  // Turn windows for containment check
  const turnWindows = turns.filter(t => t.turnWindow).map(t => t.turnWindow);

  const toolDurations = [];
  let totalToolMs = 0;
  for (const endEvt of toolEndsList) {
    const startEvt = toolStartMap[endEvt.callId];
    if (!startEvt) continue;
    const dur = endEvt.ts - startEvt.ts;
    if (dur < 0) continue; // reject inverted timestamps
    // Only count if both start and end fall within the same turn window
    const inWindow = turnWindows.some(w =>
      startEvt.ts >= w.from && endEvt.ts <= w.to + 2000 // 2s tolerance
    );
    if (!inWindow) continue;
    toolDurations.push({ name: startEvt.name, dur });
    totalToolMs += dur;
  }

  // ── session totals with idle-gap detection ────────────────────────────────
  const lastTs  = events[events.length - 1];
  const spanMs  = ts(lastTs.timestamp) - sessionStart.ts;
  const modelMs = turns.reduce((s, t) => s + (t.modelDuration || 0), 0);
  const promptCount = userMessages.length;

  return {
    file: path.basename(filePath),
    sessionId: sessionStart.raw.data?.sessionId || path.basename(filePath, '.jsonl'),
    startTime: new Date(sessionStart.ts).toISOString(),
    turns,
    toolDurations,
    spans: { spanMs, modelMs, toolMs: totalToolMs },
    promptCount,
    // focusMs and idleMs computed at render time (caller supplies threshold)
  };
}

// ─── report renderer ─────────────────────────────────────────────────────────

function computeFocus(turns, maxGapMs) {
  let focusMs = 0, idleMs = 0, idleGaps = 0;
  for (const t of turns) {
    if (t.focusGap == null || t.focusGap < 0) continue; // skip missing or anomalous negative gaps
    if (t.focusGap <= maxGapMs) {
      focusMs += t.focusGap;
    } else {
      idleMs += t.focusGap;
      idleGaps++;
    }
  }
  return { focusMs, idleMs, idleGaps };
}

function renderSession(s, detail, maxGapMs) {
  const { sessionId, startTime, spans, promptCount, turns, toolDurations } = s;
  const { spanMs, modelMs, toolMs } = spans;
  const { focusMs, idleMs, idleGaps } = computeFocus(turns, maxGapMs);

  console.log('\n' + '═'.repeat(72));
  console.log(`Session: ${sessionId}`);
  console.log(`Started: ${startTime}`);
  console.log(`Prompts: ${promptCount}  |  Span: ${fmt(spanMs)}  |  Focus: ${fmt(focusMs)}  |  Model: ${fmt(modelMs)}  |  Tools: ${fmt(toolMs)}`);
  if (idleGaps > 0) {
    console.log(`  (Idle gaps excluded: ${idleGaps} gap(s) > ${fmt(maxGapMs)} = ${fmt(idleMs)} total — not counted as focus time)`);
  }

  if (detail) {
    console.log('\n── Per-prompt timeline ──────────────────────────────────────────');
    console.log(
      '#'.padEnd(4) +
      'Prompt time (UTC)'.padEnd(26) +
      'Gap (read+think)'.padEnd(18) +
      'Delay→model'.padEnd(14) +
      'Model duration'
    );
    console.log('─'.repeat(72));
    for (const t of turns) {
      const promptTime = new Date(t.prompt.ts).toISOString().replace('T', ' ').slice(0, 19);
      const raw      = t.focusGap;
      const isIdle   = raw != null && raw > maxGapMs;
      const gapLabel = raw == null ? '(first)' : (isIdle ? fmt(raw) + ' [idle]' : fmt(raw));
      const delay    = t.promptDelay  != null ? fmtMs(t.promptDelay) : '—';
      const model    = t.modelDuration != null ? fmt(t.modelDuration) : '—';
      const preview  = t.prompt.content.replace(/\r?\n/g, ' ').slice(0, 60);
      console.log(
        String(t.i).padEnd(4) +
        promptTime.padEnd(26) +
        gapLabel.padEnd(18) +
        delay.padEnd(14) +
        model
      );
      console.log('     └─ ' + preview + (t.prompt.content.length > 60 ? '…' : ''));
    }

    if (toolDurations.length) {
      const top = [...toolDurations].sort((a, b) => b.dur - a.dur).slice(0, 8);
      console.log('\n── Top tool calls by duration ───────────────────────────────────');
      for (const t of top) {
        console.log(`  ${fmt(t.dur).padEnd(10)}  ${t.name}`);
      }
    }
  }

  // TSV row for estimation-norms / results.tsv
  const focusH = (focusMs  / 3600000).toFixed(2);
  const modelH = (modelMs  / 3600000).toFixed(2);
  const spanH  = (spanMs   / 3600000).toFixed(2);
  const idleH  = (idleMs   / 3600000).toFixed(2);
  console.log('\n── TSV row (paste into estimation context) ──────────────────────');
  console.log('sessionId\tstart\tprompts\tspan_h\tfocus_h\tmodel_h\ttool_h\tidle_h');
  console.log([
    sessionId.slice(0, 8) + '…',
    startTime.slice(0, 16),
    promptCount,
    spanH,
    focusH,
    modelH,
    (toolMs / 3600000).toFixed(2),
    idleH,
  ].join('\t'));
}

// ─── file discovery ───────────────────────────────────────────────────────────

function findTranscriptDirs() {
  const base = path.join(process.env.APPDATA || '', 'Code', 'User', 'workspaceStorage');
  if (!fs.existsSync(base)) return [];
  const dirs = [];
  for (const hash of fs.readdirSync(base)) {
    const p = path.join(base, hash, 'GitHub.copilot-chat', 'transcripts');
    if (fs.existsSync(p)) dirs.push(p);
  }
  return dirs;
}

function collectFiles(target) {
  if (!target) {
    const dirs = findTranscriptDirs();
    if (!dirs.length) { console.error('No Copilot Chat transcript directories found.'); process.exit(1); }
    console.log(`Found ${dirs.length} workspace(s) with Copilot Chat transcripts.`);
    return dirs.flatMap(d => fs.readdirSync(d).filter(f => f.endsWith('.jsonl')).map(f => path.join(d, f)));
  }
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    return fs.readdirSync(target).filter(f => f.endsWith('.jsonl')).map(f => path.join(target, f));
  }
  return [target];
}

// ─── main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const target  = args.find(a => !a.startsWith('--'));
  const detail  = args.includes('--detail');   // show per-prompt table
  const summary = args.includes('--summary');  // one-liner per session only

  // --max-gap N (minutes, default 15)
  const mgEq  = args.find(a => a.startsWith('--max-gap='));
  const mgIdx = args.indexOf('--max-gap');
  const mgRaw = mgEq ? mgEq.split('=')[1] : (mgIdx >= 0 && args[mgIdx + 1] && !args[mgIdx + 1].startsWith('--') ? args[mgIdx + 1] : null);
  const maxGapMin = mgRaw ? parseInt(mgRaw, 10) : 15;
  const maxGapMs  = maxGapMin * 60 * 1000;

  const files = collectFiles(target);
  if (!files.length) { console.error('No .jsonl files found.'); process.exit(1); }

  console.log(`Parsing ${files.length} transcript file(s)…`);

  const sessions = [];
  for (const f of files) {
    const s = parseTranscript(f);
    if (s) sessions.push(s);
  }

  // Sort by start time
  sessions.sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (summary) {
    // Compact multi-session summary table
    console.log('\n' + ['Start (UTC)'.padEnd(20), 'Prompts'.padEnd(9), 'Span'.padEnd(10), 'Focus'.padEnd(10), 'Model'.padEnd(10), 'SessionId'].join(''));
    console.log('─'.repeat(80));
    let totPrompts = 0, totSpan = 0, totFocus = 0, totModel = 0, totIdle = 0;
    for (const s of sessions) {
      const { spanMs, modelMs } = s.spans;
      const { focusMs, idleMs } = computeFocus(s.turns, maxGapMs);
      totPrompts += s.promptCount; totSpan += spanMs; totFocus += focusMs;
      totModel += modelMs; totIdle += idleMs;
      console.log([
        s.startTime.slice(0, 16).padEnd(20),
        String(s.promptCount).padEnd(9),
        fmt(spanMs).padEnd(10),
        fmt(focusMs).padEnd(10),
        fmt(modelMs).padEnd(10),
        s.sessionId.slice(0, 8) + '…',
      ].join(''));
    }
    console.log('─'.repeat(80));
    console.log([
      'TOTAL'.padEnd(20),
      String(totPrompts).padEnd(9),
      fmt(totSpan).padEnd(10),
      fmt(totFocus).padEnd(10),
      fmt(totModel).padEnd(10),
    ].join(''));
    console.log(`\nFocus fraction: ${(totFocus / totSpan * 100).toFixed(1)}%  (active focus / span)`);
    console.log(`Model fraction: ${(totModel / totSpan * 100).toFixed(1)}%  (model time / span)`);
    console.log(`Idle excluded:  ${fmt(totIdle)} across ${sessions.length} session(s) (gaps > ${maxGapMin}m)`);
    console.log(`Max-gap used:   ${maxGapMin}m  (change with --max-gap N)`);
    return;
  }

  for (const s of sessions) {
    renderSession(s, detail, maxGapMs);
  }
}

main();
