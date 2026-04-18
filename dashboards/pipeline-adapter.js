/**
 * pipeline-adapter.js
 * Reads .github/pipeline-state.json and exposes window.CYCLES + window.EPICS
 * in the shape expected by dashboards/index.html.
 *
 * Uses async fetch. Once data arrives, dispatches 'pipeline-loaded' so
 * index.html can remount React with live data.
 *
 * URL candidates (resolved relative to document, not this script):
 *   1. pipeline-state.json          — same directory (GitHub Pages copy step)
 *   2. ../.github/pipeline-state.json — Live Server / local dev from repo root
 *
 * Security (MC-SEC-02): no credentials, tokens, or personal identifiers.
 */
(function () {
  // ── Stage → phase key mapping ────────────────────────────────────
  var STAGE_TO_PHASE = {
    'discovery':          'discovery',
    'benefit-metric':     'benefit',
    'definition':         'definition',
    'review':             'review',
    'test-plan':          'testplan',
    'definition-of-ready':'dor',
    'issue-dispatch':     'dispatch',
    'subagent-execution': 'inner',
    'ci-assurance':       'assurance',
    'definition-of-done': 'dod',
    'trace':              'trace',
    'improve':            'improve',
  };

  function toPhaseKey(stage) {
    return STAGE_TO_PHASE[stage] || 'discovery';
  }

  // ── Story state derivation ───────────────────────────────────────
  function deriveStoryState(story) {
    if (story.dodStatus === 'complete')  return 'done';
    if (story.health === 'red')          return 'blocked';
    var reviewStages = ['review', 'test-plan', 'definition-of-ready'];
    if (reviewStages.indexOf(story.stage) !== -1) return 'review';
    if (story.health === 'green')        return 'current';
    return 'queued';
  }

  // ── Epic risk derivation ─────────────────────────────────────────
  function deriveRisk(stories) {
    if (!stories || stories.length === 0) return 'low';
    var hasRed   = stories.some(function (s) { return s.health === 'red'; });
    var hasAmber = stories.some(function (s) { return s.health === 'amber'; });
    return hasRed ? 'high' : hasAmber ? 'med' : 'low';
  }

  // ── Cycle note ───────────────────────────────────────────────────
  function cycleNote(feature) {
    var allStories = (feature.epics || []).reduce(function (acc, e) {
      return acc.concat(e.stories || []);
    }, []);
    var done  = allStories.filter(function (s) {
      return s.dodStatus === 'complete' || s.stage === 'definition-of-done';
    }).length;
    var total = allStories.length;
    var base  = feature.stage;
    return total > 0 ? base + ' \u00B7 ' + done + '/' + total + ' done' : base;
  }

  // ── Transform pipeline-state.json → CYCLES / EPICS ──────────────
  function transform(state) {
    if (!state || !Array.isArray(state.features)) return;

    window.CYCLES = state.features.map(function (f) {
      var isDone = f.stage === 'definition-of-done' || f.dodStatus === 'complete';
      return {
        id:           f.slug,
        tag:          (f.track || f.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '')),
        name:         f.name,
        currentPhase: toPhaseKey(f.stage),
        state:        f.health === 'red' ? 'blocked' : isDone ? 'done' : 'in-flight',
        note:         cycleNote(f),
      };
    });

    var epics = [];
    state.features.forEach(function (f) {
      (f.epics || []).forEach(function (epic) {
        var stories = (epic.stories || []).map(function (s) {
          var obj = {
            id:    s.slug,
            phase: toPhaseKey(s.stage),
            state: deriveStoryState(s),
          };
          if (s.health === 'red') obj.blockerId = s.slug + '-blocked';
          return obj;
        });
        epics.push({
          id:      epic.slug,
          cycleId: f.slug,
          name:    epic.name,
          risk:    deriveRisk(epic.stories || []),
          stories: stories,
        });
      });
    });
    window.EPICS = epics;
    window.dispatchEvent(new CustomEvent('pipeline-loaded'));
    console.log('[pipeline-adapter] loaded ' + window.CYCLES.length + ' feature(s)');
  }

  // ── Async fetch — try candidates in order ────────────────────────
  // fetch() resolves relative URLs against the document URL, not this script.
  // From http://127.0.0.1:5500/dashboards/index.html:
  //   ./pipeline-state.json          → /dashboards/pipeline-state.json  (Pages deployment)
  //   ../.github/pipeline-state.json → /.github/pipeline-state.json     (Live Server / dev)
  var candidates = ['./pipeline-state.json', '../.github/pipeline-state.json'];
  function tryLoad(i) {
    if (i >= candidates.length) {
      console.warn('[pipeline-adapter] could not load pipeline-state.json — dashboard shows mock data');
      return;
    }
    fetch(candidates[i])
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { transform(data); })
      .catch(function () { tryLoad(i + 1); });
  }
  tryLoad(0);
})();
