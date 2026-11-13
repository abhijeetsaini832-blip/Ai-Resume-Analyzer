import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useMediaQuery } from '../lib/hooks';

const AXES = [
  { key: 'technicalSkills', label: 'Technical' },
  { key: 'toolProficiency', label: 'Tools' },
  { key: 'experience', label: 'Experience' },
  { key: 'softSkills', label: 'Soft Skills' },
  { key: 'cultureFit', label: 'Culture Fit' },
];

export const SERIES_COLORS = ['#4f46e5', '#0ea5e9', '#f59e0b'];
const SERIES_COLORS_DARK = ['#818cf8', '#38bdf8', '#fbbf24'];

/**
 * Multi-dimensional profile chart (responsive + theme aware).
 * `series` = [{ name, radar: {technicalSkills,...}, color? }]
 * One series for candidate view; up to 3 for recruiter comparison.
 */
export default function SkillRadar({ series, height = 300 }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const small = useMediaQuery('(max-width: 639px)');

  const data = AXES.map((a) => {
    const row = { axis: a.label };
    series.forEach((s, i) => { row[`s${i}`] = s.radar?.[a.key] ?? 0; });
    return row;
  });

  const palette = dark ? SERIES_COLORS_DARK : SERIES_COLORS;

  return (
    <div className="w-full" style={{ height: small ? Math.min(height, 260) : height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius={small ? '62%' : '72%'} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <PolarGrid stroke={dark ? '#334155' : '#e2e8f0'} />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: small ? 10 : 12, fill: dark ? '#cbd5e1' : '#475569', fontWeight: 600 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={5} tick={{ fontSize: 9, fill: dark ? '#64748b' : '#94a3b8' }} axisLine={false} />
          {series.map((s, i) => {
            const color = s.color || palette[i % palette.length];
            return <Radar key={s.name + i} name={s.name} dataKey={`s${i}`} stroke={color} fill={color} fillOpacity={dark ? 0.35 : 0.25} strokeWidth={2} />;
          })}
          <Tooltip
            contentStyle={{ background: dark ? '#0f172a' : '#fff', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, borderRadius: 12, fontSize: 12, color: dark ? '#e2e8f0' : '#0f172a' }}
            itemStyle={{ color: dark ? '#e2e8f0' : '#0f172a' }}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: small ? 11 : 12 }} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
