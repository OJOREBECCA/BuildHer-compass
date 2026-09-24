# BuildHer Compass

An AI-powered opportunity discovery and application companion for African
women in tech: **Discover → Understand → Save → Apply → Track → Submit**.

This repo has three parts:

| Folder | What it is |
| --- | --- |
| [`frontend/`](frontend) | React + Vite app (onboarding, discovery, tracker, deadline compass, AI chat). |
| [`backend/`](backend) | Express API: auth, profiles, applications, and opportunities. |
| [`apify-actor/`](apify-actor) | Apify Actor ("Opportunity Intelligence") that scrapes and structures real opportunities, with Pay-Per-Event monetization. |

## Architecture

```
apify-actor  →  backend (data/db.json)  →  frontend
(scrapes real     (auth, persistence,       (React app the
 opportunities,    match scoring,            user interacts
 PPE-charged)       REST API)                 with)
```

The Actor produces structured opportunities (title, org, category, deadline,
location, eligibility, application link). The backend ingests them, persists
users/profiles/applications, computes a per-user "match %" from the
opportunity and the user's onboarding preferences, and serves it all over a
small REST API. The frontend is unchanged in shape from its original
mock-data build — it talks to the same endpoint contracts either way,
switched by an env var.

## Running everything locally

```bash
# 1. Actor + backend
cd apify-actor && npm install
cd ../backend && npm install
npm run sync        # scrapes live opportunities into backend/data/db.json
npm run dev          # http://localhost:4000

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173
```

By default the frontend runs on mock data. To point it at the real backend,
copy `frontend/.env.example` to `frontend/.env.local` (already git-ignored):

```
VITE_API_URL=http://localhost:4000
VITE_USE_MOCK=false
```

Onboarding, the Tracker, and Profile all read/write through the backend once
`VITE_USE_MOCK=false` — the app silently starts an anonymous ("guest")
session on first load so nothing needs to be signed up front. A user can
later use Sign In with real credentials if they've upgraded that guest
session via `/auth/signup`.

## What's real vs. what's a known scope boundary

- **Real**: scraping (`apify-actor`), the backend API and persistence, auth
  (guest + email/password), per-user match scoring, applications/checklist
  tracking, and an **AI Draft Assistant** on the Apply screen — a real Gemini
  call (`backend/src/gemini.js`) that writes a tailored first-draft personal
  statement from the user's profile + the opportunity, which the user can
  edit and copy. The AI chat endpoint is still a deterministic heuristic over
  real data, not an LLM call.
- **Gemini free tier is small** (20 requests/day *per model*). `gemini.js`
  tries a short list of models (`GEMINI_MODEL`, comma-separated) with retries
  before giving up, and `POST /applications/:id/draft` falls back to a
  template draft if every model is out of quota or overloaded — the feature
  never hard-fails, it just quietly degrades. Add billing to the Gemini key
  for a production-sized quota.
- **Outcome tracking → smarter match.** On the Submitted screen, users can
  report what happened ("I got it! 🎉" / "Not this time"). Those outcomes are
  aggregated *across every account* (`backend/src/outcomes.js`) into a real
  win rate per opportunity, shown on its detail page ("5 Compass applicants
  have applied · 75% got in") and folded into that opportunity's match score
  for everyone (`backend/src/match.js`) — once there's a large enough sample
  (3+ resolved outcomes) to trust it. The match % is partly earned by the
  community's actual results, not just a static heuristic.
- **Calendar export (.ics)**, entirely client-side (`frontend/src/utils/ics.js`,
  no backend involved). Single-opportunity export from the Detail page, and
  bulk export of every tracked deadline from the Deadline Compass and
  Reminder Settings pages — each generated `.ics` includes `VALARM` entries
  matching the user's own reminder settings (3 days / 1 day / on the day),
  so a real calendar app nudges them the same way Compass would.
- **Scope boundary**: onboarding doesn't collect an email/password, so a
  guest account's data is tied to the device/browser unless the user visits
  `/auth/signup` directly to attach credentials (the backend route exists and
  works; there's no Settings UI for it yet). Communities/join state stays
  local-only (not part of the PRD's MVP feature set).

## Apify Actor

**Live and deployed:** [console.apify.com/actors/v3mqraM83U2weoyzM](https://console.apify.com/actors/v3mqraM83U2weoyzM) —
pushed with `apify push`, builds successfully, and a verified platform run
produced real structured opportunities. See
[`apify-actor/README.md`](apify-actor/README.md) for how the scraper works,
its input schema, and the one remaining manual step (turning on Pay-Per-Event
pricing in Console — not exposed over the API).
`backend/scripts/sync-opportunities.js` runs the scraper locally by default
(free, fast); set `APIFY_ACTOR_ID=v3mqraM83U2weoyzM` + `APIFY_TOKEN` in
`backend/.env` to pull from real platform runs instead.

**On a real schedule, not a one-off script.** The Actor also runs on an
[Apify Scheduler](https://console.apify.com/schedules) entry (every 6 hours,
`0 */6 * * *`), independent of anything in this repo — it keeps producing
fresh dataset runs on the platform whether or not the backend is running.
The backend has its own, separate refresh cycle (`backend/src/scheduler.js`,
`SYNC_INTERVAL_MINUTES`, default 60) that re-ingests opportunities on a
timer; `GET /health` reports `opportunitiesSyncedAt` / `nextSyncAt` /
`syncInProgress`, and `POST /sync` triggers one early (rate-limited to avoid
abuse). The Dashboard header shows this live as a "N opportunities · synced
Xm ago" pill with a click-to-refresh action.
