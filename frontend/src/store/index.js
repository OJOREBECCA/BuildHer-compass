import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useStore = create(
  persist(
    (set) => ({
      profile: null,
      apps: {},
      joined: ['sca'],
      reminders: true,
      remindAt: [3, 1, 0],

      toggleRemindAt: (n) =>
        set((s) => ({
          remindAt: s.remindAt.includes(n)
            ? s.remindAt.filter((x) => x !== n)
            : [...s.remindAt, n],
        })),

      setProfile: (profile) => set({ profile }),

      toggleSave: (id) =>
        set((s) => {
          const a = { ...s.apps };
          if (a[id]?.status === 'saved') {
            delete a[id];
          } else if (!a[id]) {
            a[id] = mk(id, 'saved');
          }
          return { apps: a };
        }),

      toggleCheck: (id, k) =>
        set((s) => {
          const a = s.apps[id] ?? mk(id, 'saved');
          return {
            apps: {
              ...s.apps,
              [id]: {
                ...a,
                checklist: {
                  ...a.checklist,
                  [k]: !a.checklist[k],
                },
              },
            },
          };
        }),

      setStatus: (id, st) =>
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
        })),

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
