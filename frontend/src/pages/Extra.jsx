import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Award, CircleCheck, Lock } from 'lucide-react';
import { useStore, CHECKLIST } from '../store';
import { useAllOpportunities, daysLeft } from '../hooks';
import { Loading, ErrorBox, Empty } from '../components';

const Back = () => {
  const nav = useNavigate();
  return (
    <button aria-label="Back" onClick={() => nav(-1)}>
      <ArrowLeft className="text-brand" />
    </button>
  );
};

const Switch = ({ on, fn, label }) => (
  <button
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={fn}
    className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${
      on ? 'bg-brand' : 'bg-line'
    }`}
  >
    <span
      className={`block h-5 w-5 rounded-full bg-white transition ${
        on ? 'translate-x-5' : ''
      }`}
    />
  </button>
);

export function Forgot() {
  const [e, setE] = useState('');
  const [sent, setSent] = useState(false);
  const ok = /^\S+@\S+\.\S+$/.test(e);

  return (
    <div className="mx-auto max-w-md space-y-5 px-5 py-8">
      <Link to="/login" aria-label="Back">
        <ArrowLeft className="text-brand" />
      </Link>

      {sent ? (
        <div className="space-y-4 text-center">
          <CircleCheck size={64} className="mx-auto text-emerald-500" />
          <h1 className="font-display text-2xl font-bold">Check your email</h1>
          <p className="text-slate-500">
            If {e} has an account, a reset link is on its way.
          </p>
          <Link to="/login" className="btn block">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-display text-3xl font-bold">Reset password</h1>
          <p className="text-slate-500">
            Enter your email and we'll send a reset link.
          </p>
          <label className="relative block text-sm font-medium">
            Email address
            <Mail
              className="absolute left-4 top-[46px] text-slate-400"
              size={18}
            />
            <input
              type="email"
              value={e}
              onChange={(x) => setE(x.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-line bg-white p-4 pl-12 outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          <button className="btn" disabled={!ok} onClick={() => setSent(true)}>
            Send reset link
          </button>
        </>
      )}
    </div>
  );
}

export function Reminders() {
  const { reminders, toggleReminders, remindAt, toggleRemindAt, apps } =
    useStore();
  const { data, loading, error } = useAllOpportunities();

  if (loading) return <Loading />;
  if (error) return <ErrorBox />;

  const opts = [
    [3, '3 days before'],
    [1, '1 day before'],
    [0, 'On the day'],
  ];

  const tracked = (data ?? []).filter(
    (o) => apps[o.id] && apps[o.id].status !== 'submitted'
  );

  const fmt = (d, n) =>
    new Date(+new Date(d) - n * 864e5).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Back />
      <header>
        <h1 className="font-display text-2xl font-bold">Reminder Settings</h1>
        <p className="text-slate-500">
          Choose when Compass nudges you before a deadline
        </p>
      </header>

      <div className="card flex items-center justify-between">
        <b>Deadline reminders</b>
        <Switch
          on={reminders}
          fn={toggleReminders}
          label="Deadline reminders"
        />
      </div>

      <div className={`card divide-y divide-line ${reminders ? '' : 'opacity-50'}`}>
        {opts.map(([n, l]) => (
          <div key={n} className="flex items-center justify-between py-3">
            <span>{l}</span>
            <Switch
              on={remindAt.includes(n)}
              fn={() => reminders && toggleRemindAt(n)}
              label={l}
            />
          </div>
        ))}
      </div>

      <h2 className="font-display font-semibold">
        Scheduled for your tracked opportunities
      </h2>

      {!tracked.length ? (
        <Empty text="Save an opportunity and its reminders will show up here." />
      ) : (
        <div className="space-y-3">
          {tracked.map((o) => (
            <div key={o.id} className="card">
              <b>{o.title}</b>
              <p className="text-sm text-slate-500">
                Closes in {daysLeft(o.deadline)}d
              </p>
              <p className="mt-1 text-sm text-brand">
                {reminders && remindAt.length
                  ? [...remindAt]
                      .sort((a, b) => b - a)
                      .map((n) => fmt(o.deadline, n))
                      .join(', ')
                  : 'Reminders off'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Passport() {
  const { profile: p, apps, joined } = useStore();
  const list = Object.values(apps);

  if (!p) return null;

  const b = [
    ['First save', list.length > 0, 'Save an opportunity'],
    [
      'Prepared',
      list.some((a) => CHECKLIST.every((c) => a.checklist[c])),
      'Complete a full checklist',
    ],
    [
      'Follow-through',
      list.some((a) => a.status === 'submitted'),
      'Submit an application',
    ],
    ['Connected', joined.length > 0, 'Join a community'],
    [
      'Profile pro',
      Boolean(p.linkedin && p.github),
      'Add LinkedIn and GitHub links',
    ],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Back />
      <header>
        <h1 className="font-display text-2xl font-bold">Opportunity Passport</h1>
        <p className="text-slate-500">
          {b.filter((x) => x[1]).length} of {b.length} badges earned
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {b.map(([t, on, d]) => (
          <div
            key={t}
            className={`card flex items-center gap-3 ${on ? '' : 'opacity-50'}`}
          >
            <div
              className={`rounded-xl p-3 ${
                on ? 'bg-brand text-white' : 'bg-line text-slate-400'
              }`}
            >
              {on ? <Award /> : <Lock />}
            </div>
            <div>
              <b>{t}</b>
              <p className="text-sm text-slate-500">{d}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
