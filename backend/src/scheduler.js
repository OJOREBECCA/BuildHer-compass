// Keeps the local opportunities store fresh on a cadence, independent of
// the Apify Scheduler that runs the Actor itself on the platform (see
// apify-actor/README.md). This is what lets a plain `npm run dev` show
// live-ish data without anyone remembering to run `npm run sync` by hand.
const db = require('./db');
const { runSync, isSyncInProgress } = require('./sync');

const DEFAULT_INTERVAL_MINUTES = 60;

function getIntervalMs() {
  const minutes = Number(process.env.SYNC_INTERVAL_MINUTES) || DEFAULT_INTERVAL_MINUTES;
  return minutes * 60 * 1000;
}

function startScheduler() {
  const intervalMs = getIntervalMs();

  const tick = () => {
    if (isSyncInProgress()) return;
    runSync().catch((err) => console.warn('Scheduled sync failed:', err.message));
  };

  // First run ever (empty store): sync immediately so a fresh clone isn't
  // stuck showing zero opportunities until the next tick. Subsequent
  // restarts during dev don't force a resync — wait for the normal cadence.
  if (db.state.opportunities.length === 0) tick();

  const timer = setInterval(tick, intervalMs);
  timer.unref?.(); // don't keep the process alive just for this

  console.log(`Opportunity sync scheduled every ${intervalMs / 60000} minute(s).`);
}

module.exports = { startScheduler, getIntervalMs };
