const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sign, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || '');

function publicUser(u) {
  return { id: u.id, email: u.email, isGuest: !!u.isGuest };
}

// Creates (or reuses, if already holding a valid guest token) an anonymous
// account so the app can persist onboarding/tracker data before the user
// has created real credentials.
router.post('/guest', optionalAuth, (req, res) => {
  const { state, persist, id } = db;

  if (req.userId) {
    const existing = state.users.find((u) => u.id === req.userId);
    if (existing) {
      return res.json({ token: sign(existing.id), user: publicUser(existing) });
    }
  }

  const user = { id: id(), email: null, passwordHash: null, isGuest: true, createdAt: new Date().toISOString() };
  state.users.push(user);
  persist();
  res.status(201).json({ token: sign(user.id), user: publicUser(user) });
});

router.post('/signup', optionalAuth, async (req, res) => {
  const { email, password } = req.body || {};
  if (!emailOk(email) || !password || password.length < 8) {
    return res.status(400).json({ error: 'Enter a valid email and a password of at least 8 characters.' });
  }

  const { state, persist, id } = db;
  const lower = email.toLowerCase();
  if (state.users.some((u) => u.email === lower)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // If the caller is holding a guest session, upgrade that same account so
  // their existing profile/applications carry over instead of starting over.
  const guest = req.userId ? state.users.find((u) => u.id === req.userId && u.isGuest) : null;

  let user;
  if (guest) {
    guest.email = lower;
    guest.passwordHash = passwordHash;
    guest.isGuest = false;
    user = guest;
  } else {
    user = { id: id(), email: lower, passwordHash, isGuest: false, createdAt: new Date().toISOString() };
    state.users.push(user);
  }
  persist();

  res.status(201).json({ token: sign(user.id), user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!emailOk(email) || !password) {
    return res.status(400).json({ error: 'Enter a valid email and password.' });
  }

  const { state } = db;
  const user = state.users.find((u) => u.email === email.toLowerCase());
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

  res.json({ token: sign(user.id), user: publicUser(user) });
});

module.exports = router;
