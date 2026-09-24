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

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    opportunities: db.state.opportunities.length,
    opportunitiesSyncedAt: db.state.opportunitiesSyncedAt,
  });
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
});
