const express = require('express');
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');
const { computeMatch, MIN_DECIDED_OUTCOMES } = require('../match');
const { computeOutcomeStatsMap } = require('../outcomes');

const router = express.Router();

function withMatch(o, profile, statsMap) {
  const stats = statsMap[o.id];
  return {
    ...o,
    match: computeMatch(profile, o, stats),
    // `trusted` tells the frontend whether winRate has a large enough
    // sample to show, so it doesn't need to know the threshold itself.
    stats: stats ? { ...stats, trusted: stats.won + stats.lost >= MIN_DECIDED_OUTCOMES } : null,
  };
}

router.get('/', optionalAuth, (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  const cat = (req.query.category || 'All').toString();
  const profile = req.userId ? db.state.profiles[req.userId] : null;
  const statsMap = computeOutcomeStatsMap();

  const list = db.state.opportunities
    .filter((o) => cat === 'All' || o.category === cat)
    .filter((o) => !q || `${o.title} ${o.org}`.toLowerCase().includes(q))
    .map((o) => withMatch(o, profile, statsMap))
    .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));

  res.json(list);
});

router.get('/:id', optionalAuth, (req, res) => {
  const o = db.state.opportunities.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const profile = req.userId ? db.state.profiles[req.userId] : null;
  res.json(withMatch(o, profile, computeOutcomeStatsMap()));
});

module.exports = router;
