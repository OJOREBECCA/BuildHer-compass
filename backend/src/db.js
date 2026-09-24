const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const empty = () => ({
  users: [],         // { id, email, passwordHash, isGuest, createdAt }
  profiles: {},       // userId -> profile
  applications: {},   // userId -> { [opportunityId]: { status, checklist, submittedOn } }
  opportunities: [],  // Opportunity[]
  communities: [],    // Community[]
  opportunitiesSyncedAt: null,
});

function load() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const seed = empty();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    return { ...empty(), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  } catch {
    return empty();
  }
}

let state = load();

function persist() {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

const id = () => crypto.randomUUID();

module.exports = {
  get state() {
    return state;
  },
  persist,
  id,
};
