import { http, endpoints, USE_MOCK } from '../api/client';
import { opportunities, communities } from '../api/mock';

const wait = (v) => new Promise((r) => setTimeout(() => r(v), 500));

export const opportunityService = {
  list: (q = '', cat = 'All') =>
    USE_MOCK
      ? wait(
          opportunities.filter(
            (o) =>
              (cat === 'All' || o.category === cat) &&
              (o.title + o.org).toLowerCase().includes(q.toLowerCase())
          )
        )
      : http(`${endpoints.opportunities}?q=${encodeURIComponent(q)}&category=${cat}`),

  get: (id) =>
    USE_MOCK
      ? wait(opportunities.find((o) => o.id === id))
      : http(endpoints.opportunity(id)),
};

export const communityService = {
  list: () => (USE_MOCK ? wait(communities) : http(endpoints.communities)),
};

export const aiService = {
  reply: async (prompt) => {
    if (!USE_MOCK) {
      const res = await http(endpoints.aiChat, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      return res.text;
    }

    const list = await opportunityService.list();
    const soon = [...list].sort(
      (a, b) => +new Date(a.deadline) - +new Date(b.deadline)
    );
    const p = prompt.toLowerCase();

    if (p.includes('remote')) {
      const r = list.filter((o) => o.location === 'Remote');
      return `Remote picks: ${r.map((o) => `${o.title} (${o.match}% match)`).join('; ')}.`;
    }

    const top = soon.slice(0, 2);
    return `Focus on ${top.map((o) => o.title).join(' and ')}: they close first. Start with the checklist so you're ready to submit.`;
  },
};

// No-ops in mock mode: local zustand state (persisted to localStorage) is
// the only store, so there's nothing on a server to read or write.
export const profileService = {
  get: () => (USE_MOCK ? wait(null) : http(endpoints.profile)),
  put: (profile) =>
    USE_MOCK
      ? wait(profile)
      : http(endpoints.profile, { method: 'PUT', body: JSON.stringify(profile) }),
};

function mockDraft(profile, opportunity, notes) {
  const name = profile?.firstName || 'I';
  const stage = profile?.stage ? profile.stage.toLowerCase() : 'someone building a career in tech';
  const emphasis = notes ? ` I'd also like to highlight ${notes}.` : '';
  return `Dear ${opportunity.org} Selection Committee,\n\nMy name is ${name}, and I'm excited to apply for ${opportunity.title}. As ${stage} interested in ${profile?.interests?.[0] || 'technology'}, this opportunity is exactly where I want to grow next.${emphasis}\n\nThank you for considering my application.\n\nSincerely,\n${name}\n\n[Mock draft — connect the real backend for an AI-generated version tailored to this opportunity.]`;
}

export const applicationService = {
  list: () => (USE_MOCK ? wait({}) : http(endpoints.applications)),
  put: (opportunityId, patch) =>
    USE_MOCK
      ? wait(patch)
      : http(endpoints.application(opportunityId), { method: 'PUT', body: JSON.stringify(patch) }),
  remove: (opportunityId) =>
    USE_MOCK ? wait(null) : http(endpoints.application(opportunityId), { method: 'DELETE' }),
  draft: (opportunityId, notes, { profile, opportunity } = {}) =>
    USE_MOCK
      ? wait({ draft: mockDraft(profile, opportunity, notes), source: 'mock' })
      : http(endpoints.applicationDraft(opportunityId), {
          method: 'POST',
          body: JSON.stringify({ notes }),
        }),
};

export const authService = {
  // Ensures the app is holding a usable session token before it needs to
  // persist anything server-side. Anonymous/guest by default so onboarding
  // doesn't require collecting an email/password up front. http() already
  // attaches any token already in localStorage, so calling this again with
  // an existing valid token just returns that same account.
  ensureSession: () =>
    USE_MOCK ? wait({ token: null, user: null }) : http(endpoints.authGuest, { method: 'POST' }),

  signup: (email, password) =>
    http(endpoints.authSignup, { method: 'POST', body: JSON.stringify({ email, password }) }),

  login: (email, password) =>
    http(endpoints.authLogin, { method: 'POST', body: JSON.stringify({ email, password }) }),
};

// No mock fallback: the sync status indicator only makes sense against a
// real backend, and the Dashboard hides it entirely in mock mode.
export const syncService = {
  status: () => http(endpoints.health),
  trigger: () => http(endpoints.sync, { method: 'POST' }),
};
