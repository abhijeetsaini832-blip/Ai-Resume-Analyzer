import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../lib/api';
import ThemeToggle from './ThemeToggle';

export default function AuthForm() {
  const { login, register } = useAuth();
  const toast = useToast();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await (isRegister ? register(form) : login({ email: form.email, password: form.password }));
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center bg-gradient-to-br from-brand-50 via-white to-slate-100 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <ThemeToggle className="absolute right-3 top-3 sm:right-5 sm:top-5" />
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6 sm:p-8">
        <div className="text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white"><Sparkles /></span>
          <h1 className="text-xl font-bold">ResumeIQ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">AI Resume Analyzer & Career Coach</p>
        </div>

        {isRegister && (
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={set('name')} autoComplete="name" required /></div>
        )}
        <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" required /></div>
        <div>
          <label className="label">Password</label>
          <input type="password" minLength={8} className="input" value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} required />
        </div>

        <button className="btn-primary w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" size={16} />} {isRegister ? 'Create account' : 'Sign in'}
        </button>
        <button type="button" onClick={() => setIsRegister(!isRegister)} className="w-full py-1 text-center text-sm text-brand-600 hover:underline dark:text-brand-500">
          {isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </form>
    </div>
  );
}
