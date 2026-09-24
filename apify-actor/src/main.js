const { Actor, log } = require('apify');
const { scrapeOpportunities } = require('./scraper');

Actor.main(async () => {
  const input = (await Actor.getInput()) || {};
  const {
    categories = [],
    maxItemsPerCategory = 6,
    requestDelayMs = 400,
  } = input;

  log.info('Starting BuildHer Compass Opportunity Intelligence run', {
    categories: categories.length ? categories : 'all',
    maxItemsPerCategory,
  });

  let charged = 0;
  let limitReached = false;

  const items = await scrapeOpportunities(
    { categories, maxItemsPerCategory, requestDelayMs },
    async (item) => {
      if (limitReached) return;

      // Push the item to the default dataset and charge the PPE custom event
      // for it in one call (per Apify's PPE best practice: charge as soon as
      // the unit of work is done, not in a batch at the end).
      const chargeResult = await Actor.pushData(item, 'opportunity-extracted');
      charged += 1;

      if (chargeResult?.eventChargeLimitReached) {
        limitReached = true;
        log.warning('Event charge limit reached, stopping run early.');
      }
    }
  );

  log.info(`Finished run: extracted ${items.length} opportunities, charged ${charged} events.`);

  await Actor.setValue('LAST_RUN_SUMMARY', {
    itemCount: items.length,
    finishedAt: new Date().toISOString(),
    categories: categories.length ? categories : 'all',
  });
});
