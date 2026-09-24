import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { USE_MOCK } from '../api/client';
import { applicationService, profileService } from '../services';

export const CHECKLIST = [
  'Resume ready',
  'Portfolio / work samples',
  'LinkedIn profile updated',
  'Personal statement written',
  'Reference / recommendation ready',
];

const mk = (id, status) => ({
  opportunityId: id,
  status,
  checklist: {},
});

// Best-effort write-through to the backend. The local store stays the
// source of truth for rendering, so a failed sync never blocks the UI.
const sync = (fn) => {
  if (!USE_MOCK) fn().catch((err) => console.warn('Sync failed:', err.message));
};

export const useStore = create(
  persist(
    (set, get) => ({
      token: null,
      profile: null,
      apps: {},
      joined: ['sca'],
      reminders: true,
      remindAt: [3, 1, 0],

      setToken: (token) => set({ token }),

      toggleRemindAt: (n) =>
        set((s) => ({
          remindAt: s.remindAt.includes(n)
            ? s.remindAt.filter((x) => x !== n)
            : [...s.remindAt, n],
        })),

      setProfile: (profile) => {
        set({ profile });
        sync(() => profileService.put(profile));
      },

      toggleSave: (id) => {
        const unsaving = get().apps[id]?.status === 'saved';
        set((s) => {
          const a = { ...s.apps };
          if (a[id]?.status === 'saved') {
            delete a[id];
          } else if (!a[id]) {
            a[id] = mk(id, 'saved');
          }
          return { apps: a };
        });
        sync(() =>
          unsaving ? applicationService.remove(id) : applicationService.put(id, { status: 'saved' })
        );
      },

      toggleCheck: (id, k) => {
        const current = get().apps[id] ?? mk(id, 'saved');
        const next = !current.checklist[k];
        set((s) => {
          const a = s.apps[id] ?? mk(id, 'saved');
          return {
            apps: {
              ...s.apps,
              [id]: {
                ...a,
                checklist: {
                  ...a.checklist,
                  [k]: next,
                },
              },
            },
          };
        });
        sync(() => applicationService.put(id, { checklist: { [k]: next } }));
      },

      setStatus: (id, st) => {
        set((s) => ({
          apps: {
            ...s.apps,
            [id]: {
              ...(s.apps[id] ?? mk(id, st)),
              status: st,
              ...(st === 'submitted'
                ? { submittedOn: new Date().toISOString() }
                : {}),
            },
          },
        }));
        sync(() => applicationService.put(id, { status: st }));
      },

      // Local-only update, used both for live-typing in the draft textarea
      // and to store the result of a generation call (already persisted
      // server-side by that endpoint, so no extra write-through here).
      setDraftLocal: (id, draft) =>
        set((s) => ({
          apps: {
            ...s.apps,
            [id]: { ...(s.apps[id] ?? mk(id, 'saved')), draft },
          },
        })),

      // Persists the current draft text, e.g. on textarea blur after
      // hand-editing an AI-generated draft.
      syncDraft: (id) => {
        const draft = get().apps[id]?.draft ?? '';
        sync(() => applicationService.put(id, { draft }));
      },

      // outcome is 'won' | 'lost' | null ("still waiting"). Reported
      // outcomes feed back into the community win-rate signal other users
      // see on this opportunity's match score (see backend/src/outcomes.js).
      setOutcome: (id, outcome) => {
        set((s) => ({
          apps: {
            ...s.apps,
            [id]: { ...(s.apps[id] ?? mk(id, 'submitted')), outcome },
          },
        }));
        sync(() => applicationService.put(id, { outcome }));
      },

      toggleJoin: (id) =>
        set((s) => ({
          joined: s.joined.includes(id)
            ? s.joined.filter((x) => x !== id)
            : [...s.joined, id],
        })),

      toggleReminders: () =>
        set((s) => ({
          reminders: !s.reminders,
        })),

      signOut: () =>
        set({
          token: null,
          profile: null,
          apps: {},
          joined: [],
        }),
    }),
    {
      name: 'buildher',
    }
  )
);
