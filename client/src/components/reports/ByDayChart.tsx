import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ByDayRow } from '../../types/api';
import { formatMoney } from '../../lib/format';

export function ByDayChart({ data }: { data: ByDayRow[] }) {
  const chart = data.map((d) => ({ date: d.date, total: Number(d.total) }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chart} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="byDayFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E2574C" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#E2574C" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#D8E3F3" />
        <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
        <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value: number) => formatMoney(value)} />
        <Area type="monotone" dataKey="total" stroke="#E2574C" fill="url(#byDayFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
