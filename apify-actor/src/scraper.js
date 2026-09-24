// Pure scraping logic for the BuildHer Compass Opportunity Intelligence source.
// No Apify-specific calls here so this module can run both inside the Actor
// (wrapped with Actor.init/charge/pushData in main.js) and standalone.

const BASE = 'https://www.opportunitiesforafricans.com';

const UA =
  'Mozilla/5.0 (compatible; BuildHerCompassBot/1.0; +https://github.com/hasbiyallah01/BuildHer-compass)';

// Maps the source site's WordPress categories onto BuildHer Compass's own taxonomy.
const CATEGORY_MAP = {
  internships: 'Internship',
  scholarships: 'Scholarship',
  fellowships: 'Fellowship',
  'training-and-conferences': 'Bootcamp',
  contests: 'Hackathon',
};

const AFRICAN_COUNTRIES = [
  'Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Ethiopia', 'Rwanda', 'Uganda',
  'Tanzania', 'Senegal', 'Cameroon', 'Egypt', 'Morocco', 'Zimbabwe', 'Zambia',
  'Botswana', 'Namibia', 'Malawi', 'Mozambique', 'Sierra Leone', 'Liberia',
  'Gambia', 'Togo', 'Benin', 'Burundi', 'Somalia', 'Sudan', "Cote d'Ivoire",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(500 * (attempt + 1));
    }
  }
}

function slugFromUrl(url) {
  const parts = url.replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || Buffer.from(url).toString('hex').slice(0, 16);
}

function stripOrdinals(s) {
  return s.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
}

const MONTH_DAY_YEAR =
  /([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/;
const DAY_MONTH_YEAR =
  /(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,?\s*\d{4})/;

function parseDeadline(text) {
  if (!text) return null;
  const near = text.match(/Application Deadline:?\s*(.{0,60})/i);
  if (!near) return null;
  if (/rolling|ongoing|not specified|varies/i.test(near[1])) return null;

  const raw = (near[1].match(MONTH_DAY_YEAR) || near[1].match(DAY_MONTH_YEAR) || [])[1];
  if (!raw) return null;

  const cleaned = stripOrdinals(raw).replace(/,\s*$/, '').trim();
  const d = new Date(cleaned);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCHours(23, 59, 0, 0);
  return d.toISOString();
}

function guessOrg(title) {
  const cut = title.split(/\s+(?:20\d{2}|Program|Programme|Fellowship|Scholarship|Internship|Award|Grant|Prize|Challenge|Competition|Bootcamp|Course)\b/i)[0];
  const cleaned = cut.replace(/\s*\(.*?\)\s*$/, '').trim();
  return cleaned.length >= 2 && cleaned.length <= 60 ? cleaned : title.split(' ').slice(0, 4).join(' ');
}

function guessLocation(catNames, bodyText) {
  const hay = `${catNames.join(' ')} ${bodyText.slice(0, 400)}`;
  const country = AFRICAN_COUNTRIES.find((c) => hay.includes(c));
  if (country) return country;
  if (/\bremote\b/i.test(bodyText)) return 'Remote';
  if (/\bglobal\b|\ball nationalities\b|\bworldwide\b/i.test(bodyText)) return 'Global';
  return 'Africa-wide';
}

function extractBulletsAfterHeading(html, headingPattern) {
  // Finds a heading (h2/h3/b/strong or plain paragraph) matching headingPattern
  // and collects the <li> items in the <ul>/<ol> that follows it.
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  const content = $('.entry-content').first();
  if (!content.length) return [];

  let found = false;
  const items = [];
  content.children().each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (!found && headingPattern.test(text) && text.length < 80) {
      found = true;
      return;
    }
    if (found) {
      if (/^(ul|ol)$/i.test(el.tagName)) {
        $el.find('li').each((__, li) => {
          const t = $(li).text().trim();
          if (t) items.push(t);
        });
      } else if (items.length > 0 || /^h[1-6]$/i.test(el.tagName)) {
        return false; // stop at next heading once we've started collecting
      }
    }
  });
  return items.slice(0, 8);
}

