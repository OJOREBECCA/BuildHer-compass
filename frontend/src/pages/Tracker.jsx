import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import { useAllOpportunities, daysLeft } from '../hooks';
import { useStore } from '../store';
import { buildDeadlineICS, downloadICS } from '../utils/ics';
import { Loading, Empty, Urgency, ErrorBox } from '../components';

const tabs = [
  { k: ['saved'], l: 'Saved' },
  { k: ['in_progress', 'applied'], l: 'In Progress' },
  { k: ['submitted'], l: 'Submitted' },
];

export function Tracker() {
  const apps = useStore((s) => s.apps);
  const { data, loading, error } = useAllOpportunities();
  const [t, setT] = useState(0);

  const count = (i) =>
    Object.values(apps).filter((a) => tabs[i].k.includes(a.status)).length;

  const rows = (data ?? []).filter(
    (o) => apps[o.id] && tabs[t].k.includes(apps[o.id].status)
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">Application Tracker</h1>
        <p className="text-slate-500">Track every application in one place</p>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {tabs.map((x, i) => (
          <div key={x.l} className="card">
            <b className="font-display text-2xl">{count(i)}</b>
            <p className="text-xs text-slate-500">{x.l}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex rounded-2xl bg-line/60 p-1">
        {tabs.map((x, i) => (
          <button
            key={x.l}
            role="tab"
            aria-selected={t === i}
            onClick={() => setT(i)}
            className={`flex-1 rounded-xl py-2 text-sm font-medium ${
              t === i ? 'bg-white text-brand shadow-card' : 'text-slate-500'
            }`}
          >
            {x.l}
          </button>
        ))}
      </div>

      {/* Opportunities List */}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox />
      ) : !rows.length ? (
        <Empty text="Nothing here yet. Save an opportunity to start tracking it." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((o) => {
            const outcome = apps[o.id]?.outcome;
            return (
              <div key={o.id} className="card">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <b className="block break-words">{o.title}</b>
                    <p className="truncate text-sm text-slate-500">{o.org}</p>
                  </div>
                  {t === 2 ? (
                    <span
                      className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                        outcome === 'won'
                          ? 'bg-emerald-100 text-emerald-600'
                          : outcome === 'lost'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {outcome === 'won' ? 'Got it 🎉' : outcome === 'lost' ? 'Not this time' : 'Awaiting reply'}
                    </span>
                  ) : (
                    <Urgency days={daysLeft(o.deadline)} />
                  )}
                </div>
                <Link
                  to={t === 2 ? `/opportunity/${o.id}/submitted` : `/opportunity/${o.id}/apply`}
                  className="mt-3 block rounded-xl bg-mist py-3 text-center font-semibold text-brand"
                >
                  {t === 0
                    ? 'Start Application'
                    : t === 1
                    ? 'Continue Application'
                    : 'View Details'}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Deadlines() {
  const { apps, remindAt } = useStore();
  const { data, loading, error } = useAllOpportunities();

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox />;

  const d = [...data].sort(
    (a, b) => +new Date(a.deadline) - +new Date(b.deadline)
  );

  const tracked = d.filter((o) => apps[o.id] && apps[o.id].status !== 'submitted');

  const g = [
    ['Closing Today', d.filter((o) => daysLeft(o.deadline) <= 1), 'text-red-500'],
    [
      'Closing This Week',
      d.filter((o) => {
        const n = daysLeft(o.deadline);
        return n > 1 && n <= 7;
      }),
      'text-orange-500',
    ],
    ['Closing This Month', d.filter((o) => daysLeft(o.deadline) > 7), 'text-brand'],
  ];

  const ring = (n, l, c) => (
    <div className="text-center">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 ${c} font-display text-xl font-bold`}
      >
        {n}
      </div>
      <p className="mt-1 text-xs text-slate-500">{l}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Deadline Compass</h1>
          <p className="text-slate-500">Stay on top of every closing date</p>
        </div>
        {tracked.length > 0 && (
          <button
            type="button"
            onClick={() =>
              downloadICS('buildher-compass-deadlines.ics', buildDeadlineICS(tracked, remindAt))
            }
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-brand shadow-card"
          >
            <CalendarPlus size={14} />
            Add {tracked.length} to Calendar
          </button>
        )}
      </header>

      {/* Summary Rings */}
      <div className="card flex justify-around">
        {ring(g[0][1].length, 'Today', 'border-red-400')}
        {ring(g[1][1].length, 'This week', 'border-orange-400')}
        {ring(g[2][1].length, 'This month', 'border-brand')}
      </div>

      {/* Categorized Lists */}
      {g.map(
        ([title, list, c]) =>
          list.length > 0 && (
            <section key={title}>
              <h2 className={`mb-2 font-semibold ${c}`}>{title}</h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {list.map((o) => (
                  <Link
                    key={o.id}
                    to={`/opportunity/${o.id}`}
                    className="card flex min-w-0 items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <b className="block break-words">{o.title}</b>
                      <p className="truncate text-sm text-slate-500">{o.org}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Urgency days={daysLeft(o.deadline)} />
                      <p className="mt-1 whitespace-nowrap text-xs text-emerald-600">
                        {o.match}% match
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
      )}

      <Link to="/reminders" className="btn block text-center">
        Manage Reminders
      </Link>
    </div>
  );
}
