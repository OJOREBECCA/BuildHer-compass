const BASE = import.meta.env.VITE_API_URL ?? '';
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const endpoints = {
  opportunities: '/opportunities',
  opportunity: (id) => `/opportunities/${id}`,
  applications: '/applications',
  application: (id) => `/applications/${id}`,
  profile: '/profile',
};

// API INTEGRATION: set VITE_API_URL and VITE_USE_MOCK=false. Every service in src/services calls http() with the endpoints above when USE_MOCK is false; response shapes must match src/types.
export async function http(path, init) {
  const r = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!r.ok) throw new Error(r.statusText);
  return r.json();
}
