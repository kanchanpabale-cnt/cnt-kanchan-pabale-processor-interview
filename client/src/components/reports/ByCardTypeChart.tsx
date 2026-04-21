import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ByCardTypeRow } from '../../types/api';
import { cardTypeLabel, formatMoney } from '../../lib/format';

export function ByCardTypeChart({ data }: { data: ByCardTypeRow[] }) {
  const chart = data.map((d) => ({
    type: cardTypeLabel(d.cardType),
    total: Number(d.total),
    count: d.count,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chart} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D8E3F3" />
        <XAxis dataKey="type" stroke="#64748B" fontSize={12} />
        <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value: number) => formatMoney(value)} />
        <Bar dataKey="total" fill="#0E4C90" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
