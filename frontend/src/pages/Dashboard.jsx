import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search, Bookmark, Sparkles, Clock } from 'lucide-react';
import { useOpportunities, daysLeft, useAllOpportunities } from '../hooks';
import { useStore } from '../store';
import { Loading, Empty, ErrorBox } from '../components';

const cats = ['All', 'Fellowship', 'Scholarship', 'Hackathon', 'Internship', 'Bootcamp'];

export function Dashboard({ explore }) {
  const p = useStore((s) => s.profile);
  const { apps, toggleSave } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  const { data, loading, error } = useOpportunities(q, cat);
  const all = useAllOpportunities().data ?? [];
  const closing = all.filter((o) => daysLeft(o.deadline) <= 7).length;
  const top = data?.[0];

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <header className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-slate-500">Good morning</p>
          <h1 className="break-words font-display text-2xl font-bold">
            {p?.firstName} {p?.lastName}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/reminders"
            aria-label="Reminders"
            className="relative rounded-full bg-white p-3 shadow-card"
          >
            <Bell size={20} />
            {closing > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Link>
          <Link
            to="/profile"
            aria-label="Profile"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand font-semibold text-white"
          >
            {(p?.firstName?.[0] ?? '') + (p?.lastName?.[0] ?? '')}
          </Link>
        </div>
      </header>

      {/* Banner (Dashboard only) */}
      {!explore && (
        <div className="rounded-2xl bg-brand p-4 text-white">
          <b>{all.length} new matches today</b>
          <p className="text-sm text-white/80">{closing} closing soon</p>
          <Link
            to="/chat"
            className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-sm"
          >
            Ask AI
          </Link>
        </div>
      )}

      {/* Search Input */}
      <label className="card flex min-w-0 items-center gap-3">
        <Search className="shrink-0 text-slate-400" size={20} />
        <input
          aria-label="Search opportunities"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search opportunities..."
          className="min-w-0 w-full bg-transparent outline-none"
        />
      </label>

      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`chip shrink-0 ${cat === c ? 'chip-on' : ''}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox />
      ) : !data?.length ? (
        <Empty text="No opportunities match your search. Clear the filter to see everything." />
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Featured Card */}
          {!explore && top && (
            <section className="min-w-0">
              <h2 className="mb-3 font-display font-semibold">Featured</h2>
              <div className="rounded-2xl bg-ink p-5 text-white">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 max-w-full truncate">{top.org}</span>
                  <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 text-emerald-300">
                    {top.match}% Match
                  </span>
                </div>
                <h3 className="my-4 break-words font-display text-xl font-bold">
                  {top.title}
                </h3>
                <Link
                  to={`/opportunity/${top.id}`}
                  className="block rounded-xl bg-white py-3 text-center font-semibold text-ink"
                >
                  View Opportunity
                </Link>
              </div>
            </section>
          )}

          {/* Recommended List */}
          <section className={`min-w-0 ${explore ? 'lg:col-span-2' : ''}`}>
            <h2 className="mb-3 font-display font-semibold">
              Recommended For You
            </h2>
            <div
              className={`space-y-3 ${
                explore ? 'lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0' : ''
              }`}
            >
              {data.map((o) => (
                <div
                  key={o.id}
                  className="card flex min-w-0 items-center gap-3"
                >
                  <Link
                    to={`/opportunity/${o.id}`}
                    className="min-w-0 flex-1"
                  >
                    <b className="block truncate">{o.title}</b>
                    <span className="block truncate text-sm text-slate-500">
                      {o.org}
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-mist px-2 py-1 text-brand">
                        {o.category}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock size={12} />
                        {daysLeft(o.deadline)}d left
                      </span>
                    </div>
                  </Link>
                  <button
                    className="shrink-0"
                    aria-label="Save"
                    onClick={() => toggleSave(o.id)}
                  >
                    <Bookmark
                      className={
                        apps[o.id]
                          ? 'fill-brand text-brand'
                          : 'text-slate-400'
                      }
                      size={20}
                    />
                  </button>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                    {o.match}%
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Quick Action Cards (Dashboard only) */}
      {!explore && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link to="/deadlines" className="rounded-2xl bg-amber-100 p-4">
            <Clock className="mb-2 text-amber-600" />
            <b>Deadline Compass</b>
            <p className="text-sm text-slate-600">{closing} closing this week</p>
          </Link>
          <Link to="/chat" className="rounded-2xl bg-white p-4 shadow-card">
            <Sparkles className="mb-2 text-brand" />
            <b>Ask Compass AI</b>
            <p className="text-sm text-slate-500">What should I apply for?</p>
          </Link>
        </div>
      )}
    </div>
  );
}
