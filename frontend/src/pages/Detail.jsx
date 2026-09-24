import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Check,
  X,
  Sparkles,
  CircleCheck,
} from 'lucide-react';
import { useOpportunity, daysLeft } from '../hooks';
import { useStore, CHECKLIST } from '../store';
import { Loading, ErrorBox, Empty } from '../components';

function useOpp() {
  const { id = '' } = useParams();
  const r = useOpportunity(id);
  return { id, ...r };
}

const Guard = ({ r, children }) =>
  r.loading ? (
    <Loading />
  ) : r.error ? (
    <ErrorBox />
  ) : !r.data ? (
    <Empty text="This opportunity no longer exists." />
  ) : (
    children(r.data)
  );

export function Detail() {
  const r = useOpp();
  const nav = useNavigate();
  const { apps, toggleSave } = useStore();

  return (
    <Guard r={r}>
      {(o) => (
        <div className="mx-auto max-w-2xl space-y-4 pb-28">
          {/* Header Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-ink to-brand p-5 text-white">
            <button aria-label="Back" onClick={() => nav(-1)}>
              <ArrowLeft />
            </button>
            <p className="mt-6 text-sm text-white/80">{o.org}</p>
            <h1 className="font-display text-2xl font-bold">{o.title}</h1>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-3 py-1">
                {o.category}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1">
                {o.location}
              </span>
              <span className="rounded-full bg-red-400/30 px-3 py-1">
                {daysLeft(o.deadline)} days left
              </span>
            </div>
          </div>

          {/* AI Summary */}
          <div className="card border border-line bg-mist">
            <p className="mb-2 flex items-center gap-2 font-semibold text-brand">
              <Sparkles size={16} />
              Compass AI Summary
            </p>
            <p className="text-sm">
              {o.summary} <b>{o.match}% match.</b> Apply within {daysLeft(o.deadline)} days.
            </p>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="mb-2 font-display font-semibold">
              About this opportunity
            </h2>
            <p className="text-sm text-slate-600">{o.description}</p>
          </div>

          {/* Eligibility */}
          <div className="card">
            <h2 className="mb-3 font-display font-semibold">
              Eligibility Checklist
            </h2>
            <ul className="space-y-2 text-sm">
              {o.eligibility.map((e) => (
                <li key={e.label} className="flex items-center gap-2">
                  {e.met ? (
                    <Check size={16} className="text-emerald-500" />
                  ) : (
                    <X size={16} className="text-red-500" />
                  )}
                  {e.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="card">
            <h2 className="mb-3 font-display font-semibold">Benefits</h2>
            <div className="flex flex-wrap gap-2">
              {o.benefits.map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-line bg-white p-4 lg:left-64">
            <div className="mx-auto flex w-full max-w-2xl gap-3">
              <button
                aria-label="Save"
                onClick={() => toggleSave(o.id)}
                className="rounded-2xl border border-line p-4"
              >
                <Bookmark
                  className={apps[o.id] ? 'fill-brand text-brand' : ''}
                />
              </button>
              <Link to={`/opportunity/${o.id}/apply`} className="btn text-center">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </Guard>
  );
}

export function Apply() {
  const r = useOpp();
  const nav = useNavigate();
  const { apps, toggleCheck, setStatus } = useStore();
  const a = apps[r.id];
  const ready = CHECKLIST.filter((c) => a?.checklist[c]).length;

  return (
    <Guard r={r}>
      {(o) => (
        <div className="mx-auto max-w-lg space-y-4">
          <button aria-label="Back" onClick={() => nav(-1)}>
            <ArrowLeft />
          </button>
          <h1 className="font-display text-2xl font-bold">{o.title}</h1>

          {/* Checklist Progress */}
          <div className="card">
            <div className="mb-3 flex justify-between font-display font-semibold">
              <span>Application checklist</span>
              <span className="text-sm text-slate-500">{ready} of 5 ready</span>
            </div>
            <div className="mb-4 h-2 rounded-full bg-line">
              <div
                className="h-2 rounded-full bg-brand transition-all"
                style={{ width: `${ready * 20}%` }}
              />
            </div>
            {CHECKLIST.map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center gap-3 py-3"
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#6157F5]"
                  checked={!!a?.checklist[c]}
                  onChange={() => toggleCheck(r.id, c)}
                />
                {c}
              </label>
            ))}
          </div>

          <button
            className="btn"
            onClick={() => {
              setStatus(r.id, 'in_progress');
              window.open(o.url, '_blank', 'noopener');
            }}
          >
            Continue to Application
          </button>

          {ready < 5 && (
            <p className="text-center text-xs text-slate-500">
              {5 - ready} checklist items still to prepare — but you can continue anyway.
            </p>
          )}

          {a?.status === 'in_progress' && (
            <button
              className="w-full rounded-2xl bg-white py-4 font-semibold text-brand shadow-card"
              onClick={() => {
                setStatus(r.id, 'submitted');
                nav(`/opportunity/${r.id}/submitted`, { replace: true });
              }}
            >
              I've submitted my application
            </button>
          )}
        </div>
      )}
    </Guard>
  );
}

export function Submitted() {
  const r = useOpp();
  const a = useStore((s) => s.apps[r.id]);

  return (
    <Guard r={r}>
      {(o) => (
        <div className="mx-auto max-w-md space-y-5 text-center">
          <CircleCheck size={72} className="mx-auto text-emerald-500" />
          <h1 className="font-display text-2xl font-bold">
            Application submitted!
          </h1>

          <div className="card space-y-2 text-left text-sm">
            <b>{o.title}</b>
            <p className="flex justify-between">
              <span>Submitted on</span>
              {a?.submittedOn
                ? new Date(a.submittedOn).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </p>
            <p className="flex justify-between">
              <span>Status</span>
              <span className="text-emerald-600">Under Review</span>
            </p>
          </div>

          <Link to="/tracker" className="btn block">
            View Application Tracker
          </Link>
          <Link to="/explore" className="block text-brand">
            Explore more opportunities
          </Link>
        </div>
      )}
    </Guard>
  );
}
