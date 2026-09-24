const BASE = import.meta.env.VITE_API_URL ?? '';
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const endpoints = {
  opportunities: '/opportunities',
  opportunity: (id) => `/opportunities/${id}`,
  applications: '/applications',
  application: (id) => `/applications/${id}`,
  applicationDraft: (id) => `/applications/${id}/draft`,
  profile: '/profile',
  communities: '/communities',
  aiChat: '/ai/chat',
  authGuest: '/auth/guest',
  authSignup: '/auth/signup',
  authLogin: '/auth/login',
};

function getToken() {
  try {
    return JSON.parse(localStorage.getItem('buildher') || '{}')?.state?.token ?? null;
  } catch {
    return null;
  }
}

// API INTEGRATION: set VITE_API_URL and VITE_USE_MOCK=false. Every service in src/services calls http() with the endpoints above when USE_MOCK is false; response shapes must match src/types.
export async function http(path, init) {
  const token = getToken();
  const r = await fetch(BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!r.ok) {
    const body = await r.json().catch(() => null);
    throw new Error(body?.error || r.statusText);
  }
  if (r.status === 204) return null;
  return r.json();
}
