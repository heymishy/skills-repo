/**
 * pipeline-adapter.js
 * Reads .github/pipeline-state.json and exposes window.CYCLES + window.EPICS
 * in the shape expected by dashboards/index.html.
 *
 * Runs synchronously before the Babel/React block so data is available at
 * component bootstrap. Tries two paths:
 *   1. pipeline-state.json  — same directory (GitHub Pages after workflow copy)
 *   2. ../.github/pipeline-state.json  — local dev server from repo root
 * Falls back silently; index.html falls back to inline mock data.
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
  }

  // ── Synchronous XHR load ─────────────────────────────────────────
  function loadSync(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false); // synchronous — intentional for pre-render population
    xhr.send();
    if (xhr.status === 200) return JSON.parse(xhr.responseText);
    return null;
  }

  // Try local copy first (Pages deployment), then relative path for dev server
  var candidates = ['./pipeline-state.json', '../.github/pipeline-state.json'];
  for (var i = 0; i < candidates.length; i++) {
    try {
      var state = loadSync(candidates[i]);
      if (state) { transform(state); break; }
    } catch (e) { /* next candidate */ }
  }
})();
