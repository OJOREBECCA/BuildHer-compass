const db = require('./db');

// Aggregates real outcomes (marked by users on the Submitted screen) across
// every account, per opportunity — this is what turns the match % from a
// pure heuristic into something partly earned by the community's actual
// results. Requires a minimum sample before it's trusted (see match.js).
function computeOutcomeStatsMap() {
  const map = {};

  for (const userApps of Object.values(db.state.applications)) {
    for (const [opportunityId, app] of Object.entries(userApps)) {
      if (app.status !== 'submitted') continue;

      const entry = (map[opportunityId] ??= { submitted: 0, won: 0, lost: 0 });
      entry.submitted += 1;
      if (app.outcome === 'won') entry.won += 1;
      if (app.outcome === 'lost') entry.lost += 1;
    }
  }

  for (const entry of Object.values(map)) {
    const decided = entry.won + entry.lost;
    entry.winRate = decided ? entry.won / decided : null;
  }

  return map;
}

function getOutcomeStats(opportunityId) {
  return computeOutcomeStatsMap()[opportunityId] ?? { submitted: 0, won: 0, lost: 0, winRate: null };
}

module.exports = { computeOutcomeStatsMap, getOutcomeStats };
