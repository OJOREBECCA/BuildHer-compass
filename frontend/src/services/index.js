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
  list: () => (USE_MOCK ? wait(communities) : http('/communities')),
};

export const aiService = {
  reply: async (prompt) => {
    if (!USE_MOCK) {
      const res = await http('/ai/chat', {
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
