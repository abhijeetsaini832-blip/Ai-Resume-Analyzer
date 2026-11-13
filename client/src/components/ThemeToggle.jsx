import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/** Sun / Moon switch for dark mode (lives in the top nav bar). */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={`btn-ghost !h-10 !w-10 !p-0 ${className}`}
    >
      {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
    </button>
  );
}
