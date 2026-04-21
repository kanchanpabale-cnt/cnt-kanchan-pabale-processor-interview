import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { RejectedReasonRow } from '../../types/api';

const PALETTE = ['#E2574C', '#F28C6A', '#B83A30', '#0E4C90', '#4E7FC2', '#64748B', '#AEC4E4'];

function humanize(reason: string): string {
  return reason
    .toLowerCase()
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

export function RejectedByReasonChart({ rows }: { rows: RejectedReasonRow[] }) {
  const data = rows.map((r, i) => ({
    name: humanize(r.reason),
    raw: r.reason,
    value: r.count,
    color: PALETTE[i % PALETTE.length],
  }));
  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr,1.1fr]">
      <div className="relative h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={1.5}
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.raw} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => {
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return [`${value} (${pct}%)`, 'Rejected'];
              }}
              contentStyle={{ borderRadius: 10, border: '1px solid #D8E3F3', fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold text-ink">
            {total.toLocaleString()}
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            rejected
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <li
              key={d.raw}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-brand-100 bg-surface px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                  style={{ backgroundColor: d.color }}
                />
                <span className="truncate font-medium text-ink">{d.name}</span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3 text-ink-muted">
                <span className="tabular-nums">{d.value.toLocaleString()}</span>
                <span className="w-12 text-right font-semibold text-ink">
                  {pct.toFixed(1)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
