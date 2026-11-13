import { useEffect, useRef, useState } from 'react';
import { scoreHex, scoreTone } from '../lib/score';

const R = 42;
const CIRC = 2 * Math.PI * R;
const LABEL = { good: 'Strong', warn: 'Fair', bad: 'Needs work' };

/**
 * Animated circular progress ring.
 * Colour: green > 75, yellow 50-75, red < 50.
 * Size is controlled by the wrapper width class (`className`), so it scales per breakpoint,
 * e.g. className="w-16 sm:w-24". The SVG text scales with it.
 */
export default function ScoreGauge({ value = 0, className = 'w-24', strokeWidth = 9, showMax = false, label, delay = 0 }) {
  const target = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const [shown, setShown] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setShown(target); return undefined; }
    const start = performance.now() + delay;
    const dur = 1000;
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / dur));
      setShown(Math.round(target * (1 - Math.pow(1 - t, 3)))); // easeOutCubic
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, delay]);

  const color = scoreHex(target);
  const offset = CIRC * (1 - shown / 100);

  return (
    <div className={`relative aspect-square ${className}`} role="img" aria-label={`${label ? `${label}: ` : ''}${target} out of 100 (${LABEL[scoreTone(target)]})`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth={strokeWidth} className="stroke-slate-200 dark:stroke-slate-700" />
        <circle
          cx="50" cy="50" r={R} fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
          stroke={color} strokeDasharray={CIRC} strokeDashoffset={offset}
        />
      </svg>
      {/* number is SVG text so it scales with the ring at every breakpoint */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill={color} fontSize={showMax ? 26 : 30} fontWeight="700" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {shown}
          {showMax && <tspan fontSize="11" fontWeight="500" fill="#94a3b8" dx="1">/100</tspan>}
        </text>
      </svg>
    </div>
  );
}
