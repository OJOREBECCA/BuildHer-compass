const PREFERENCE_BY_CATEGORY = {
  Internship: 'Internships',
  Scholarship: 'Scholarships',
  Fellowship: 'Fellowships',
  Bootcamp: 'Bootcamps',
  Hackathon: 'Hackathons',
  Volunteering: 'Volunteering',
};

// Below this many resolved outcomes (won + lost), the community win-rate
// signal is too noisy to trust — a single "won" out of 1 shouldn't swing a
// match score the way it would with a real sample.
const MIN_DECIDED_OUTCOMES = 3;

// Small deterministic hash so the same opportunity always gets the same
// "jitter" instead of a score that changes on every request.
function hashJitter(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 9;
}

function computeMatch(profile, opportunity, stats) {
  let score;

  if (!profile) {
    score = 65 + hashJitter(opportunity.id);
  } else {
    score = 55;

    const preference = PREFERENCE_BY_CATEGORY[opportunity.category];
    if (preference && profile.preferences?.includes(preference)) score += 20;

    const country = profile.country;
    if (country && (opportunity.location === country || opportunity.location === 'Remote' || opportunity.location === 'Global' || opportunity.location === 'Africa-wide')) {
      score += 12;
    }

    const text = `${opportunity.title} ${opportunity.description}`.toLowerCase();
    if (profile.interests?.some((i) => text.includes(i.toLowerCase().split(' ')[0]))) score += 8;

    score += hashJitter(opportunity.id) % 5;
  }

  // Real signal, earned by the community: if enough BuildHer Compass users
  // who applied here have reported what happened, nudge the score toward
  // their actual win rate instead of pure heuristics.
  if (stats && stats.won + stats.lost >= MIN_DECIDED_OUTCOMES) {
    score += Math.round((stats.winRate - 0.5) * 20);
  }

  return Math.max(40, Math.min(97, score));
}

module.exports = { computeMatch, MIN_DECIDED_OUTCOMES };
