import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

/** const toast = useToast(); toast.error('…'); toast.success('…'); toast.info('…') */
export const useToast = () => useContext(ToastContext);

const STYLE = {
  success: { icon: CheckCircle2, cls: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100', ic: 'text-emerald-600 dark:text-emerald-400' },
  error: { icon: AlertCircle, cls: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100', ic: 'text-red-600 dark:text-red-400' },
  info: { icon: Info, cls: 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100', ic: 'text-brand-600 dark:text-brand-500' },
};

function ToastItem({ toast, onClose }) {
  const { icon: Icon, cls, ic } = STYLE[toast.type];
  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-lg ${cls}`}
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${ic}`} />
      <p className="min-w-0 flex-1 break-words">{toast.message}</p>
      <button onClick={() => onClose(toast.id)} aria-label="Dismiss" className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"><X size={15} /></button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((type, message, duration) => {
    if (!message) return;
    setToasts((list) => {
      // Don't stack identical toasts (e.g. the same validation error three times)
      if (list.some((t) => t.type === type && t.message === message)) return list;
      return [...list.slice(-3), { id: ++seq.current, type, message, duration: duration ?? (type === 'error' ? 6500 : 4000) }];
    });
  }, []);

  const api = useMemo(
    () => ({
      success: (m, d) => push('success', m, d),
      error: (m, d) => push('error', m, d),
      info: (m, d) => push('info', m, d),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* bottom-centre on phones (thumb zone), top-right on larger screens */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-16 sm:items-end sm:p-4">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} onClose={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}
