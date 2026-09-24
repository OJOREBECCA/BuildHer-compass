const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.json(db.state.profiles[req.userId] ?? null);
});

router.put('/', requireAuth, (req, res) => {
  const { state, persist } = db;
  const p = req.body || {};

  if (!p.firstName || !p.lastName) {
    return res.status(400).json({ error: 'firstName and lastName are required.' });
  }

  state.profiles[req.userId] = {
    firstName: p.firstName,
    lastName: p.lastName,
    country: p.country ?? '',
    city: p.city ?? '',
    stage: p.stage ?? '',
    level: p.level ?? '',
    linkedin: p.linkedin ?? '',
    portfolio: p.portfolio ?? '',
    github: p.github ?? '',
    interests: Array.isArray(p.interests) ? p.interests : [],
    preferences: Array.isArray(p.preferences) ? p.preferences : [],
  };
  persist();
  res.json(state.profiles[req.userId]);
});

module.exports = router;
