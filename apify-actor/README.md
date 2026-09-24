# BuildHer Compass — Opportunity Intelligence Actor

An Apify Actor that collects internships, fellowships, scholarships, bootcamps
and hackathons from trusted public opportunity boards, and structures them
(title, organization, category, deadline, location, eligibility, application
link) for the BuildHer Compass app.

**Live on the Apify platform:** [console.apify.com/actors/v3mqraM83U2weoyzM](https://console.apify.com/actors/v3mqraM83U2weoyzM)
(deployed with `apify push`; build `0.1.2` succeeded and a verified run
produced real, structured opportunities — see the dataset from a real run at
`https://api.apify.com/v2/datasets/8FeRVPxavAvSgGsrh/items`).

Source (v0.1): [opportunitiesforafricans.com](https://www.opportunitiesforafricans.com),
a public listings site for opportunities aimed at Africans. The scraper
(`src/scraper.js`) is written so additional sources can be added as sibling
modules and merged in `scrapeOpportunities()`.

## How it works

1. For each configured category, fetch the category's listing pages (respecting
   a politeness delay between requests).
2. For each post, fetch the detail page and extract deadline, description,
   eligibility bullets, benefits, and the real "apply" link (falling back to
   the post URL when no distinct apply link exists).
3. Drop items whose deadline has already passed or can't be parsed.
4. Push each structured opportunity to the Actor's default dataset **and**
   charge the `opportunity-extracted` pay-per-event event for it, as soon as
   it's extracted (not batched at the end), per Apify's PPE best practices.

## Input

See [`.actor/input_schema.json`](.actor/input_schema.json):

- `categories` — which of `internships`, `scholarships`, `fellowships`,
  `training-and-conferences`, `contests` to collect. Empty = all.
- `maxItemsPerCategory` — how many opportunities to extract per category.
- `requestDelayMs` — delay between HTTP requests to the source site.

## Monetization (Pay-Per-Event)

The Actor charges one custom event, `opportunity-extracted`, per structured
opportunity it produces — this is its primary event. It also relies on the
`apify-actor-start` synthetic event (covers the first 5s of compute) rather
than charging a custom start event.

PPE pricing is configured in **Apify Console**, not in a file in this repo
(the platform has no local schema file for it). The Actor is already pushed
and building successfully (see the live link above) — pricing just needs to
be turned on once, by a human, in Console:

1. Open [the Actor in Console](https://console.apify.com/actors/v3mqraM83U2weoyzM) → **Monetization**.
2. Set pricing model to **Pay per event**.
3. Add event `opportunity-extracted` (mark it as the **primary event**), set
   a price (e.g. \$0.01), and enable the `apify-actor-start` synthetic event.
4. Save and publish.

This step isn't exposed over the public API, which is why it isn't scripted
here — it's a one-time, ~2 minute manual step.

## Running locally without the Apify platform

For fast iteration (and to avoid spending PPE compute credits during
development), the scraping logic lives in a plain Node module
(`src/scraper.js`) that doesn't need Apify storage at all:

```bash
npm install
npm run scrape:local          # prints JSON array of opportunities to stdout
```

The BuildHer Compass backend's `npm run sync` script (see `../backend`) uses
exactly this in local/dev mode.

## Running as a real Actor (with dataset + PPE charging)

```bash
npm install
npx apify-cli run              # uses local Apify storage under ./storage
```

## Deploying to the Apify platform

```bash
npx apify-cli login -t <APIFY_TOKEN>
npx apify-cli push
```

Then trigger runs from Apify Console, the API, or point the backend's
`APIFY_ACTOR_ID` / `APIFY_TOKEN` env vars at it so `npm run sync:apify` in
`../backend` pulls live data from the platform run's dataset instead of
running the scraper in-process.
