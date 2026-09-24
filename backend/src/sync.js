// Refreshes db.state.opportunities from the BuildHer Compass Opportunity
// Intelligence Actor. Shared by the CLI script (backend/scripts/sync-
// opportunities.js), the in-process scheduler (backend/src/scheduler.js),
// and the manual POST /sync endpoint.
//
// Two modes:
//  - APIFY_ACTOR_ID + APIFY_TOKEN set: calls the Actor on the Apify
//    platform (a real PPE-charged run) and reads its dataset. Use this once
//    the Actor has been deployed with `apify push` (see ../apify-actor).
//  - otherwise: runs the scraper locally as a child process, for fast
//    iteration without spending Apify compute credits.
const path = require('path');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const db = require('./db');

const COMMUNITIES_SEED = require('../scripts/communities-seed.json');

let inProgress = false;
let lastError = null;

async function fetchViaApifyPlatform() {
  const { ApifyClient } = require('apify-client');
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

  console.log(`Calling Apify Actor ${process.env.APIFY_ACTOR_ID} on the platform...`);
  const run = await client.actor(process.env.APIFY_ACTOR_ID).call(
    {
      maxItemsPerCategory: Number(process.env.APIFY_MAX_ITEMS_PER_CATEGORY) || 6,
    },
    { waitSecs: 300 }
  );

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items;
}

async function fetchViaLocalScraper() {
  console.log('APIFY_ACTOR_ID not set — running the scraper locally instead of on the Apify platform.');
  const scriptPath = path.join(__dirname, '..', '..', 'apify-actor', 'scripts', 'run-local.js');
  const maxItems = process.env.APIFY_MAX_ITEMS_PER_CATEGORY || '6';
  // execFile (not execFileSync): this runs inside a long-lived server
  // process — a synchronous child-process call would block the whole
  // event loop (and every other request) for the ~minute the scrape takes.
  const { stdout } = await execFile('node', [scriptPath, maxItems], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });
  return JSON.parse(stdout);
}

async function runSync() {
  if (inProgress) return { skipped: true, reason: 'already in progress' };

  inProgress = true;
  lastError = null;
  try {
    const useApifyPlatform = process.env.APIFY_ACTOR_ID && process.env.APIFY_TOKEN;
    const items = useApifyPlatform ? await fetchViaApifyPlatform() : await fetchViaLocalScraper();

    const valid = items.filter((o) => o.id && o.title && o.deadline);
    console.log(`Fetched ${items.length} items, ${valid.length} have a usable deadline.`);

    const { state, persist } = db;
    const byId = new Map(state.opportunities.map((o) => [o.id, o]));
    for (const item of valid) byId.set(item.id, item);
    state.opportunities = [...byId.values()];
    state.opportunitiesSyncedAt = new Date().toISOString();

    if (!state.communities.length) {
      state.communities = COMMUNITIES_SEED;
    }

    persist();
    console.log(`Stored ${state.opportunities.length} total opportunities.`);
    return { skipped: false, count: state.opportunities.length };
  } catch (err) {
    lastError = err.message;
    throw err;
  } finally {
    inProgress = false;
  }
}

module.exports = {
  runSync,
  isSyncInProgress: () => inProgress,
  getLastSyncError: () => lastError,
};
