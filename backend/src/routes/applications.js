const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const mk = (status) => ({ status, checklist: {} });

router.get('/', requireAuth, (req, res) => {
  res.json(db.state.applications[req.userId] ?? {});
});

// Upserts an application. Body may include `status` and/or a `checklist`
// patch (merged into the existing checklist, not replaced).
router.put('/:opportunityId', requireAuth, (req, res) => {
  const { state, persist } = db;
  const { opportunityId } = req.params;
  const { status, checklist } = req.body || {};

  const userApps = (state.applications[req.userId] ??= {});
  const current = userApps[opportunityId] ?? mk('saved');

  const next = {
    ...current,
    ...(status ? { status } : {}),
    ...(checklist ? { checklist: { ...current.checklist, ...checklist } } : {}),
  };
  if (status === 'submitted' && !current.submittedOn) {
    next.submittedOn = new Date().toISOString();
  }

  userApps[opportunityId] = next;
  persist();
  res.json(next);
});

router.delete('/:opportunityId', requireAuth, (req, res) => {
  const { state, persist } = db;
  const userApps = state.applications[req.userId];
  if (userApps) {
    delete userApps[req.params.opportunityId];
    persist();
  }
  res.status(204).end();
});

module.exports = router;
