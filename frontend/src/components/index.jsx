import { Link, NavLink, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  User,
  Sparkles,
  Home,
  Search,
  FileText,
  CalendarClock,
  Loader2,
  Inbox,
  AlertCircle,
} from 'lucide-react';

const nav = [
  { to: '/', label: 'Home', I: Home },
  { to: '/explore', label: 'Explore', I: Search },
  { to: '/tracker', label: 'Tracker', I: FileText },
  { to: '/deadlines', label: 'Deadlines', I: CalendarClock },
  { to: '/community', label: 'Community', I: Users },
  { to: '/profile', label: 'Profile', I: User },
];

export function Shell() {
  const { pathname } = useLocation();
  const hide = pathname.startsWith('/opportunity');

  const link = (cls) =>
    nav.map(({ to, label, I }) => (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        className={({ isActive }) => cls(isActive)}
      >
        <I size={22} />
        <span className="text-xs lg:text-sm">{label}</span>
      </NavLink>
    ));

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden lg:flex">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-2 border-r border-line bg-white p-6 lg:flex">
        <h1 className="mb-6 font-display text-xl font-bold">BuildHer Compass</h1>
        {link((a) =>
          `flex items-center gap-3 rounded-xl px-4 py-3 font-medium ${
            a ? 'bg-mist text-brand' : 'text-slate-500 hover:bg-mist'
          }`
        )}
      </aside>

      {/* Main Content Area */}
      <main
        className={`mx-auto min-w-0 w-full max-w-5xl px-4 py-5 sm:px-5 sm:py-6 lg:px-10 ${
          hide ? '' : 'pb-28'
        } lg:pb-10`}
      >
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Floating Ask Compass AI Button */}
      {pathname !== '/chat' && (
        <Link
          to="/chat"
          aria-label="Ask Compass AI"
          className="fixed bottom-20 right-5 z-20 rounded-full bg-brand p-4 text-white shadow-cta lg:bottom-8"
        >
          <Sparkles />
        </Link>
      )}

      {/* Mobile Bottom Navigation */}
      {!hide && (
        <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-white py-2 lg:hidden">
          {link((a) =>
            `flex flex-col items-center gap-1 px-2 py-1 ${
              a ? 'text-brand' : 'text-slate-400'
            }`
          )}
        </nav>
      )}
    </div>
  );
}

export const Loading = () => (
  <div role="status" className="flex justify-center py-16 text-brand">
    <Loader2 className="animate-spin" />
  </div>
);

export const Empty = ({ text }) => (
  <div className="card flex flex-col items-center gap-2 py-10 text-center text-slate-500">
    <Inbox />
    {text}
  </div>
);

export const ErrorBox = () => (
  <div className="card flex items-center gap-2 text-red-600">
    <AlertCircle size={18} />
    Could not load. Check your connection and try again.
  </div>
);

export const Urgency = ({ days }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
      days <= 1
        ? 'bg-red-100 text-red-600'
        : days <= 7
        ? 'bg-orange-100 text-orange-600'
        : 'bg-amber-100 text-amber-700'
    }`}
  >
    {days <= 1 ? 'Today' : `${days}d left`}
  </span>
);
