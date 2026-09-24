// Runs the scraper directly (no Apify platform round-trip) and prints the
// resulting opportunities as JSON on stdout. Used by the backend's local
// dev sync script so opportunities can be refreshed without deploying to
// the Apify platform or spending PPE compute credits. The deployed Actor
// (src/main.js) uses the same scraper.js and adds Actor.init/charge/pushData
// for real platform runs.
const { scrapeOpportunities } = require('../src/scraper');

const args = process.argv.slice(2);
const maxItemsPerCategory = Number(args[0]) || 6;

scrapeOpportunities({ maxItemsPerCategory })
  .then((items) => {
    process.stdout.write(JSON.stringify(items));
  })
  .catch((err) => {
    process.stderr.write(String(err?.stack || err));
    process.exit(1);
  });
