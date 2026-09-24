require('dotenv').config();
const { runSync } = require('../src/sync');

runSync().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
