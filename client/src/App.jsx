import { useState } from 'react';
import { LogOut, Menu, Sparkles, X } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import ModeToggle from './components/ModeToggle';
import ThemeToggle from './components/ThemeToggle';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';

export default function App() {
  const { user, booting, logout } = useAuth();
  // Dual dashboard: persisted so the user returns to the mode they were in
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('mode') || 'candidate'; } catch { return 'candidate'; }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const changeMode = (m) => {
    setMode(m);
    setMenuOpen(false);
    try { localStorage.setItem('mode', m); } catch { /* ignore */ }
  };

  if (booting) return <div className="grid h-screen place-items-center text-slate-500 dark:text-slate-400">Loading…</div>;
  if (!user) return <AuthForm />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white"><Sparkles size={18} /></span>
            ResumeIQ
          </div>

          {/* Desktop / tablet: mode switch in the middle */}
          <div className="hidden md:block"><ModeToggle mode={mode} onChange={changeMode} /></div>

          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="hidden max-w-[10rem] truncate lg:inline">{user.name}</span>
            <ThemeToggle />
            <button onClick={logout} className="btn-ghost hidden !h-10 !px-3 md:inline-flex" title="Log out" aria-label="Log out"><LogOut size={16} /></button>
            {/* Phone: collapsible menu */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="btn-ghost !h-10 !w-10 !p-0 md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="animate-fade-up space-y-3 border-t border-slate-200 px-3 pb-4 pt-3 md:hidden dark:border-slate-800">
            <ModeToggle mode={mode} onChange={changeMode} full />
            <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
              <span className="min-w-0 truncate font-medium">{user.name}</span>
              <button onClick={logout} className="inline-flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400"><LogOut size={15} /> Log out</button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        {/* key forces a clean remount (and state reset) when switching modes */}
        {mode === 'candidate' ? <CandidateDashboard key="c" /> : <RecruiterDashboard key="r" />}
      </main>
    </div>
  );
}
