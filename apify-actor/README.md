# BuildHer Compass — Opportunity Intelligence Actor

**Live on the Apify platform:** [console.apify.com/actors/v3mqraM83U2weoyzM](https://console.apify.com/actors/v3mqraM83U2weoyzM)
— pushed with `apify push`, build `0.1.2` succeeded, and a verified platform
run produced real structured opportunities (see a real run's dataset at
`https://api.apify.com/v2/datasets/8FeRVPxavAvSgGsrh/items`).

## The problem it solves

Tech opportunities for African women — internships, fellowships,
scholarships, bootcamps, hackathons — are scattered across LinkedIn,
WhatsApp groups, newsletters, and dozens of individual community
websites. People miss out not because opportunities don't exist, but
because *discovering and understanding them* is genuinely hard: every
source has its own format, half-updated deadline, and inconsistent
structure. [BuildHer Compass](../README.md) exists to turn "discover →
understand → apply → track" into one flow instead of five browser tabs.

This Actor is the **data engine** behind that: it goes to a trusted public
listings source, reads real posts the way a person would, and turns messy
prose into the structured records — title, organization, category,
deadline, location, eligibility, application link — that the rest of the
product depends on. Everything downstream (BuildHer Compass's per-user
match scoring, deadline reminders, calendar export, the "did you get it?"
outcome tracking) only works because this Actor first turns unstructured
web pages into clean data.

## Technologies and tools used

- **[Apify SDK for JavaScript](https://docs.apify.com/sdk/js/)** (`apify` npm package) —
  `Actor.init`/`Actor.exit`, `Actor.getInput`, `Actor.pushData`, and
  `Actor.charge` for Pay-Per-Event monetization.
- **[Cheerio](https://cheerio.js.org/)** for HTML parsing/extraction (no headless browser needed — the source is static server-rendered HTML, so Cheerio is faster and cheaper than Puppeteer/Playwright for this job).
- **Node.js 20** (`apify/actor-node:20` base image) — no other runtime dependencies; HTTP requests use the platform's native `fetch`.
- **Docker**, via Apify's standard actor Dockerfile, for the platform build/run.
- **Apify Scheduler** — the Actor also runs on a real 6-hour cron schedule (`0 */6 * * *`) on the platform, independent of anything in the consuming app.
- Consumed by an **Express/Node.js backend** ([`../backend`](../backend)) and a **React/Vite frontend** ([`../frontend`](../frontend)) — see the [root README](../README.md) for the full stack.

## How it works

1. For each configured category, fetch the category's listing pages
   (respecting a politeness delay between requests).
2. For each post, fetch the detail page and extract the deadline,
   description, eligibility bullets, benefits, and the real "apply" link
   (falling back to the post URL when no distinct apply link exists).
3. Drop items whose deadline has already passed or can't be parsed —
   only usable, actionable opportunities get charged and pushed.
4. Push each structured opportunity to the Actor's default dataset **and**
   charge the `opportunity-extracted` pay-per-event event for it, as soon
   as it's extracted (not batched at the end), per Apify's PPE best
   practices.

Source (v0.1): [opportunitiesforafricans.com](https://www.opportunitiesforafricans.com),
a public listings site for opportunities aimed at Africans. `src/scraper.js`
is written so additional sources can be added as sibling modules and merged
into `scrapeOpportunities()`.

## Input

See [`.actor/input_schema.json`](.actor/input_schema.json) — every field is
optional:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `categories` | array of strings | all | Which of `internships`, `scholarships`, `fellowships`, `training-and-conferences`, `contests` to collect. |
| `maxItemsPerCategory` | integer | `6` | How many opportunities to extract per category, per run. |
| `requestDelayMs` | integer | `400` | Politeness delay between HTTP requests to the source site. |

Example input:

```json
{
  "categories": ["internships", "fellowships"],
  "maxItemsPerCategory": 10,
  "requestDelayMs": 500
}
```

## Output

Each dataset item is one structured opportunity — see
[`.actor/dataset_schema.json`](.actor/dataset_schema.json) for the full
JSON Schema and the Store "Output" tab's table view. Example item:

```json
{
  "id": "gates-cambridge-scholarship-programme-2027-2028",
  "title": "Gates Cambridge Scholarship Programme 2027/2028",
  "org": "Gates Cambridge",
  "category": "Scholarship",
  "deadline": "2027-01-05T23:59:00.000Z",
  "location": "Remote",
  "summary": "Short excerpt of the opportunity description…",
  "description": "Longer excerpt of the opportunity description…",
  "eligibility": [
    { "label": "Open to applicants meeting the criteria in the listing", "met": true }
  ],
  "benefits": ["Full tuition", "Living stipend", "Visa support"],
  "url": "https://www.gatescambridge.org/apply/",
  "sourceUrl": "https://www.opportunitiesforafricans.com/...",
  "source": "opportunitiesforafricans.com",
  "scrapedAt": "2026-09-24T15:39:02.105Z"
}
```

## Monetization (Pay-Per-Event) / open-source status

The Actor charges one custom event, **`opportunity-extracted`**, per
structured opportunity it produces — this is its primary event, charged via
`Actor.pushData(item, 'opportunity-extracted')` in `src/main.js` as soon as
each item is ready (not batched at the end). It relies on the
`apify-actor-start` synthetic event (covers the first 5s of compute) rather
than a custom start event.

**Current status: code is monetization-ready; the Console-side pricing
toggle has not been turned on yet, and the Actor is still private
(`isPublic: false`).** Both of the checklist's acceptable options —
open-sourcing on the Store, or enabling PPE — are one manual step away,
and neither can be done over the public API (Apify doesn't expose a
publish/monetize endpoint), so this is a deliberate "last mile" step left
for a human with Console access. Pick one:

**Option A — Pay-Per-Event** (matches how the code is already written):
1. Open [the Actor in Console](https://console.apify.com/actors/v3mqraM83U2weoyzM) → **Monetization**.
2. Set pricing model to **Pay per event**.
3. Add event `opportunity-extracted` (mark it the **primary event**), set a
   price (e.g. \$0.01), and enable the `apify-actor-start` synthetic event.
4. Save, then **Publish** from the Actor's main page.

**Option B — Open-source on the Store** (free/public):
1. Open the Actor in Console → the top-right **Publish** action.
2. Fill in the Store listing fields it asks for (categories etc. — the
   description and README are already in place here).
3. Publish. (No pricing model needs to be set for a free public Actor.)

## Running locally without the Apify platform

For fast iteration (and to avoid spending PPE compute credits during
development), the scraping logic lives in a plain Node module
(`src/scraper.js`) that doesn't need Apify storage at all:

```bash
npm install
npm run scrape:local            # prints a JSON array of opportunities to stdout
npm run scrape:local -- 10      # optional arg: max items per category (default 6)
```

The BuildHer Compass backend's `npm run sync` script (see
[`../backend`](../backend)) uses exactly this in local/dev mode.

## Running as a real Actor (dataset + PPE charging, no platform account needed)

```bash
npm install
npx apify-cli run                # uses local Apify storage under ./storage
```

This runs the same `Actor.init`/`Actor.pushData`/`Actor.charge` code path
used on the platform, but against local file storage — `Actor.charge` calls
succeed as no-ops (no money changes hands) since there's no monetization
context outside the platform.

## Deploying / re-deploying to the Apify platform

```bash
npx apify-cli login -t <APIFY_TOKEN>
npx apify-cli push
```

This is exactly how the live Actor linked above was deployed — `apify push`
builds the Dockerfile on the platform and reports the build status.

## Running it perfectly, end to end

1. `npx apify-cli login -t <APIFY_TOKEN>` (needs an Apify account + token from
   [console.apify.com/settings/integrations](https://console.apify.com/settings/integrations)).
2. `npx apify-cli push` from this directory — wait for `"status": "SUCCEEDED"`.
3. Trigger a run: in Console click **Start**, or via API:
   ```bash
   curl -X POST "https://api.apify.com/v2/acts/<actorId>/runs?token=<APIFY_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"maxItemsPerCategory": 8}'
   ```
4. Watch it finish (`GET /v2/actor-runs/<runId>`, or the Console run log),
   then read the results from its dataset (`GET /v2/datasets/<datasetId>/items`,
   or the **Output** tab in Console using the table view from
   `dataset_schema.json`).
5. To feed a consuming app instead of reading the dataset by hand, set
   `APIFY_ACTOR_ID=<actorId>` and `APIFY_TOKEN=<token>` in
   [`../backend/.env`](../backend/.env.example) and run `npm run sync` there
   — see the [root README](../README.md) for the full pipeline
   (`apify-actor → backend → frontend`).
