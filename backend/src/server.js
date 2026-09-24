require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const opportunityRoutes = require('./routes/opportunities');
const applicationRoutes = require('./routes/applications');
const communityRoutes = require('./routes/communities');
const aiRoutes = require('./routes/ai');
const db = require('./db');
const { startScheduler, getIntervalMs } = require('./scheduler');
const { runSync, isSyncInProgress, getLastSyncError } = require('./sync');

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://build-her-compass.vercel.app',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  const syncedAt = db.state.opportunitiesSyncedAt;
  res.json({
    ok: true,
    opportunities: db.state.opportunities.length,
    opportunitiesSyncedAt: syncedAt,
    nextSyncAt: syncedAt ? new Date(new Date(syncedAt).getTime() + getIntervalMs()).toISOString() : null,
    syncInProgress: isSyncInProgress(),
    lastSyncError: getLastSyncError(),
  });
});

// Manual "sync now" trigger for the dashboard's refresh button. Fires the
// sync in the background and returns immediately — poll /health for
// opportunitiesSyncedAt to see when it's done. A short cooldown keeps this
// public, unauthenticated endpoint from being hammered.
let lastManualTriggerAt = 0;
app.post('/sync', (_req, res) => {
  if (isSyncInProgress()) return res.status(202).json({ ok: true, status: 'already running' });

  if (Date.now() - lastManualTriggerAt < 30_000) {
    return res.status(429).json({ error: 'Sync was just triggered — try again in a moment.' });
  }
  lastManualTriggerAt = Date.now();

  runSync().catch((err) => console.warn('Manual sync failed:', err.message));
  res.status(202).json({ ok: true, status: 'started' });
});

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/opportunities', opportunityRoutes);
app.use('/applications', applicationRoutes);
app.use('/communities', communityRoutes);
app.use('/ai', aiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`BuildHer Compass API listening on http://localhost:${PORT}`);
  startScheduler();
});
