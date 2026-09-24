const express = require('express');
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');
const { computeMatch } = require('../match');
const { computeOutcomeStatsMap } = require('../outcomes');

const router = express.Router();

// Deterministic, explainable assistant over the real opportunity data.
// Not a call to an external LLM: there is no LLM API key configured for
// this project. Swap the body of this handler for a real model call
// (Anthropic, etc.) behind an env var once one is available.
router.post('/chat', optionalAuth, (req, res) => {
  const { prompt = '' } = req.body || {};
  const p = prompt.toLowerCase();
  const profile = req.userId ? db.state.profiles[req.userId] : null;

  const statsMap = computeOutcomeStatsMap();
  const withMatch = db.state.opportunities.map((o) => ({ ...o, match: computeMatch(profile, o, statsMap[o.id]) }));
  const soon = [...withMatch].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));

  if (!withMatch.length) {
    return res.json({ text: "I don't have any opportunities loaded yet — try again after the next sync." });
  }

  if (p.includes('remote')) {
    const remote = withMatch.filter((o) => o.location === 'Remote');
    const text = remote.length
      ? `Remote picks: ${remote.map((o) => `${o.title} (${o.match}% match)`).join('; ')}.`
      : "I don't see any fully remote opportunities right now — here's what's closing soonest instead: " +
        soon.slice(0, 2).map((o) => o.title).join(' and ') + '.';
    return res.json({ text });
  }

  const top = soon.slice(0, 2);
  res.json({
    text: `Focus on ${top.map((o) => o.title).join(' and ')}: they close first. Start with the checklist so you're ready to submit.`,
  });
});

module.exports = router;
