import { useEffect, useState } from 'react';

/** Reactive CSS media query, e.g. useMediaQuery('(max-width: 639px)') */
export function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Cycles through status messages while something is loading (for skeleton screens). */
export function useCyclingMessage(messages, active, intervalMs = 3500) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) { setI(0); return undefined; }
    const t = setInterval(() => setI((n) => Math.min(n + 1, messages.length - 1)), intervalMs);
    return () => clearInterval(t);
  }, [active, messages.length, intervalMs]);
  return messages[i];
}

/** Close on Escape (modals / drawers) */
export function useEscape(handler) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handler(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler]);
}

/** Prevent the page behind a modal/drawer from scrolling */
export function useLockBodyScroll(locked = true) {
  useEffect(() => {
    if (!locked) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [locked]);
}