function parseDetailPage(html, postUrl) {
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  const content = $('.entry-content').first();
  const bodyText = content.text().replace(/\s+/g, ' ').trim();

  const deadline = parseDeadline(bodyText);

  const paragraphs = content
    .find('p')
    .map((_, p) => $(p).text().trim())
    .get()
    .filter((t) => t && !/^Application Deadline/i.test(t));

  const description = paragraphs.slice(0, 4).join(' ').slice(0, 1400) || bodyText.slice(0, 1400);
  const summary = (paragraphs[0] || bodyText).slice(0, 260);

  const eligibility = extractBulletsAfterHeading(
    html,
    /eligib|who can apply|minimum requirement|requirements/i
  ).map((label) => ({ label, met: true }));

  const benefits = extractBulletsAfterHeading(html, /benefit|what you.?ll get|you will (get|receive)/i);

  let applyUrl = postUrl;
  content.find('a').each((_, a) => {
    const href = $(a).attr('href');
    const text = $(a).text().trim().toLowerCase();
    if (href && (text.includes('apply') || text.includes('official webpage') || text.includes('official website'))) {
      applyUrl = href;
    }
  });

  return { bodyText, deadline, description, summary, eligibility, benefits, applyUrl };
}

async function fetchCategoryListing(categorySlug, page) {
  const cheerio = require('cheerio');
  const url = page > 1
    ? `${BASE}/category/${categorySlug}/page/${page}/`
    : `${BASE}/category/${categorySlug}/`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const posts = [];
  $('article').each((_, el) => {
    const $el = $(el);
    const link = $el.find('h2 a, h1 a, .entry-title a').first();
    const href = link.attr('href');
    const title = link.text().trim();
    if (!href || !title) return;
    const cats = $el
      .find('a[rel="category tag"]')
      .map((__, a) => $(a).text().trim())
      .get();
    posts.push({ url: href, title, cats });
  });
  return posts;
}

/**
 * Scrapes opportunity listings from the configured source categories.
 * @param {{ categories?: string[], maxItemsPerCategory?: number, requestDelayMs?: number }} opts
 * @param {(item: object) => Promise<void>} [onItem] called as each item is extracted, for streaming charge/push.
 */
async function scrapeOpportunities(opts = {}, onItem) {
  const categories = opts.categories?.length ? opts.categories : Object.keys(CATEGORY_MAP);
  const maxItemsPerCategory = opts.maxItemsPerCategory ?? 6;
  const delayMs = opts.requestDelayMs ?? 400;

  const results = [];
  const seen = new Set();

  for (const categorySlug of categories) {
    const categoryLabel = CATEGORY_MAP[categorySlug];
    if (!categoryLabel) continue;

    // Fetch a buffer of raw posts larger than what we need, since some will
    // be filtered out later (expired deadline, unparseable page, etc.).
    const postBuffer = maxItemsPerCategory * 3;
    let page = 1;
    const posts = [];
    while (posts.length < postBuffer && page <= 4) {
      let batch;
      try {
        batch = await fetchCategoryListing(categorySlug, page);
      } catch (err) {
        break;
      }
      if (!batch.length) break;
      posts.push(...batch);
      page += 1;
      await sleep(delayMs);
    }

    let extractedInCategory = 0;
    for (const post of posts) {
      if (extractedInCategory >= maxItemsPerCategory) break;
      if (seen.has(post.url)) continue;
      seen.add(post.url);

      let detail;
      try {
        const html = await fetchHtml(post.url);
        detail = parseDetailPage(html, post.url);
      } catch (err) {
        continue;
      }
      await sleep(delayMs);

      const id = slugFromUrl(post.url);
      const item = {
        id,
        title: post.title,
        org: guessOrg(post.title),
        category: categoryLabel,
        deadline: detail.deadline,
        location: guessLocation(post.cats, detail.bodyText),
        summary: detail.summary,
        description: detail.description,
        eligibility: detail.eligibility.length
          ? detail.eligibility
          : [{ label: 'Open to applicants meeting the criteria in the listing', met: true }],
        benefits: detail.benefits,
        url: detail.applyUrl,
        sourceUrl: post.url,
        source: 'opportunitiesforafricans.com',
        scrapedAt: new Date().toISOString(),
      };

      // Skip items whose deadline has already passed or is unparseable and clearly old.
      if (item.deadline && new Date(item.deadline).getTime() < Date.now() - 864e5) continue;

      results.push(item);
      extractedInCategory += 1;
      if (onItem) await onItem(item);
    }
  }

  return results;
}

module.exports = { scrapeOpportunities, CATEGORY_MAP, parseDeadline, guessOrg };
