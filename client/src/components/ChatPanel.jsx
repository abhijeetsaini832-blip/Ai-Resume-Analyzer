import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { analysisApi, errMsg } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Skeleton } from './Skeleton';

const SUGGESTIONS = {
  candidate: [
    'Which of my projects best shows hands-on backend experience?',
    'Do I show evidence of Docker or Kubernetes?',
    'What would a recruiter question most on this resume?',
  ],
  recruiter: [
    'Does this candidate have hands-on experience with Docker or Kubernetes?',
    'Explain the metrics used in their most recent project.',
    'What interview questions would verify their leadership claims?',
  ],
};

/**
 * Contextual chat grounded in one resume.
 * Loads persisted history, appends optimistically, and auto-scrolls.
 */
export default function ChatPanel({ analysisId, mode = 'candidate' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const endRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    let alive = true;
    setLoadingHistory(true);
    analysisApi.chatHistory(analysisId).then((m) => alive && setMessages(m)).catch(() => {}).finally(() => alive && setLoadingHistory(false));
    return () => { alive = false; };
  }, [analysisId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, sending]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: message }]);
    setSending(true);
    try {
      const reply = await analysisApi.chat(analysisId, message);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card flex h-[70vh] min-h-[22rem] flex-col sm:h-[34rem]">
      <div className="flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
        {loadingHistory && <div className="space-y-3"><Skeleton className="h-10 w-2/3" /><Skeleton className="ml-auto h-8 w-1/2" /></div>}

        {!loadingHistory && messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Ask anything about this resume. Answers are grounded in its content only.</p>
            {SUGGESTIONS[mode].map((s) => (
              <button key={s} onClick={() => send(s)} className="block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-brand-500/10">{s}</button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100"><Bot size={15} /></span>}
            <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm sm:max-w-[85%] ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>{m.content}</div>
            {m.role === 'user' && <span className="hidden h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-600 sm:grid dark:bg-slate-700 dark:text-slate-300"><User size={15} /></span>}
          </div>
        ))}

        {sending && (
          <div className="flex gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100"><Loader2 size={14} className="animate-spin" /></span>
            <div className="w-48 space-y-2 rounded-2xl bg-slate-100 p-3 dark:bg-slate-800"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-slate-200 p-2.5 sm:p-3 dark:border-slate-800">
        <input className="input" placeholder="Ask about skills, projects, metrics…" value={input} maxLength={2000} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-primary shrink-0" disabled={sending || !input.trim()} aria-label="Send"><Send size={16} /></button>
      </form>
    </div>
  );
}
