/**
 * One colour scale for the whole app:
 *   > 75  -> green   |   50-75 -> yellow   |   < 50 -> red
 */
export const scoreTone = (n) => (n > 75 ? 'good' : n >= 50 ? 'warn' : 'bad');

export const SCORE_HEX = { good: '#10b981', warn: '#f59e0b', bad: '#ef4444' };

const TEXT = { good: 'text-emerald-600 dark:text-emerald-400', warn: 'text-amber-600 dark:text-amber-400', bad: 'text-red-600 dark:text-red-400' };
const BAR = { good: 'bg-emerald-500', warn: 'bg-amber-500', bad: 'bg-red-500' };

export const scoreColor = (n) => TEXT[scoreTone(n)];
export const barColor = (n) => BAR[scoreTone(n)];
export const scoreHex = (n) => SCORE_HEX[scoreTone(n)];
