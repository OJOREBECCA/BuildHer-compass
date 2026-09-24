const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const gemini = require('../gemini');
const { buildPrompt, templateDraft } = require('../draft');

const router = express.Router();

const mk = (status) => ({ status, checklist: {} });

router.get('/', requireAuth, (req, res) => {
  res.json(db.state.applications[req.userId] ?? {});
});

// Upserts an application. Body may include `status`, a `checklist` patch
// (merged into the existing checklist, not replaced), and/or `draft` (the
// user's hand-edited version of their AI-drafted personal statement).
router.put('/:opportunityId', requireAuth, (req, res) => {
  const { state, persist } = db;
  const { opportunityId } = req.params;
  const { status, checklist, draft } = req.body || {};

  const userApps = (state.applications[req.userId] ??= {});
  const current = userApps[opportunityId] ?? mk('saved');

  const next = {
    ...current,
    ...(status ? { status } : {}),
    ...(checklist ? { checklist: { ...current.checklist, ...checklist } } : {}),
    ...(typeof draft === 'string' ? { draft } : {}),
  };
  if (status === 'submitted' && !current.submittedOn) {
    next.submittedOn = new Date().toISOString();
  }

  userApps[opportunityId] = next;
  persist();
  res.json(next);
});

// Generates (or regenerates) an AI first-draft personal statement for this
// application, tailored to the user's profile and the opportunity. Falls
// back to a template if no Gemini API key is configured or the call fails,
// so the feature never hard-fails a demo.
router.post('/:opportunityId/draft', requireAuth, async (req, res) => {
  const { state, persist } = db;
  const { opportunityId } = req.params;
  const { notes = '' } = req.body || {};

  const opportunity = state.opportunities.find((o) => o.id === opportunityId);
  if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });

  const profile = state.profiles[req.userId];
  if (!profile) return res.status(400).json({ error: 'Complete onboarding before drafting an application.' });

  let draft;
  let source;
  try {
    draft = await gemini.generateText(buildPrompt(profile, opportunity, notes));
    source = 'gemini';
  } catch (err) {
    console.warn('Gemini draft failed, using template fallback:', err.message);
    draft = templateDraft(profile, opportunity, notes);
    source = 'template';
  }

  const userApps = (state.applications[req.userId] ??= {});
  const current = userApps[opportunityId] ?? mk('saved');
  userApps[opportunityId] = { ...current, draft };
  persist();

  res.json({ draft, source, generatedAt: new Date().toISOString() });
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
